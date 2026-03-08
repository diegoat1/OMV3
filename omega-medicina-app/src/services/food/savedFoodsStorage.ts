// Saved Foods Storage - Local storage for user's saved foods and recipes

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, SavedFood, Recipe, FoodNutrients, RecipeIngredient } from './types';

const SAVED_FOODS_KEY = '@omega_saved_foods';
const RECIPES_KEY = '@omega_recipes';

class SavedFoodsStorage {
  private savedFoods: SavedFood[] = [];
  private recipes: Recipe[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const [foodsData, recipesData] = await Promise.all([
        AsyncStorage.getItem(SAVED_FOODS_KEY),
        AsyncStorage.getItem(RECIPES_KEY),
      ]);
      
      this.savedFoods = foodsData ? JSON.parse(foodsData) : [];
      this.recipes = recipesData ? JSON.parse(recipesData) : [];
      this.initialized = true;
    } catch (error) {
      console.error('Error loading saved foods:', error);
      this.savedFoods = [];
      this.recipes = [];
      this.initialized = true;
    }
  }

  private async saveFoods(): Promise<void> {
    try {
      await AsyncStorage.setItem(SAVED_FOODS_KEY, JSON.stringify(this.savedFoods));
    } catch (error) {
      console.error('Error saving foods:', error);
    }
  }

  private async saveRecipes(): Promise<void> {
    try {
      await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(this.recipes));
    } catch (error) {
      console.error('Error saving recipes:', error);
    }
  }

  // Saved Foods
  async getSavedFoods(): Promise<SavedFood[]> {
    await this.init();
    return [...this.savedFoods];
  }

  async getFavorites(): Promise<SavedFood[]> {
    await this.init();
    return this.savedFoods.filter(f => f.isFavorite);
  }

  async saveFood(food: FoodItem, options?: { customName?: string; notes?: string }): Promise<SavedFood> {
    await this.init();
    
    // Check if already saved
    const existing = this.savedFoods.find(f => f.id === food.id);
    if (existing) {
      // Update existing
      existing.customName = options?.customName || existing.customName;
      existing.notes = options?.notes || existing.notes;
      await this.saveFoods();
      return existing;
    }
    
    const savedFood: SavedFood = {
      ...food,
      savedAt: new Date().toISOString(),
      customName: options?.customName,
      notes: options?.notes,
      isFavorite: false,
    };
    
    this.savedFoods.unshift(savedFood);
    await this.saveFoods();
    return savedFood;
  }

  async removeFood(foodId: string): Promise<void> {
    await this.init();
    this.savedFoods = this.savedFoods.filter(f => f.id !== foodId);
    await this.saveFoods();
  }

  async toggleFavorite(foodId: string): Promise<boolean> {
    await this.init();
    const food = this.savedFoods.find(f => f.id === foodId);
    if (food) {
      food.isFavorite = !food.isFavorite;
      await this.saveFoods();
      return food.isFavorite;
    }
    return false;
  }

  async isSaved(foodId: string): Promise<boolean> {
    await this.init();
    return this.savedFoods.some(f => f.id === foodId);
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    await this.init();
    return [...this.recipes];
  }

  async getRecipe(recipeId: string): Promise<Recipe | null> {
    await this.init();
    return this.recipes.find(r => r.id === recipeId) || null;
  }

  async saveRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'nutrients' | 'totalWeight'>): Promise<Recipe> {
    await this.init();
    
    // Calculate nutrients
    const { nutrients, totalWeight } = this.calculateRecipeNutrients(recipe.ingredients, recipe.servings);
    
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe_${Date.now()}`,
      nutrients,
      totalWeight,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.recipes.unshift(newRecipe);
    await this.saveRecipes();
    return newRecipe;
  }

  async updateRecipe(recipeId: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>): Promise<Recipe | null> {
    await this.init();
    const index = this.recipes.findIndex(r => r.id === recipeId);
    if (index === -1) return null;
    
    const recipe = this.recipes[index];
    
    // Recalculate nutrients if ingredients changed
    if (updates.ingredients || updates.servings) {
      const ingredients = updates.ingredients || recipe.ingredients;
      const servings = updates.servings || recipe.servings;
      const { nutrients, totalWeight } = this.calculateRecipeNutrients(ingredients, servings);
      updates.nutrients = nutrients;
      updates.totalWeight = totalWeight;
    }
    
    this.recipes[index] = {
      ...recipe,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await this.saveRecipes();
    return this.recipes[index];
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    await this.init();
    this.recipes = this.recipes.filter(r => r.id !== recipeId);
    await this.saveRecipes();
  }

  // Calculate recipe nutrients per serving
  private calculateRecipeNutrients(ingredients: RecipeIngredient[], servings: number): { nutrients: FoodNutrients; totalWeight: number } {
    let totalWeight = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;
    let totalSaturatedFat = 0;
    
    for (const ingredient of ingredients) {
      const { food, quantity } = ingredient;
      const factor = quantity / 100; // nutrients are per 100g
      
      totalWeight += quantity;
      
      if (food.nutrients.calories !== null) totalCalories += food.nutrients.calories * factor;
      if (food.nutrients.protein !== null) totalProtein += food.nutrients.protein * factor;
      if (food.nutrients.fat !== null) totalFat += food.nutrients.fat * factor;
      if (food.nutrients.carbs !== null) totalCarbs += food.nutrients.carbs * factor;
      if (food.nutrients.fiber !== null) totalFiber += food.nutrients.fiber * factor;
      if (food.nutrients.sugar !== null) totalSugar += food.nutrients.sugar * factor;
      if (food.nutrients.sodium !== null) totalSodium += food.nutrients.sodium * factor;
      if (food.nutrients.saturatedFat !== null) totalSaturatedFat += food.nutrients.saturatedFat * factor;
    }
    
    // Divide by servings to get per-serving values
    const perServing = (value: number) => Math.round((value / servings) * 10) / 10;
    
    return {
      nutrients: {
        calories: perServing(totalCalories),
        protein: perServing(totalProtein),
        fat: perServing(totalFat),
        carbs: perServing(totalCarbs),
        fiber: perServing(totalFiber),
        sugar: perServing(totalSugar),
        sodium: perServing(totalSodium),
        saturatedFat: perServing(totalSaturatedFat),
      },
      totalWeight,
    };
  }

  // Search in saved foods
  async searchSaved(query: string): Promise<SavedFood[]> {
    await this.init();
    const lowerQuery = query.toLowerCase();
    return this.savedFoods.filter(f => 
      f.name.toLowerCase().includes(lowerQuery) ||
      f.customName?.toLowerCase().includes(lowerQuery) ||
      f.brand?.toLowerCase().includes(lowerQuery)
    );
  }
}

export const savedFoodsStorage = new SavedFoodsStorage();
