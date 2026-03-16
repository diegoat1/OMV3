// Food & Recipe Search - Unified browse with multi-select
// Navigate with ?meal=<key>&date=<YYYY-MM-DD> to add to daily log

import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, Image,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, Check, Barcode, X, Globe, BookOpen } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../../src/constants/theme';
import { BuildBanner } from '../../../src/components/ui';
import { openFoodFactsProvider, FoodItem } from '../../../src/services/food';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionService } from '../../../src/services/api';
import { getFoodEmoji } from '../../../src/utils/foodEmoji';

// ── Unified item (foods + recipes) ────────────────────────────
interface UnifiedItem {
  id: string;
  name: string;
  brand?: string;
  thumbnailUrl?: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber?: number;
  servingSize?: number;
  servingUnit?: string;
  source: 'backend' | 'openfoodfacts' | 'recipe';
  recipeId?: number;
}

function mapBackendFood(row: any): UnifiedItem {
  return {
    id: `be_${row.ID || row.id}`,
    name: row.Largadescripcion || row.nombre || row.name || 'Sin nombre',
    calories: Math.round(((row.P || 0) * 4 + (row.CH || 0) * 4 + (row.G || 0) * 9)),
    protein: row.P || row.proteina || 0,
    fat: row.G || row.grasa || 0,
    carbs: row.CH || row.carbohidratos || 0,
    fiber: row.F || row.fibra || 0,
    servingSize: row.Gramo1 || undefined,
    servingUnit: row.Medidacasera1 || undefined,
    source: 'backend',
  };
}

function mapOFFFood(item: FoodItem): UnifiedItem {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    thumbnailUrl: item.thumbnailUrl,
    calories: item.nutrients.calories || 0,
    protein: item.nutrients.protein || 0,
    fat: item.nutrients.fat || 0,
    carbs: item.nutrients.carbs || 0,
    fiber: item.nutrients.fiber || undefined,
    servingSize: item.servingSize || undefined,
    servingUnit: item.servingUnit || undefined,
    source: 'openfoodfacts',
  };
}

function mapRecipe(r: any): UnifiedItem {
  return {
    id: `rec_${r.id || r.ID}`,
    name: r.nombre || r.NOMBRERECETA || 'Sin nombre',
    calories: Math.round(((r.proteina || 0) * 4 + (r.carbohidratos || 0) * 4 + (r.grasa || 0) * 9)),
    protein: r.proteina || 0,
    fat: r.grasa || 0,
    carbs: r.carbohidratos || 0,
    source: 'recipe',
    recipeId: r.id || r.ID,
  };
}

type TabSource = 'backend' | 'recipes' | 'off';

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: string; date?: string }>();
  const mealContext = params.meal;
  const dateContext = params.date;
  const isFromDailyLog = !!(mealContext && dateContext);

  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabSource>('backend');

  // Multi-select state
  const [selectedItems, setSelectedItems] = useState<Map<string, UnifiedItem>>(new Map());

  // OFF search state
  const [offResults, setOffResults] = useState<UnifiedItem[]>([]);
  const [offLoading, setOffLoading] = useState(false);
  const [offSearched, setOffSearched] = useState(false);

  // ── Fetch backend foods ─────────────────────────────────────
  const { data: backendFoods, isLoading: backendLoading } = useQuery({
    queryKey: ['backendFoods'],
    queryFn: async () => {
      const res = await nutritionService.getFoods('', 500);
      const raw = (res as any)?.data || res;
      const items = Array.isArray(raw) ? raw : (raw as any)?.items || (raw as any)?.foods || [];
      return Array.isArray(items) ? items.map(mapBackendFood) : [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // ── Fetch recipes ───────────────────────────────────────────
  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ['allRecipes'],
    queryFn: async () => {
      const res = await nutritionService.getRecipes();
      const raw = (res as any)?.data || res;
      const items = Array.isArray(raw) ? raw : (raw as any)?.recipes || [];
      return Array.isArray(items) ? items.map(mapRecipe) : [];
    },
    staleTime: 10 * 60 * 1000,
  });

  // ── Filter by search ────────────────────────────────────────
  const filteredBackend = useMemo(() => {
    const list = backendFoods || [];
    if (!searchText.trim()) return list;
    const q = searchText.toLowerCase();
    return list.filter(f =>
      f.name.toLowerCase().includes(q) ||
      (f.brand && f.brand.toLowerCase().includes(q))
    );
  }, [backendFoods, searchText]);

  const filteredRecipes = useMemo(() => {
    const list = recipes || [];
    if (!searchText.trim()) return list;
    const q = searchText.toLowerCase();
    return list.filter(r => r.name.toLowerCase().includes(q));
  }, [recipes, searchText]);

  // ── Display list by active tab ──────────────────────────────
  const displayItems = useMemo(() => {
    if (activeTab === 'backend') return filteredBackend;
    if (activeTab === 'recipes') return filteredRecipes;
    return offResults;
  }, [activeTab, filteredBackend, filteredRecipes, offResults]);

  const isLoading = (activeTab === 'backend' && backendLoading) ||
    (activeTab === 'recipes' && recipesLoading) ||
    (activeTab === 'off' && offLoading);

  // ── OFF search ──────────────────────────────────────────────
  const handleOFFSearch = useCallback(async () => {
    if (!searchText.trim()) return;
    setOffLoading(true);
    setOffSearched(true);
    try {
      const result = await openFoodFactsProvider.searchByText(searchText.trim());
      setOffResults(result.items.map(mapOFFFood));
    } catch (error) {
      console.error('OFF search error:', error);
    } finally {
      setOffLoading(false);
    }
  }, [searchText]);

  // ── Barcode search ──────────────────────────────────────────
  const handleBarcodeSearch = useCallback(async () => {
    if (!barcodeQuery.trim()) return;
    setOffLoading(true);
    try {
      const item = await openFoodFactsProvider.getByBarcode(barcodeQuery.trim());
      if (item) {
        setOffResults([mapOFFFood(item)]);
        setActiveTab('off');
      } else {
        Alert.alert('No encontrado', 'No se encontro un producto con ese codigo de barras.');
      }
    } catch {
      Alert.alert('Error', 'No se pudo buscar el codigo de barras.');
    } finally {
      setOffLoading(false);
      setShowBarcodeInput(false);
      setBarcodeQuery('');
    }
  }, [barcodeQuery]);

  // ── Toggle selection ────────────────────────────────────────
  const toggleSelect = useCallback((item: UnifiedItem) => {
    setSelectedItems(prev => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return next;
    });
  }, []);

  // ── Add to daily log mutation ───────────────────────────────
  const addToLogMutation = useMutation({
    mutationFn: async (items: UnifiedItem[]) => {
      // Get existing log for today
      const res = await nutritionService.getDailyLog(dateContext!);
      const logData = (res as any)?.data || res;
      const existingMeals = logData?.meals || [];
      const existingMeal = existingMeals.find((m: any) => m.meal_key === mealContext);

      let existingFoods: any[] = [];
      if (existingMeal?.foods_json) {
        try {
          existingFoods = typeof existingMeal.foods_json === 'string'
            ? JSON.parse(existingMeal.foods_json) : existingMeal.foods_json;
        } catch { existingFoods = []; }
      }

      // Process recipes: calculate each one, collect resulting foods
      const newFoods: any[] = [];
      let lastRecipeId: number | null = existingMeal?.recipe_id || null;
      let lastRecipeName: string | null = existingMeal?.recipe_name || null;

      for (const item of items) {
        if (item.source === 'recipe' && item.recipeId) {
          try {
            const calcRes = await nutritionService.calculateRecipe(item.recipeId, {
              proteina: existingMeal?.target_p || 0,
              grasa: existingMeal?.target_g || 0,
              carbohidratos: existingMeal?.target_c || 0,
            } as any);
            const calc = ((calcRes as any)?.data || calcRes)?.calculation;
            const allF = calc?.alimentos || [...(calc?.alimentos_variables || []), ...(calc?.alimentos_fijos || [])];
            for (const a of allF) {
              newFoods.push({
                id: `r_${item.recipeId}_${a.nombre}`,
                name: a.nombre || 'Sin nombre',
                quantity_g: a.total_gramos || 100,
                calories: a.calorias || 0,
                protein: a.proteina_g || 0,
                fat: a.grasa_g || 0,
                carbs: a.carbohidratos_g || 0,
              });
            }
            lastRecipeId = item.recipeId;
            lastRecipeName = item.name;
          } catch {
            // Skip failed recipe calculations
          }
        } else {
          // Regular food: add with 100g default, store per-100g macros for solver stability
          newFoods.push({
            id: item.id,
            name: item.name,
            brand: item.brand || undefined,
            quantity_g: 100,
            medida_casera_g: 100,
            calories: Math.round(item.calories),
            protein: Math.round(item.protein * 10) / 10,
            fat: Math.round(item.fat * 10) / 10,
            carbs: Math.round(item.carbs * 10) / 10,
            protein_100g: Math.round(item.protein * 10) / 10,
            fat_100g: Math.round(item.fat * 10) / 10,
            carbs_100g: Math.round(item.carbs * 10) / 10,
          });
        }
      }

      const updatedFoods = [...existingFoods, ...newFoods];
      const totals = updatedFoods.reduce(
        (acc, f) => ({
          cal: acc.cal + (f.calories || 0),
          p: acc.p + (f.protein || 0),
          g: acc.g + (f.fat || 0),
          c: acc.c + (f.carbs || 0),
        }),
        { cal: 0, p: 0, g: 0, c: 0 }
      );

      return nutritionService.saveDailyLog(dateContext!, [{
        meal_key: mealContext!,
        recipe_id: lastRecipeId,
        recipe_name: lastRecipeName,
        foods_json: updatedFoods,
        completed: existingMeal?.completed || false,
        total_p: Math.round(totals.p * 10) / 10,
        total_g: Math.round(totals.g * 10) / 10,
        total_c: Math.round(totals.c * 10) / 10,
        total_cal: Math.round(totals.cal),
        target_p: existingMeal?.target_p || 0,
        target_g: existingMeal?.target_g || 0,
        target_c: existingMeal?.target_c || 0,
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyLog', dateContext] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'No se pudo agregar. Intenta de nuevo.');
    },
  });

  // ── Confirm add all selected ────────────────────────────────
  const handleConfirmAdd = useCallback(() => {
    if (selectedItems.size === 0) return;
    if (!isFromDailyLog) {
      Alert.alert('Info', 'Selecciona una comida primero desde el diario.');
      return;
    }
    addToLogMutation.mutate(Array.from(selectedItems.values()));
  }, [selectedItems, isFromDailyLog, addToLogMutation]);

  const getMealLabel = (key: string) => {
    const labels: Record<string, string> = {
      desayuno: 'Desayuno', media_manana: 'Media Manana',
      almuerzo: 'Almuerzo', merienda: 'Merienda',
      media_tarde: 'Media Tarde', cena: 'Cena',
    };
    return labels[key] || key;
  };

  const selectedCount = selectedItems.size;

  return (
    <View style={styles.container}>
      <BuildBanner />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isFromDailyLog ? 'Agregar a ' + getMealLabel(mealContext!) : 'Buscar Alimento'}
          </Text>
          {isFromDailyLog && (
            <Text style={styles.headerSubtitle}>{dateContext}</Text>
          )}
        </View>
        <Pressable style={styles.barcodeButton} onPress={() => setShowBarcodeInput(!showBarcodeInput)}>
          <Barcode size={24} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={20} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar alimento o receta..."
            placeholderTextColor={Colors.gray400}
            returnKeyType="search"
            onSubmitEditing={activeTab === 'off' ? handleOFFSearch : undefined}
          />
          {searchText.length > 0 && (
            <Pressable onPress={() => { setSearchText(''); setOffResults([]); setOffSearched(false); }}>
              <X size={18} color={Colors.gray400} />
            </Pressable>
          )}
        </View>
        {activeTab === 'off' && (
          <Pressable style={styles.searchButton} onPress={handleOFFSearch} disabled={offLoading}>
            <Globe size={16} color={Colors.white} />
          </Pressable>
        )}
      </View>

      {/* Barcode */}
      {showBarcodeInput && (
        <View style={styles.barcodeContainer}>
          <TextInput
            style={styles.barcodeInput}
            value={barcodeQuery}
            onChangeText={setBarcodeQuery}
            placeholder="Codigo de barras..."
            placeholderTextColor={Colors.gray400}
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={handleBarcodeSearch}
          />
          <Pressable style={styles.barcodeSearchButton} onPress={handleBarcodeSearch}>
            <Search size={18} color={Colors.white} />
          </Pressable>
        </View>
      )}

      {/* Source tabs */}
      <View style={styles.tabsRow}>
        {([
          { key: 'backend' as TabSource, label: 'Alimentos' },
          { key: 'recipes' as TabSource, label: 'Recetas' },
          { key: 'off' as TabSource, label: 'Open Food Facts' },
        ]).map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Item list */}
      <ScrollView style={styles.scrollView} contentContainerStyle={[
        styles.content,
        selectedCount > 0 && { paddingBottom: 140 },
      ]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : displayItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            {activeTab === 'recipes' ? (
              <BookOpen size={48} color={Colors.gray300} />
            ) : (
              <Search size={48} color={Colors.gray300} />
            )}
            <Text style={styles.emptyTitle}>
              {activeTab === 'off' && !offSearched
                ? 'Busca en Open Food Facts'
                : 'Sin resultados'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'off' && !offSearched
                ? 'Escribe un nombre y toca el boton de busqueda'
                : 'Intenta con otro termino'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {displayItems.length} {activeTab === 'recipes' ? 'recetas' : 'alimentos'}
            </Text>
            {displayItems.map((item) => {
              const isSelected = selectedItems.has(item.id);
              const isRecipe = item.source === 'recipe';
              return (
                <Pressable
                  key={item.id}
                  style={[styles.foodCard, isSelected && styles.foodCardSelected]}
                  onPress={() => toggleSelect(item)}
                >
                  <View style={styles.foodRow}>
                    {/* Checkbox */}
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Check size={14} color={Colors.white} />}
                    </View>

                    {/* Icon */}
                    {item.thumbnailUrl ? (
                      <Image source={{ uri: item.thumbnailUrl }} style={styles.foodImage} />
                    ) : (
                      <View style={[styles.foodImagePlaceholder, isRecipe && styles.recipePlaceholder]}>
                        {isRecipe ? (
                          <BookOpen size={18} color={Colors.success} />
                        ) : (
                          <Text style={styles.foodEmojiText}>
                            {getFoodEmoji(item.name)}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Info */}
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.foodMeta}>
                        {isRecipe ? 'Receta' : `${item.calories} kcal`}
                        {item.servingUnit ? ` · ${item.servingUnit}` : ''}
                      </Text>
                    </View>

                    {/* Macros */}
                    {!isRecipe && (
                      <View style={styles.foodMacros}>
                        <Text style={styles.foodMacroText}>
                          {Math.round(item.protein)}P {Math.round(item.carbs)}C {Math.round(item.fat)}G
                        </Text>
                        <Text style={styles.foodPer100}>/ 100g</Text>
                      </View>
                    )}
                  </View>
                  {/* Brand */}
                  {item.source === 'openfoodfacts' && item.brand && (
                    <Text style={styles.foodBrand}>{item.brand}</Text>
                  )}
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ── Floating confirm bar ─────────────────────────────── */}
      {selectedCount > 0 && (
        <View style={styles.floatingBar}>
          <View style={styles.floatingInfo}>
            <Text style={styles.floatingCount}>{selectedCount}</Text>
            <Text style={styles.floatingLabel}>
              {selectedCount === 1 ? 'seleccionado' : 'seleccionados'}
            </Text>
          </View>
          <View style={styles.floatingActions}>
            <Pressable
              style={styles.floatingClearBtn}
              onPress={() => setSelectedItems(new Map())}
            >
              <Text style={styles.floatingClearText}>Limpiar</Text>
            </Pressable>
            <Pressable
              style={styles.floatingConfirmBtn}
              onPress={handleConfirmAdd}
              disabled={addToLogMutation.isPending}
            >
              {addToLogMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.floatingConfirmText}>
                  Agregar ({selectedCount})
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backButton: { padding: Spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.gray500, marginTop: 1 },
  barcodeButton: { padding: Spacing.xs },

  // Search
  searchContainer: {
    flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  searchInputWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.gray50, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text },
  searchButton: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center',
  },

  // Barcode
  barcodeContainer: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    gap: Spacing.sm, backgroundColor: Colors.surface,
  },
  barcodeInput: {
    flex: 1, backgroundColor: Colors.gray50, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.text,
  },
  barcodeSearchButton: {
    backgroundColor: Colors.success, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center',
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: Colors.gray200,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.xs, color: Colors.gray500, fontWeight: '600' },
  tabTextActive: { color: Colors.white },

  // Content
  scrollView: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100 },
  resultsCount: { fontSize: FontSize.xs, color: Colors.gray500, marginBottom: Spacing.sm },

  // Loading/Empty
  loadingContainer: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  loadingText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },

  // Food card
  foodCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  foodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  foodRow: { flexDirection: 'row', alignItems: 'center' },

  // Checkbox
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.gray300,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.sm,
  },
  checkboxSelected: {
    backgroundColor: Colors.primary, borderColor: Colors.primary,
  },

  foodImage: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray100 },
  foodImagePlaceholder: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray200,
    justifyContent: 'center', alignItems: 'center',
  },
  recipePlaceholder: {
    backgroundColor: `${Colors.success}15`,
  },
  foodEmojiText: { fontSize: 22 },
  foodInfo: { flex: 1, marginLeft: Spacing.md },
  foodName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  foodMeta: { fontSize: FontSize.xs, color: Colors.gray500, marginTop: 1 },
  foodMacros: { alignItems: 'flex-end', marginRight: Spacing.sm },
  foodMacroText: { fontSize: FontSize.xs, color: Colors.gray500, fontWeight: '600' },
  foodPer100: { fontSize: 9, color: Colors.gray400 },
  foodBrand: { fontSize: FontSize.xs, color: Colors.gray400, marginTop: 4, marginLeft: 76 },

  // Floating confirm bar
  floatingBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 10,
  },
  floatingInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  floatingCount: {
    fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
    width: 32, height: 32, borderRadius: 16, textAlign: 'center', lineHeight: 32,
  },
  floatingLabel: { fontSize: FontSize.sm, color: Colors.gray500 },
  floatingActions: { flexDirection: 'row', gap: Spacing.sm },
  floatingClearBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg, backgroundColor: Colors.gray200,
  },
  floatingClearText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '600' },
  floatingConfirmBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg, backgroundColor: Colors.primary,
    minWidth: 120, alignItems: 'center',
  },
  floatingConfirmText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '700' },
});
