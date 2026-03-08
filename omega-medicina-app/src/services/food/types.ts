// Food Provider Types - Interface for food database providers

export interface FoodNutrients {
  calories: number | null;      // kcal per 100g
  protein: number | null;       // g per 100g
  fat: number | null;           // g per 100g
  carbs: number | null;         // g per 100g
  fiber: number | null;         // g per 100g
  sugar: number | null;         // g per 100g
  sodium: number | null;        // mg per 100g
  saturatedFat: number | null;  // g per 100g
}

export interface FoodItem {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  nutrients: FoodNutrients;
  servingSize?: number | null;  // g
  servingUnit?: string;
  source: 'openfoodfacts' | 'usda' | 'local' | 'custom';
  sourceId?: string;
  lastUpdated?: string;
}

export interface FoodSearchResult {
  items: FoodItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  query: string;
}

export interface FoodProvider {
  name: string;
  
  // Search foods by text query
  searchByText(query: string, page?: number, pageSize?: number): Promise<FoodSearchResult>;
  
  // Get food by barcode
  getByBarcode(barcode: string): Promise<FoodItem | null>;
  
  // Get detailed nutrients for a food item
  getNutrients(foodId: string): Promise<FoodNutrients | null>;
}

// User's saved foods
export interface SavedFood extends FoodItem {
  savedAt: string;
  customName?: string;
  customServingSize?: number;
  notes?: string;
  isFavorite: boolean;
}

// Recipe types
export interface RecipeIngredient {
  foodId: string;
  food: FoodItem;
  quantity: number;        // in grams
  displayQuantity?: string; // e.g., "1 cup", "2 tbsp"
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  ingredients: RecipeIngredient[];
  servings: number;
  prepTime?: number;       // minutes
  cookTime?: number;       // minutes
  instructions?: string[];
  tags?: string[];
  nutrients: FoodNutrients; // calculated per serving
  totalWeight: number;     // total weight in grams
  createdAt: string;
  updatedAt: string;
}
