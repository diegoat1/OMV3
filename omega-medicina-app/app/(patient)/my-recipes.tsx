// My Recipes - CRUD for recipes with ingredient dependencies
// View, create, edit, delete recipes with base/dependent/fixed ingredients

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  RefreshControl, Alert, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft, ChefHat, Search, Plus, Trash2, Edit3, X,
  Link, Lock, ChevronDown, ChevronUp, Check,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';
import { nutritionService } from '../../src/services/api';

// ─── Types ──────────────────────────────────────────────────
interface RecipeListItem {
  id: number;
  nombre: string;
  categoria: string | null;
  num_ingredientes: number;
}

interface RecipeIngredient {
  id?: number;
  alimento_nombre: string;
  alimento_id?: number;
  medida_tipo?: number;
  rol: 'base' | 'dependiente' | 'fijo';
  base_ingredient_id?: number | null;
  base_index?: number;
  ratio?: number;
  tipo_ratio?: 'peso' | 'medida_casera';
  cantidad_fija?: number;
  // Enriched from backend
  proteina_100g?: number;
  grasa_100g?: number;
  carbohidratos_100g?: number;
  medida_casera_g?: number;
  medida_desc?: string;
}

interface FoodOption {
  id: number;
  name: string;
  protein: number;
  fat: number;
  carbs: number;
}

const CATEGORIA_LABELS: Record<string, string> = {
  desayuno_merienda: 'Desayuno/Merienda',
  almuerzo_cena: 'Almuerzo/Cena',
  ambas: 'Todas',
};

const ROL_LABELS: Record<string, string> = { base: 'Base', dependiente: 'Dependiente', fijo: 'Fijo' };
const ROL_COLORS: Record<string, string> = { base: Colors.primary, dependiente: '#f59e0b', fijo: Colors.gray500 };

// ─── Food Picker Modal ─────────────────────────────────────
function FoodPickerModal({ visible, onClose, onSelect, allFoods, loading }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: FoodOption) => void;
  allFoods: FoodOption[];
  loading: boolean;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    if (!q.trim()) return allFoods.slice(0, 50);
    const lq = q.toLowerCase();
    return allFoods.filter(f => f.name.toLowerCase().includes(lq)).slice(0, 50);
  }, [allFoods, q]);

  useEffect(() => { if (visible) setQ(''); }, [visible]);

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={$.modalOverlay}>
        <View style={$.modalContent}>
          <View style={$.modalHeader}>
            <Text style={$.modalTitle}>Seleccionar alimento</Text>
            <Pressable onPress={onClose}><X size={22} color={Colors.text} /></Pressable>
          </View>
          <View style={$.pickerSearch}>
            <Search size={16} color={Colors.gray400} />
            <TextInput style={$.pickerInput} placeholder="Buscar..." placeholderTextColor={Colors.gray400}
              value={q} onChangeText={setQ} autoFocus />
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={{ maxHeight: 400 }}>
              {filtered.map(f => (
                <Pressable key={f.id} style={$.pickerRow} onPress={() => { onSelect(f); onClose(); }}>
                  <Text style={$.pickerName} numberOfLines={1}>{f.name}</Text>
                  <Text style={$.pickerMacros}>P:{f.protein} G:{f.fat} CH:{f.carbs}</Text>
                </Pressable>
              ))}
              {filtered.length === 0 && <Text style={$.emptyText}>Sin resultados</Text>}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Recipe Editor Modal ────────────────────────────────────
function RecipeEditorModal({ visible, onClose, onSave, editRecipe, allFoods, foodsLoading }: {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editRecipe: { id?: number; nombre: string; categoria: string; ingredientes: RecipeIngredient[] } | null;
  allFoods: FoodOption[];
  foodsLoading: boolean;
}) {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('ambas');
  const [ingredientes, setIngredientes] = useState<RecipeIngredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (visible && editRecipe) {
      setNombre(editRecipe.nombre);
      setCategoria(editRecipe.categoria || 'ambas');
      setIngredientes(editRecipe.ingredientes.map(i => ({ ...i })));
    } else if (visible) {
      setNombre('');
      setCategoria('ambas');
      setIngredientes([]);
    }
  }, [visible, editRecipe]);

  const bases = ingredientes.filter(i => i.rol === 'base');

  const addIngredient = useCallback((food: FoodOption) => {
    const defaultRol = ingredientes.length === 0 ? 'base' as const : 'dependiente' as const;
    setIngredientes(prev => [...prev, {
      alimento_nombre: food.name,
      alimento_id: food.id,
      rol: defaultRol,
      ratio: 1,
      tipo_ratio: 'peso',
      cantidad_fija: 1,
      base_index: 0,
    }]);
  }, [ingredientes.length]);

  const removeIngredient = (idx: number) => {
    setIngredientes(prev => prev.filter((_, i) => i !== idx));
  };

  const updateIngredient = (idx: number, updates: Partial<RecipeIngredient>) => {
    setIngredientes(prev => prev.map((ing, i) => i === idx ? { ...ing, ...updates } : ing));
  };

  const cycleRol = (idx: number) => {
    const roles: RecipeIngredient['rol'][] = ['base', 'dependiente', 'fijo'];
    const current = ingredientes[idx].rol;
    const next = roles[(roles.indexOf(current) + 1) % roles.length];
    updateIngredient(idx, { rol: next });
  };

  const handleSave = async () => {
    if (!nombre.trim()) { Alert.alert('Error', 'Ingresa un nombre para la receta.'); return; }
    if (ingredientes.length < 2) { Alert.alert('Error', 'Agrega al menos 2 ingredientes.'); return; }
    if (bases.length === 0) { Alert.alert('Error', 'Necesitas al menos un ingrediente base.'); return; }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        categoria,
        ingredientes: ingredientes.map(i => ({
          alimento_nombre: i.alimento_nombre,
          alimento_id: i.alimento_id,
          medida_tipo: i.medida_tipo || 0,
          rol: i.rol,
          ...(i.rol === 'dependiente' ? {
            base_index: i.base_index || 0,
            ratio: i.ratio || 1,
            tipo_ratio: i.tipo_ratio || 'peso',
          } : {}),
          ...(i.rol === 'fijo' ? { cantidad_fija: i.cantidad_fija || 1 } : {}),
        })),
      };

      if (editRecipe?.id) {
        await nutritionService.updateRecipe(editRecipe.id, payload);
      } else {
        await nutritionService.createRecipe(payload);
      }
      onSave();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar la receta.');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={$.modalOverlay}>
        <View style={[$.modalContent, { maxHeight: '90%' }]}>
          <View style={$.modalHeader}>
            <Text style={$.modalTitle}>{editRecipe?.id ? 'Editar receta' : 'Nueva receta'}</Text>
            <Pressable onPress={onClose}><X size={22} color={Colors.text} /></Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <Text style={$.fieldLabel}>Nombre</Text>
            <TextInput style={$.fieldInput} value={nombre} onChangeText={setNombre}
              placeholder="Ej: Panqueques de proteina" placeholderTextColor={Colors.gray400} />

            {/* Category */}
            <Text style={$.fieldLabel}>Categoria</Text>
            <View style={$.catRow}>
              {(['desayuno_merienda', 'almuerzo_cena', 'ambas'] as const).map(c => (
                <Pressable key={c} style={[$.catChip, categoria === c && $.catChipActive]}
                  onPress={() => setCategoria(c)}>
                  <Text style={[$.catChipText, categoria === c && $.catChipTextActive]}>
                    {CATEGORIA_LABELS[c]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Ingredients */}
            <View style={$.ingHeader}>
              <Text style={$.fieldLabel}>Ingredientes ({ingredientes.length})</Text>
              <Pressable style={$.addIngBtn} onPress={() => setShowFoodPicker(true)}>
                <Plus size={16} color={Colors.white} />
                <Text style={$.addIngText}>Agregar</Text>
              </Pressable>
            </View>

            {ingredientes.length === 0 && (
              <Text style={[$.emptyText, { marginVertical: Spacing.md }]}>
                Agrega ingredientes tocando el boton +
              </Text>
            )}

            {ingredientes.map((ing, idx) => (
              <View key={idx} style={$.ingCard}>
                <View style={$.ingRow1}>
                  <View style={{ flex: 1 }}>
                    <Text style={$.ingName} numberOfLines={1}>{ing.alimento_nombre}</Text>
                  </View>
                  <Pressable style={[$.rolBadge, { backgroundColor: ROL_COLORS[ing.rol] + '20' }]}
                    onPress={() => cycleRol(idx)}>
                    <Text style={[$.rolText, { color: ROL_COLORS[ing.rol] }]}>{ROL_LABELS[ing.rol]}</Text>
                  </Pressable>
                  <Pressable style={$.ingDelete} onPress={() => removeIngredient(idx)}>
                    <Trash2 size={14} color={Colors.error} />
                  </Pressable>
                </View>

                {/* Dependent config */}
                {ing.rol === 'dependiente' && bases.length > 0 && (
                  <View style={$.depConfig}>
                    <View style={$.depRow}>
                      <Link size={12} color="#f59e0b" />
                      <Text style={$.depLabel}>Depende de:</Text>
                      <View style={$.depSelect}>
                        {bases.map((b, bIdx) => {
                          const realIdx = ingredientes.indexOf(b);
                          return (
                            <Pressable key={realIdx}
                              style={[$.depOption, ing.base_index === realIdx && $.depOptionActive]}
                              onPress={() => updateIngredient(idx, { base_index: realIdx })}>
                              <Text style={[$.depOptionText, ing.base_index === realIdx && { color: Colors.white }]}
                                numberOfLines={1}>
                                {b.alimento_nombre.slice(0, 15)}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                    <View style={$.depRow}>
                      <Text style={$.depLabel}>Ratio:</Text>
                      <TextInput style={$.depInput} keyboardType="decimal-pad"
                        value={String(ing.ratio || 1)}
                        onChangeText={t => updateIngredient(idx, { ratio: parseFloat(t) || 0 })} />
                      <View style={$.tipoRow}>
                        {(['peso', 'medida_casera'] as const).map(t => (
                          <Pressable key={t}
                            style={[$.tipoChip, ing.tipo_ratio === t && $.tipoChipActive]}
                            onPress={() => updateIngredient(idx, { tipo_ratio: t })}>
                            <Text style={[$.tipoText, ing.tipo_ratio === t && { color: Colors.white }]}>
                              {t === 'peso' ? 'Peso' : 'Med. casera'}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                )}

                {/* Fixed config */}
                {ing.rol === 'fijo' && (
                  <View style={$.depConfig}>
                    <View style={$.depRow}>
                      <Lock size={12} color={Colors.gray500} />
                      <Text style={$.depLabel}>Cantidad fija:</Text>
                      <TextInput style={$.depInput} keyboardType="decimal-pad"
                        value={String(ing.cantidad_fija || 1)}
                        onChangeText={t => updateIngredient(idx, { cantidad_fija: parseFloat(t) || 0 })} />
                      <Text style={$.depLabel}>porciones</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}

            <View style={{ height: Spacing.xl }} />
          </ScrollView>

          {/* Save button */}
          <Pressable style={[$.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={Colors.white} /> : (
              <><Check size={18} color={Colors.white} /><Text style={$.saveBtnText}>Guardar receta</Text></>
            )}
          </Pressable>
        </View>
      </View>

      <FoodPickerModal visible={showFoodPicker} onClose={() => setShowFoodPicker(false)}
        onSelect={addIngredient} allFoods={allFoods} loading={foodsLoading} />
    </Modal>
  );
}

// ─── Main Screen ────────────────────────────────────────────
export default function MyRecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editRecipe, setEditRecipe] = useState<{
    id?: number; nombre: string; categoria: string; ingredientes: RecipeIngredient[];
  } | null>(null);

  // All foods for picker
  const [allFoods, setAllFoods] = useState<FoodOption[]>([]);
  const [foodsLoading, setFoodsLoading] = useState(false);

  const loadFoods = useCallback(async () => {
    if (allFoods.length > 0) return;
    setFoodsLoading(true);
    try {
      const res = await nutritionService.getFoods('', 500);
      const raw = (res as any)?.data || res;
      const items = Array.isArray(raw) ? raw : (raw as any)?.items || [];
      setAllFoods(items.map((f: any) => ({
        id: f.ID || f.id,
        name: f.Largadescripcion || f.nombre || f.name || '',
        protein: f.P || f.proteina || 0,
        fat: f.G || f.grasa || 0,
        carbs: f.CH || f.carbohidratos || 0,
      })));
    } catch { }
    finally { setFoodsLoading(false); }
  }, [allFoods.length]);

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await nutritionService.getRecipes(searchQuery || undefined);
      const raw = (res as any)?.data || res;
      const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      setRecipes(items);
    } catch { }
    finally { setIsLoading(false); }
  }, [searchQuery]);

  useFocusEffect(useCallback(() => { loadRecipes(); }, [loadRecipes]));

  const toggleExpand = useCallback(async (id: number) => {
    if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); return; }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      const res = await nutritionService.getRecipe(id);
      const data = (res as any)?.data || res;
      setExpandedDetail(data?.recipe || data);
    } catch { setExpandedDetail(null); }
    finally { setDetailLoading(false); }
  }, [expandedId]);

  const handleCreate = useCallback(() => {
    loadFoods();
    setEditRecipe(null);
    setShowEditor(true);
  }, [loadFoods]);

  const handleEdit = useCallback(async (id: number) => {
    loadFoods();
    try {
      const res = await nutritionService.getRecipe(id);
      const data = (res as any)?.data || res;
      const recipe = data?.recipe || data;
      setEditRecipe({
        id: recipe.id,
        nombre: recipe.nombre,
        categoria: recipe.categoria || 'ambas',
        ingredientes: (recipe.ingredientes || []).map((i: any, idx: number) => ({
          ...i,
          base_index: i.base_ingredient_id
            ? (recipe.ingredientes || []).findIndex((b: any) => b.id === i.base_ingredient_id)
            : 0,
        })),
      });
      setShowEditor(true);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la receta.');
    }
  }, [loadFoods]);

  const handleDelete = useCallback((id: number, nombre: string) => {
    Alert.alert('Eliminar receta', `Seguro que quieres eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await nutritionService.deleteRecipe(id);
            loadRecipes();
            if (expandedId === id) { setExpandedId(null); setExpandedDetail(null); }
          } catch { Alert.alert('Error', 'No se pudo eliminar.'); }
        }
      },
    ]);
  }, [loadRecipes, expandedId]);

  const handleEditorSave = useCallback(() => {
    loadRecipes();
    setExpandedId(null);
    setExpandedDetail(null);
  }, [loadRecipes]);

  return (
    <View style={styles.container}>
      <BuildBanner />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Recetas ({recipes.length})</Text>
        <Pressable style={styles.createBtn} onPress={handleCreate}>
          <Plus size={20} color={Colors.white} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={Colors.gray400} />
          <TextInput style={styles.searchInput} placeholder="Buscar receta..."
            placeholderTextColor={Colors.gray400} value={searchQuery}
            onChangeText={setSearchQuery} onSubmitEditing={loadRecipes} returnKeyType="search" />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); }}><X size={16} color={Colors.gray400} /></Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadRecipes} />}>
        {recipes.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <ChefHat size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Sin recetas</Text>
            <Text style={styles.emptyText}>Crea tu primera receta con el boton +</Text>
          </View>
        ) : (
          recipes.map(recipe => {
            const isExpanded = expandedId === recipe.id;
            return (
              <View key={recipe.id} style={styles.recipeCard}>
                <Pressable style={styles.recipeHeader} onPress={() => toggleExpand(recipe.id)}>
                  <View style={styles.recipeIcon}>
                    <ChefHat size={22} color={Colors.primary} />
                  </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName} numberOfLines={2}>{recipe.nombre}</Text>
                    <View style={styles.recipeMeta}>
                      <Text style={styles.recipeMetaText}>
                        {recipe.num_ingredientes} ing. | {CATEGORIA_LABELS[recipe.categoria || 'ambas'] || recipe.categoria}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recipeActions}>
                    <Pressable style={styles.actionBtn} onPress={() => handleEdit(recipe.id)}>
                      <Edit3 size={16} color={Colors.primary} />
                    </Pressable>
                    <Pressable style={styles.actionBtn} onPress={() => handleDelete(recipe.id, recipe.nombre)}>
                      <Trash2 size={16} color={Colors.error} />
                    </Pressable>
                    {isExpanded
                      ? <ChevronUp size={18} color={Colors.gray400} />
                      : <ChevronDown size={18} color={Colors.gray400} />}
                  </View>
                </Pressable>

                {/* Expanded detail */}
                {isExpanded && (
                  <View style={styles.detailSection}>
                    {detailLoading ? (
                      <ActivityIndicator size="small" color={Colors.primary} style={{ padding: Spacing.md }} />
                    ) : expandedDetail?.ingredientes ? (
                      expandedDetail.ingredientes.map((ing: any, i: number) => (
                        <View key={i} style={styles.ingDetailRow}>
                          <View style={[styles.ingDot, { backgroundColor: ROL_COLORS[ing.rol] || Colors.gray400 }]} />
                          <Text style={styles.ingDetailName} numberOfLines={1}>{ing.alimento_nombre}</Text>
                          <Text style={styles.ingDetailRol}>{ROL_LABELS[ing.rol] || ing.rol}</Text>
                          {ing.rol === 'dependiente' && (
                            <Text style={styles.ingDetailRatio}>x{ing.ratio}</Text>
                          )}
                          {ing.rol === 'fijo' && (
                            <Text style={styles.ingDetailRatio}>{ing.cantidad_fija}p</Text>
                          )}
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>No se pudo cargar el detalle</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <RecipeEditorModal visible={showEditor} onClose={() => setShowEditor(false)}
        onSave={handleEditorSave} editRecipe={editRecipe} allFoods={allFoods} foodsLoading={foodsLoading} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: Spacing.xs },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  createBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  // Search
  searchRow: { flexDirection: 'row', padding: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text },
  // Content
  scrollView: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100 },
  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginTop: Spacing.md },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  // Recipe Card
  recipeCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  recipeHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  recipeIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  recipeInfo: { flex: 1, marginLeft: Spacing.md },
  recipeName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  recipeMeta: { flexDirection: 'row', marginTop: 2 },
  recipeMetaText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  recipeActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionBtn: { padding: Spacing.xs },
  // Detail
  detailSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  ingDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: Spacing.sm },
  ingDot: { width: 8, height: 8, borderRadius: 4 },
  ingDetailName: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  ingDetailRol: { fontSize: FontSize.xs, color: Colors.textSecondary },
  ingDetailRatio: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', minWidth: 30, textAlign: 'right' },
});

// ── Editor styles ───────────────────────────────────────────
const $ = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  // Fields
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  fieldInput: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  // Category
  catRow: { flexDirection: 'row', gap: Spacing.sm },
  catChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.sm, color: Colors.text },
  catChipTextActive: { color: Colors.white, fontWeight: '600' },
  // Ingredients header
  ingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  addIngBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md },
  addIngText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '600' },
  // Ingredient card
  ingCard: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.sm, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  ingRow1: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ingName: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.text },
  rolBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 10 },
  rolText: { fontSize: FontSize.xs, fontWeight: '600' },
  ingDelete: { padding: 4 },
  // Dependency config
  depConfig: { marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  depRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs, flexWrap: 'wrap' },
  depLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  depSelect: { flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' },
  depOption: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  depOptionActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  depOptionText: { fontSize: FontSize.xs, color: Colors.text },
  depInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2, fontSize: FontSize.sm, color: Colors.text, borderWidth: 1, borderColor: Colors.border, width: 60, textAlign: 'center' },
  tipoRow: { flexDirection: 'row', gap: 4 },
  tipoChip: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  tipoChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tipoText: { fontSize: FontSize.xs, color: Colors.text },
  // Save
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.md },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  // Food picker
  pickerSearch: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  pickerInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerName: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  pickerMacros: { fontSize: FontSize.xs, color: Colors.textSecondary, marginLeft: Spacing.sm },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: FontSize.sm },
});
