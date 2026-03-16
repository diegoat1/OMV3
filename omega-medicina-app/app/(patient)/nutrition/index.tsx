// Patient Nutrition - Daily food log
// Swipe delete, meal config, recipe/food choice, food emoji, water tracking,
// per-food checkmarks, per-meal complete, calculate, editable quantities

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, Alert, Modal, TextInput, Animated, PanResponder,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus, Minus, ChevronLeft, ChevronRight, Check, Settings,
  Calculator, Droplets,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../../src/constants/theme';
import { BuildBanner } from '../../../src/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../src/contexts/AuthContext';
import { nutritionService, analyticsService, DailyMealLog } from '../../../src/services/api';
import { getFoodEmoji } from '../../../src/utils/foodEmoji';
import Svg, { Path, Circle as SvgCircle, Ellipse } from 'react-native-svg';

// ─── Meal definitions ────────────────────────────────────────────
const MEAL_META: Record<string, { label: string; icon: string }> = {
  desayuno:     { label: 'Desayuno',     icon: '\u2600' },
  media_manana: { label: 'Media Manana', icon: '\uD83C\uDF4E' },
  almuerzo:     { label: 'Almuerzo',     icon: '\uD83C\uDF5D' },
  merienda:     { label: 'Merienda',     icon: '\u2615' },
  media_tarde:  { label: 'Media Tarde',  icon: '\uD83E\uDDC3' },
  cena:         { label: 'Cena',         icon: '\uD83C\uDF19' },
};
const MEAL_KEYS = ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'media_tarde', 'cena'] as const;

type MealSize5 = 'extra_small' | 'small' | 'medium' | 'large' | 'extra_large';
const SIZE_LABELS: Record<MealSize5, string> = {
  extra_small: 'MP', small: 'P', medium: 'M', large: 'G', extra_large: 'MG',
};
const SIZE_ORDER: MealSize5[] = ['extra_small', 'small', 'medium', 'large', 'extra_large'];
type MealConfigState = Record<string, { enabled: boolean; size: MealSize5 }>;

const defaultMealConfigs = (): MealConfigState => {
  const cfg: MealConfigState = {};
  const defaults: Record<string, MealSize5> = {
    desayuno: 'medium', media_manana: 'small', almuerzo: 'large',
    merienda: 'small', media_tarde: 'small', cena: 'medium',
  };
  MEAL_KEYS.forEach(key => { cfg[key] = { enabled: key !== 'media_tarde', size: defaults[key] || 'medium' }; });
  return cfg;
};

// ─── Helpers ─────────────────────────────────────────────────────
const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
function getWeekDates(anchor: Date): Date[] {
  const day = anchor.getDay();
  const mon = new Date(anchor);
  mon.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d; });
}
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }

// ─── Food types ──────────────────────────────────────────────────
interface LoggedFood {
  id: string; name: string; brand?: string;
  quantity_g: number; unit?: string;
  medida_casera_g?: number; // stable serving size for solver (never changes)
  calories: number; protein: number; fat: number; carbs: number;
  protein_100g?: number; fat_100g?: number; carbs_100g?: number;
  eaten?: boolean;
}

function parseFoodsJson(raw: any): LoggedFood[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr.map((f: any) => {
      const qty = f.quantity_g || f.total_gramos || 100;
      const prot = f.protein || f.proteina_g || 0;
      const fat = f.fat || f.grasa_g || 0;
      const carb = f.carbs || f.carbohidratos_g || 0;
      const factor = qty > 0 ? 100 / qty : 1;
      return {
        id: f.id || f.nombre || String(Math.random()),
        name: f.name || f.nombre || 'Sin nombre',
        brand: f.brand || f.marca || undefined,
        quantity_g: qty,
        unit: f.unit || f.medida_desc || undefined,
        medida_casera_g: f.medida_casera_g ?? qty,
        calories: f.calories || f.calorias || 0,
        protein: prot, fat, carbs: carb,
        protein_100g: f.protein_100g ?? f.proteina_100g ?? Math.round(prot * factor * 10) / 10,
        fat_100g: f.fat_100g ?? f.grasa_100g ?? Math.round(fat * factor * 10) / 10,
        carbs_100g: f.carbs_100g ?? f.carbohidratos_100g ?? Math.round(carb * factor * 10) / 10,
        eaten: f.eaten ?? false,
      };
    });
  } catch { return []; }
}

interface MealData {
  meal_key: string; foods: LoggedFood[]; completed: boolean;
  target_p: number; target_g: number; target_c: number;
  recipe_id?: number | null; recipe_name?: string | null;
}

function mealTotals(foods: LoggedFood[]) {
  let cal = 0, p = 0, g = 0, c = 0;
  for (const f of foods) {
    if (f.eaten === false) continue;
    cal += f.calories; p += f.protein; g += f.fat; c += f.carbs;
  }
  return { cal: Math.round(cal), p: Math.round(p), g: Math.round(g), c: Math.round(c) };
}

// ─── CalorieArc ──────────────────────────────────────────────────
function CalorieArc({ consumed, target }: { consumed: number; target: number }) {
  const size = 200, stroke = 12, r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const startAngle = 150, span = 240;
  const pct = target > 0 ? Math.min(consumed / target, 1.15) : 0;
  const endAngle = startAngle + span * Math.min(pct, 1);
  const pol = (a: number) => ({ x: cx + r * Math.cos((a * Math.PI) / 180), y: cy + r * Math.sin((a * Math.PI) / 180) });
  const bgS = pol(startAngle), bgE = pol(startAngle + span);
  const bgP = `M ${bgS.x} ${bgS.y} A ${r} ${r} 0 1 1 ${bgE.x} ${bgE.y}`;
  const fgE = pol(endAngle);
  const la = (endAngle - startAngle) > 180 ? 1 : 0;
  const fgP = pct > 0 ? `M ${bgS.x} ${bgS.y} A ${r} ${r} 0 ${la} 1 ${fgE.x} ${fgE.y}` : '';
  const lP = pol(startAngle + span * 0.9), hP = pol(startAngle + span * 1);
  const col = pct > 1.05 ? Colors.warning : pct >= 0.85 ? Colors.success : Colors.primary;
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`}>
        <Path d={bgP} stroke={Colors.gray200} strokeWidth={stroke} fill="none" strokeLinecap="round" />
        {fgP ? <Path d={fgP} stroke={col} strokeWidth={stroke} fill="none" strokeLinecap="round" /> : null}
        <SvgCircle cx={lP.x} cy={lP.y} r={3} fill={Colors.gray400} />
        <SvgCircle cx={hP.x} cy={hP.y} r={3} fill={Colors.gray400} />
      </Svg>
      <View style={styles.arcCenter}>
        <Text style={styles.arcConsumed}>{consumed}</Text>
        <Text style={styles.arcTarget}>/ {target} kcal</Text>
      </View>
      <View style={styles.arcMarkers}>
        <Text style={styles.arcMarkerText}>{Math.round(target * 0.9)}</Text>
        <Text style={styles.arcMarkerText}>{Math.round(target * 1.1)}</Text>
      </View>
    </View>
  );
}

function MacroBar({ label, current, target, color }: { label: string; current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(current / target, 1) : 0;
  return (
    <View style={styles.macroBarRow}>
      <View style={styles.macroBarLabel}>
        <Text style={[styles.macroBarName, { color }]}>{label}</Text>
        <Text style={styles.macroBarValues}>{Math.round(current)} / {target} g</Text>
      </View>
      <View style={styles.macroBarTrack}>
        <View style={[styles.macroBarFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── Swipeable food row ──────────────────────────────────────────
function SwipeableFoodRow({ food, onDelete, onToggleEaten, onEditQty }: {
  food: LoggedFood; onDelete: () => void; onToggleEaten: () => void; onEditQty: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => { if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, -80)); },
      onPanResponderRelease: (_, gs) => {
        Animated.spring(translateX, { toValue: gs.dx < -50 ? -80 : 0, useNativeDriver: true }).start();
      },
    })
  ).current;
  const reset = () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  const emoji = getFoodEmoji(food.name);
  const dimmed = food.eaten === false;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.swipeDeleteBg}>
        <Pressable style={styles.swipeDeleteBtn} onPress={() => { reset(); onDelete(); }}>
          <Text style={styles.swipeDeleteText}>Eliminar</Text>
        </Pressable>
      </View>
      <Animated.View style={[styles.foodRow, { transform: [{ translateX }] }]} {...pan.panHandlers}>
        {/* Eaten checkbox */}
        <Pressable style={[styles.foodCheck, dimmed && styles.foodCheckOff]} onPress={onToggleEaten}>
          {!dimmed && <Check size={12} color={Colors.white} />}
        </Pressable>
        <View style={styles.foodIcon}>
          <Text style={styles.foodEmojiText}>{emoji}</Text>
        </View>
        <Pressable style={[styles.foodInfo, dimmed && { opacity: 0.4 }]} onPress={onEditQty}>
          <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
          {food.brand ? <Text style={styles.foodBrand}>{food.brand}</Text> : null}
        </Pressable>
        <Pressable style={styles.foodRight} onPress={onEditQty}>
          <Text style={[styles.foodQty, dimmed && { opacity: 0.4 }]}>{food.quantity_g} g</Text>
          <Text style={[styles.foodCal, dimmed && { opacity: 0.4 }]}>{Math.round(food.calories)} kcal</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ─── Water drop card ─────────────────────────────────────────────
function WaterCard({ glasses, target, onAdd, onRemove }: {
  glasses: number; target: number; onAdd: () => void; onRemove: () => void;
}) {
  const pct = Math.min(glasses / target, 1);
  const liters = (glasses * 0.25).toFixed(1);
  const targetL = (target * 0.25).toFixed(1);
  return (
    <View style={styles.waterCard}>
      {/* Water fill */}
      <View style={[styles.waterFill, { height: `${pct * 100}%` }]} />
      <View style={styles.waterContent}>
        <View style={styles.waterHeader}>
          <Droplets size={18} color={pct >= 0.6 ? '#fff' : '#38bdf8'} />
          <Text style={[styles.waterTitle, pct >= 0.6 && { color: '#fff' }]}>Hidratacion</Text>
          <Text style={[styles.waterRec, pct >= 0.6 && { color: 'rgba(255,255,255,0.8)' }]}>{targetL}L objetivo</Text>
        </View>
        <View style={styles.waterBody}>
          <Pressable style={[styles.waterBtn, pct >= 0.5 && { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={onRemove}>
            <Minus size={18} color={pct >= 0.5 ? '#fff' : Colors.text} />
          </Pressable>
          <View style={styles.waterCenter}>
            <Text style={[styles.waterCount, pct >= 0.5 && { color: '#fff' }]}>{liters}L</Text>
            <Text style={[styles.waterGlasses, pct >= 0.5 && { color: 'rgba(255,255,255,0.8)' }]}>{glasses} vasos</Text>
          </View>
          <Pressable style={[styles.waterBtn, pct >= 0.5 && { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={onAdd}>
            <Plus size={18} color={pct >= 0.5 ? '#fff' : '#38bdf8'} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Qty edit modal ──────────────────────────────────────────────
function QtyEditModal({ visible, food, onClose, onSave }: {
  visible: boolean; food: LoggedFood | null; onClose: () => void; onSave: (qty: number) => void;
}) {
  const [qty, setQty] = useState('');
  useEffect(() => { if (food) setQty(String(food.quantity_g)); }, [food]);
  if (!visible || !food) return null;
  const numQty = parseFloat(qty) || 0;
  // Recalc macros based on original per-100g ratios
  const origFactor = food.quantity_g > 0 ? 100 / food.quantity_g : 1;
  const newFactor = numQty / 100;
  const p100 = food.protein * origFactor, g100 = food.fat * origFactor, c100 = food.carbs * origFactor, cal100 = food.calories * origFactor;
  return (
    <Modal transparent animationType="fade" visible>
      <Pressable style={styles.qtyOverlay} onPress={onClose}>
        <Pressable style={styles.qtyCard} onPress={() => {}}>
          <Text style={styles.qtyTitle}>Editar cantidad</Text>
          <Text style={styles.qtyFoodName} numberOfLines={1}>{food.name}</Text>
          <View style={styles.qtyInputRow}>
            <TextInput style={styles.qtyInput} value={qty} onChangeText={setQty} keyboardType="numeric" selectTextOnFocus autoFocus />
            <Text style={styles.qtyUnit}>g</Text>
          </View>
          <View style={styles.qtyPresets}>
            {[50, 100, 150, 200, 250].map(g => (
              <Pressable key={g} style={[styles.qtyPresetBtn, qty === String(g) && styles.qtyPresetActive]} onPress={() => setQty(String(g))}>
                <Text style={[styles.qtyPresetText, qty === String(g) && { color: Colors.primary }]}>{g}g</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.qtyPreview}>
            <Text style={styles.qtyPreviewItem}>{Math.round(cal100 * newFactor)} kcal</Text>
            <Text style={styles.qtyPreviewItem}>{Math.round(p100 * newFactor)}P</Text>
            <Text style={styles.qtyPreviewItem}>{Math.round(c100 * newFactor)}C</Text>
            <Text style={styles.qtyPreviewItem}>{Math.round(g100 * newFactor)}G</Text>
          </View>
          <View style={styles.qtyActions}>
            <Pressable style={styles.qtyCancelBtn} onPress={onClose}><Text style={styles.qtyCancelText}>Cancelar</Text></Pressable>
            <Pressable style={styles.qtySaveBtn} onPress={() => { if (numQty > 0) onSave(numQty); }}><Text style={styles.qtySaveText}>Guardar</Text></Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Config modal (sizes inline right) ───────────────────────────
function MealConfigModal({ visible, configs, entrenoAfter, enabledKeys, onClose, onSave }: {
  visible: boolean; configs: MealConfigState; entrenoAfter: string | null;
  enabledKeys: string[]; onClose: () => void;
  onSave: (configs: MealConfigState, entreno: string | null) => void;
}) {
  const [local, setLocal] = useState(configs);
  const [entreno, setEntreno] = useState(entrenoAfter);
  const prevVis = useRef(visible);
  if (visible && !prevVis.current) { setLocal(configs); setEntreno(entrenoAfter); }
  prevVis.current = visible;
  if (!visible) return null;

  const toggle = (k: string) => setLocal(p => ({ ...p, [k]: { ...p[k], enabled: !p[k].enabled } }));
  const setSize = (k: string, s: MealSize5) => setLocal(p => ({ ...p, [k]: { ...p[k], size: s } }));
  const localEnabled = MEAL_KEYS.filter(k => local[k]?.enabled);

  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <Pressable style={styles.configOverlay} onPress={onClose}>
        <Pressable style={styles.configCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.configTitle}>Configurar comidas</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {MEAL_KEYS.map(key => {
              const meta = MEAL_META[key]; const cfg = local[key];
              return (
                <View key={key} style={styles.configRow}>
                  <Pressable style={styles.configLeft} onPress={() => toggle(key)}>
                    <View style={[styles.configCheck, cfg.enabled && styles.configCheckOn]}>
                      {cfg.enabled && <Check size={12} color={Colors.white} />}
                    </View>
                    <Text style={styles.configMealName}>{meta.icon} {meta.label}</Text>
                  </Pressable>
                  {cfg.enabled && (
                    <View style={styles.configSizesInline}>
                      {SIZE_ORDER.map(s => (
                        <Pressable key={s} style={[styles.sizeCircle, cfg.size === s && styles.sizeCircleActive]} onPress={() => setSize(key, s)}>
                          <Text style={[styles.sizeCircleText, cfg.size === s && styles.sizeCircleTextActive]}>{SIZE_LABELS[s]}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            <Text style={styles.configSubtitle}>Actividad fisica despues de:</Text>
            <View style={styles.configEntrenoRow}>
              {localEnabled.map(key => (
                <Pressable key={key} style={[styles.sizeCircle, { paddingHorizontal: 10 }, entreno === key && styles.sizeCircleActive]} onPress={() => setEntreno(entreno === key ? null : key)}>
                  <Text style={[styles.sizeCircleText, entreno === key && styles.sizeCircleTextActive]}>{MEAL_META[key]?.label || key}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.configActions}>
            <Pressable style={styles.configCancelBtn} onPress={onClose}><Text style={styles.configCancelText}>Cancelar</Text></Pressable>
            <Pressable style={styles.configSaveBtn} onPress={() => onSave(local, entreno)}><Text style={styles.configSaveText}>Guardar</Text></Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════════
export default function NutritionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [mealConfigs, setMealConfigs] = useState<MealConfigState>(defaultMealConfigs());
  const [configInit, setConfigInit] = useState(false);
  const [entrenoAfter, setEntrenoAfter] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<{ mealKey: string; idx: number; food: LoggedFood } | null>(null);
  const [waterGlasses, setWaterGlasses] = useState(0);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [fmtDate(selectedDate)]);
  const dateStr = fmtDate(selectedDate);
  const enabledMeals = MEAL_KEYS.filter(k => mealConfigs[k]?.enabled);

  // ── Queries ──────────────────────────────────────────────────
  const { data: blocksData } = useQuery({
    queryKey: ['mealBlocks'], queryFn: () => nutritionService.getMealBlocks(),
    select: (res: any) => {
      const d = res?.data || res;
      return d?.blocks || d;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: dashData } = useQuery({
    queryKey: ['analytics-dashboard-self'], queryFn: () => analyticsService.getDashboard(user?.id || ''),
    select: (res: any) => res?.data || null, enabled: !!user?.id,
  });
  const waterRecommendedL = dashData?.agua_recomendada_litros || 2.5;
  const waterTarget = Math.ceil(waterRecommendedL / 0.25);

  // Init config from blocks
  if (blocksData?.comidas && !configInit) {
    const comidas = blocksData.comidas;
    const updated = { ...mealConfigs };
    MEAL_KEYS.forEach(key => {
      const d = comidas[key];
      if (d) { const has = ((d.gramos?.proteina || 0) > 0 || (d.gramos?.grasa || 0) > 0 || (d.gramos?.carbohidratos || 0) > 0); updated[key] = { ...updated[key], enabled: has }; }
      else { updated[key] = { ...updated[key], enabled: false }; }
    });
    setMealConfigs(updated);
    setConfigInit(true);
  }

  const { data: logData, isLoading: logLoading } = useQuery({
    queryKey: ['dailyLog', dateStr], queryFn: () => nutritionService.getDailyLog(dateStr),
    select: (res: any) => res?.data || res,
  });

  // ── Meals ────────────────────────────────────────────────────
  const meals: MealData[] = useMemo(() => {
    const logMeals: DailyMealLog[] = logData?.meals || [];
    const bc = blocksData?.comidas || {};
    return enabledMeals.map(key => {
      const logged = logMeals.find(m => m.meal_key === key);
      const tgt = bc[key]?.gramos || { proteina: 0, grasa: 0, carbohidratos: 0 };
      return {
        meal_key: key, foods: parseFoodsJson(logged?.foods_json), completed: logged?.completed ?? false,
        target_p: tgt.proteina || logged?.target_p || 0, target_g: tgt.grasa || logged?.target_g || 0, target_c: tgt.carbohidratos || logged?.target_c || 0,
        recipe_id: logged?.recipe_id ?? null, recipe_name: logged?.recipe_name ?? null,
      };
    });
  }, [logData, blocksData, enabledMeals]);

  const dailyTotals = useMemo(() => {
    let cal = 0, p = 0, g = 0, c = 0, tp = 0, tg = 0, tc = 0;
    for (const m of meals) { const t = mealTotals(m.foods); cal += t.cal; p += t.p; g += t.g; c += t.c; tp += m.target_p; tg += m.target_g; tc += m.target_c; }
    return { cal, p, g, c, tgt_cal: Math.round(tp * 4 + tc * 4 + tg * 9), tgt_p: Math.round(tp), tgt_g: Math.round(tg), tgt_c: Math.round(tc) };
  }, [meals]);

  // ── Mutations ────────────────────────────────────────────────
  const saveMut = useMutation({
    mutationFn: (ms: DailyMealLog[]) => nutritionService.saveDailyLog(dateStr, ms),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['dailyLog', dateStr] }); },
  });

  const saveConfigMut = useMutation({
    mutationFn: (p: { comidas: MealConfigState; entreno: string | null }) => nutritionService.saveMealConfig(p.comidas as any, p.entreno),
    onSuccess: (res: any) => {
      // Use the recalculated blocks from the response directly
      const d = res?.data || res;
      const blocks = d?.blocks;
      if (blocks) {
        queryClient.setQueryData(['mealBlocks'], blocks);
      }
      queryClient.invalidateQueries({ queryKey: ['mealBlocks'] });
      queryClient.invalidateQueries({ queryKey: ['dailyLog'] });
    },
  });

  // ── Helpers to build save payload ────────────────────────────
  const buildMealPayload = (mealsList: MealData[]): DailyMealLog[] =>
    mealsList.map(m => {
      const t = mealTotals(m.foods);
      return { meal_key: m.meal_key, recipe_id: m.recipe_id, recipe_name: m.recipe_name, foods_json: m.foods, completed: m.completed, total_p: t.p, total_g: t.g, total_c: t.c, total_cal: t.cal, target_p: m.target_p, target_g: m.target_g, target_c: m.target_c };
    });

  // ── Handlers ─────────────────────────────────────────────────
  const handleRemoveFood = useCallback((mealKey: string, idx: number) => {
    const updated = meals.map(m => m.meal_key === mealKey ? { ...m, foods: m.foods.filter((_, i) => i !== idx) } : m);
    saveMut.mutate(buildMealPayload(updated));
  }, [meals, saveMut]);

  const handleToggleEaten = useCallback((mealKey: string, idx: number) => {
    const updated = meals.map(m => {
      if (m.meal_key !== mealKey) return m;
      const foods = m.foods.map((f, i) => i === idx ? { ...f, eaten: !(f.eaten ?? true) } : f);
      return { ...m, foods };
    });
    saveMut.mutate(buildMealPayload(updated));
  }, [meals, saveMut]);

  const handleEditQtySave = useCallback((newQty: number) => {
    if (!editingFood) return;
    const { mealKey, idx, food } = editingFood;
    const origFactor = food.quantity_g > 0 ? 100 / food.quantity_g : 1;
    const factor = newQty / 100;
    const updated = meals.map(m => {
      if (m.meal_key !== mealKey) return m;
      const foods = m.foods.map((f, i) => i !== idx ? f : {
        ...f, quantity_g: newQty,
        calories: Math.round(f.calories * origFactor * factor * 100) / 100,
        protein: Math.round(f.protein * origFactor * factor * 100) / 100,
        fat: Math.round(f.fat * origFactor * factor * 100) / 100,
        carbs: Math.round(f.carbs * origFactor * factor * 100) / 100,
      });
      return { ...m, foods };
    });
    saveMut.mutate(buildMealPayload(updated));
    setEditingFood(null);
  }, [editingFood, meals, saveMut]);

  const handleCompleteMeal = useCallback((mealKey: string) => {
    const updated = meals.map(m => m.meal_key === mealKey ? { ...m, completed: !m.completed } : m);
    saveMut.mutate(buildMealPayload(updated));
  }, [meals, saveMut]);

  const handleCompleteDay = useCallback(() => {
    const withFood = meals.filter(m => m.foods.length > 0);
    if (withFood.length === 0) { Alert.alert('Sin registros', 'Agrega alimentos primero.'); return; }
    const updated = meals.map(m => ({ ...m, completed: true, foods: m.foods.map(f => ({ ...f, eaten: true })) }));
    saveMut.mutate(buildMealPayload(updated));
  }, [meals, saveMut]);

  const handleAddChoice = useCallback((mealKey: string) => {
    router.push({ pathname: '/(patient)/nutrition/food-search', params: { meal: mealKey, date: dateStr } });
  }, [router, dateStr]);

  // Build solve-meal payload from a meal's foods
  const buildSolveMealPayload = useCallback((meal: MealData) => {
    const alimentos: any[] = [];
    const recipeIds: number[] = [];

    for (const f of meal.foods) {
      // If it's a recipe food (starts with r_), collect recipe_id
      if (f.id.startsWith('r_') && meal.recipe_id) {
        if (!recipeIds.includes(meal.recipe_id)) recipeIds.push(meal.recipe_id);
        continue; // recipe ingredients will come from backend
      }
      // Independent food — send stable per-100g macros and stable medida_casera_g
      alimentos.push({
        id: f.id,
        nombre: f.name,
        proteina_100g: f.protein_100g ?? (f.quantity_g > 0 ? Math.round(f.protein * 100 / f.quantity_g * 10) / 10 : 0),
        grasa_100g: f.fat_100g ?? (f.quantity_g > 0 ? Math.round(f.fat * 100 / f.quantity_g * 10) / 10 : 0),
        carbohidratos_100g: f.carbs_100g ?? (f.quantity_g > 0 ? Math.round(f.carbs * 100 / f.quantity_g * 10) / 10 : 0),
        medida_casera_g: f.medida_casera_g || f.quantity_g || 100,
        medida_desc: f.unit || 'porción',
      });
    }

    return {
      meal_key: meal.meal_key,
      libertad: 10,
      alimentos,
      recetas: recipeIds.map(id => ({ recipe_id: id })),
    };
  }, []);

  // Apply solve-meal result to a single meal
  const applySolveResult = useCallback((mealKey: string, solveData: any) => {
    if (solveData?.status !== 'success' || !solveData?.alimentos?.length) return;

    const updated = meals.map(m => {
      if (m.meal_key !== mealKey) return m;

      // Preserve eaten state from original foods where possible
      const originalFoodsMap = new Map(m.foods.map(f => [f.id, f]));
      const newFoods: LoggedFood[] = solveData.alimentos.map((a: any) => {
        const orig = originalFoodsMap.get(String(a.id));
        const qty = a.total_gramos || 100;
        const mc = orig?.medida_casera_g || a.medida_casera_g || qty;
        return {
          id: String(a.id),
          name: a.nombre || 'Sin nombre',
          quantity_g: qty,
          unit: orig?.unit || a.medida_desc || undefined,
          medida_casera_g: mc,
          calories: a.calorias || 0,
          protein: a.proteina_g || 0,
          fat: a.grasa_g || 0,
          carbs: a.carbohidratos_g || 0,
          protein_100g: orig?.protein_100g ?? (qty > 0 ? Math.round((a.proteina_g || 0) * 100 / qty * 10) / 10 : 0),
          fat_100g: orig?.fat_100g ?? (qty > 0 ? Math.round((a.grasa_g || 0) * 100 / qty * 10) / 10 : 0),
          carbs_100g: orig?.carbs_100g ?? (qty > 0 ? Math.round((a.carbohidratos_g || 0) * 100 / qty * 10) / 10 : 0),
          eaten: orig?.eaten ?? false,
        };
      });

      return { ...m, foods: newFoods };
    });

    saveMut.mutate(buildMealPayload(updated));
  }, [meals, saveMut, buildMealPayload]);

  const [calculating, setCalculating] = useState<string | null>(null); // 'all' | mealKey | null

  const handleRecalculate = useCallback(async (mealKey: string) => {
    const meal = meals.find(m => m.meal_key === mealKey);
    if (!meal || meal.foods.length === 0) {
      Alert.alert('Sin alimentos', 'Agrega alimentos a esta comida primero.');
      return;
    }
    setCalculating(mealKey);
    try {
      const payload = buildSolveMealPayload(meal);
      const result = await nutritionService.solveMeal(payload);
      const data = (result as any)?.data || result;
      if (data?.status === 'success') applySolveResult(mealKey, data);
      else Alert.alert('Sin resultados', data?.message || 'No se obtuvieron resultados del calculo.');
    } catch { Alert.alert('Error', 'No se pudo calcular la comida.'); }
    finally { setCalculating(null); }
  }, [meals, buildSolveMealPayload, applySolveResult]);

  const handleCalculateAll = useCallback(async () => {
    const mealsWithFood = meals.filter(m => m.foods.length > 0);
    if (mealsWithFood.length === 0) {
      Alert.alert('Sin alimentos', 'Agrega alimentos a al menos una comida.');
      return;
    }
    setCalculating('all');
    try {
      const results: { mealKey: string; data: any }[] = [];
      // Solve each meal independently
      await Promise.all(mealsWithFood.map(async (meal) => {
        const payload = buildSolveMealPayload(meal);
        const result = await nutritionService.solveMeal(payload);
        const data = (result as any)?.data || result;
        results.push({ mealKey: meal.meal_key, data });
      }));

      // Apply all results at once
      let updated = [...meals];
      for (const { mealKey, data } of results) {
        if (data?.status !== 'success' || !data?.alimentos?.length) continue;
        updated = updated.map(m => {
          if (m.meal_key !== mealKey) return m;
          const originalFoodsMap = new Map(m.foods.map(f => [f.id, f]));
          const newFoods: LoggedFood[] = data.alimentos.map((a: any) => {
            const orig = originalFoodsMap.get(String(a.id));
            const qty = a.total_gramos || 100;
            const mc = orig?.medida_casera_g || a.medida_casera_g || qty;
            return {
              id: String(a.id),
              name: a.nombre || 'Sin nombre',
              quantity_g: qty,
              unit: orig?.unit || a.medida_desc || undefined,
              medida_casera_g: mc,
              calories: a.calorias || 0,
              protein: a.proteina_g || 0,
              fat: a.grasa_g || 0,
              carbs: a.carbohidratos_g || 0,
              protein_100g: orig?.protein_100g ?? (qty > 0 ? Math.round((a.proteina_g || 0) * 100 / qty * 10) / 10 : 0),
              fat_100g: orig?.fat_100g ?? (qty > 0 ? Math.round((a.grasa_g || 0) * 100 / qty * 10) / 10 : 0),
              carbs_100g: orig?.carbs_100g ?? (qty > 0 ? Math.round((a.carbohidratos_g || 0) * 100 / qty * 10) / 10 : 0),
              eaten: orig?.eaten ?? false,
            };
          });
          return { ...m, foods: newFoods };
        });
      }
      saveMut.mutate(buildMealPayload(updated));
    } catch { Alert.alert('Error', 'No se pudieron calcular las comidas.'); }
    finally { setCalculating(null); }
  }, [meals, buildSolveMealPayload, saveMut, buildMealPayload]);

  const handleSaveConfig = useCallback((nc: MealConfigState, ent: string | null) => {
    setMealConfigs(nc); setEntrenoAfter(ent); setShowConfig(false);
    saveConfigMut.mutate({ comidas: nc, entreno: ent });
  }, [saveConfigMut]);

  const shiftWeek = (dir: -1 | 1) => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7 * dir); setSelectedDate(d); };
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['dailyLog', dateStr] });
    await queryClient.invalidateQueries({ queryKey: ['mealBlocks'] });
    setRefreshing(false);
  }, [queryClient, dateStr]);

  const allCompleted = meals.length > 0 && meals.every(m => m.completed || m.foods.length === 0);

  return (
    <View style={styles.container}>
      <BuildBanner />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Calendar */}
        <View style={styles.calStrip}>
          <Pressable onPress={() => shiftWeek(-1)} hitSlop={12}><ChevronLeft size={20} color={Colors.gray500} /></Pressable>
          <View style={styles.calDays}>
            {weekDates.map((d, i) => {
              const isTd = isSameDay(d, today), isSel = isSameDay(d, selectedDate);
              return (
                <Pressable key={i} style={[styles.calDay, isSel && styles.calDaySel]} onPress={() => setSelectedDate(d)}>
                  <Text style={[styles.calDayL, isSel && { color: Colors.white }]}>{DAY_LABELS[(d.getDay() + 7) % 7]}</Text>
                  <Text style={[styles.calDayN, isSel && { color: Colors.white }]}>{d.getDate()}</Text>
                  {isTd && <View style={styles.calTodayDot} />}
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => shiftWeek(1)} hitSlop={12}><ChevronRight size={20} color={Colors.gray500} /></Pressable>
        </View>
        {isSameDay(selectedDate, today) && <Text style={styles.todayLabel}>Hoy</Text>}

        {logLoading ? <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} /> : (
          <>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <CalorieArc consumed={dailyTotals.cal} target={dailyTotals.tgt_cal} />
              <View style={styles.macroBars}>
                <MacroBar label="Proteinas" current={dailyTotals.p} target={dailyTotals.tgt_p} color="#ef4444" />
                <MacroBar label="Carbos" current={dailyTotals.c} target={dailyTotals.tgt_c} color="#f59e0b" />
                <MacroBar label="Grasas" current={dailyTotals.g} target={dailyTotals.tgt_g} color="#10b981" />
              </View>
              <Pressable style={[styles.completeDayBtn, allCompleted && styles.completeDayDone]} onPress={handleCompleteDay} disabled={saveMut.isPending || allCompleted}>
                {saveMut.isPending ? <ActivityIndicator size="small" color={Colors.white} /> : (
                  <><Check size={18} color={allCompleted ? Colors.success : Colors.gray400} /><Text style={[styles.completeDayText, allCompleted && { color: Colors.success }]}>{allCompleted ? 'Dia completado' : 'Terminar Dia'}</Text></>
                )}
              </Pressable>
            </View>

            {/* Meals header */}
            <View style={styles.mealsHdr}>
              <Text style={styles.mealsHdrTitle}>Comidas ({enabledMeals.length})</Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Pressable
                  style={[styles.cfgBtn, { backgroundColor: `${Colors.success}15` }]}
                  onPress={handleCalculateAll}
                  disabled={calculating !== null}
                >
                  {calculating === 'all' ? (
                    <ActivityIndicator size={12} color={Colors.success} />
                  ) : (
                    <Calculator size={14} color={Colors.success} />
                  )}
                  <Text style={[styles.cfgBtnText, { color: Colors.success }]}>Calcular todo</Text>
                </Pressable>
                <Pressable style={styles.cfgBtn} onPress={() => setShowConfig(true)}>
                  <Settings size={14} color={Colors.primary} /><Text style={styles.cfgBtnText}>Configurar</Text>
                </Pressable>
              </View>
            </View>

            {/* Meal Cards */}
            {meals.map(meal => {
              const meta = MEAL_META[meal.meal_key]; if (!meta) return null;
              const totals = mealTotals(meal.foods);
              const hasFoods = meal.foods.length > 0;
              return (
                <View key={meal.meal_key} style={[styles.mealCard, meal.completed && styles.mealCardDone]}>
                  <View style={styles.mealHdr}>
                    <View style={styles.mealHdrL}>
                      <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
                      <View>
                        <Text style={styles.mealLabel}>{meta.label}</Text>
                        <Text style={styles.mealMacros}>{totals.p}P | {totals.c}C | {totals.g}G</Text>
                      </View>
                    </View>
                    <View style={styles.mealHdrR}>
                      <Text style={styles.mealCal}>{totals.cal} kcal</Text>
                      {/* Complete meal toggle */}
                      <Pressable style={[styles.mealCompleteBtn, meal.completed && styles.mealCompleteBtnOn]} onPress={() => handleCompleteMeal(meal.meal_key)}>
                        <Check size={14} color={meal.completed ? Colors.white : Colors.gray400} />
                      </Pressable>
                    </View>
                  </View>

                  {meal.foods.length === 0 && (meal.target_p > 0 || meal.target_c > 0) && (
                    <Text style={styles.mealTarget}>Objetivo: {Math.round(meal.target_p)}P | {Math.round(meal.target_c)}C | {Math.round(meal.target_g)}G</Text>
                  )}

                  {meal.foods.map((food, idx) => (
                    <SwipeableFoodRow key={food.id + idx} food={food}
                      onDelete={() => handleRemoveFood(meal.meal_key, idx)}
                      onToggleEaten={() => handleToggleEaten(meal.meal_key, idx)}
                      onEditQty={() => setEditingFood({ mealKey: meal.meal_key, idx, food })}
                    />
                  ))}

                  {/* Action row */}
                  <View style={styles.mealActions}>
                    <Pressable style={styles.addBtn} onPress={() => handleAddChoice(meal.meal_key)}>
                      <Plus size={16} color={Colors.primary} /><Text style={styles.addBtnText}>Agregar</Text>
                    </Pressable>
                    {hasFoods && (
                      <Pressable style={styles.calcBtn} onPress={() => handleRecalculate(meal.meal_key)} disabled={calculating !== null}>
                        {calculating === meal.meal_key ? (
                          <ActivityIndicator size={12} color={Colors.primary} />
                        ) : (
                          <Calculator size={14} color={Colors.primary} />
                        )}
                        <Text style={styles.calcBtnText}>Calcular</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Water */}
            <WaterCard glasses={waterGlasses} target={waterTarget}
              onAdd={() => setWaterGlasses(w => w + 1)}
              onRemove={() => setWaterGlasses(w => Math.max(0, w - 1))}
            />
          </>
        )}
      </ScrollView>

      <MealConfigModal visible={showConfig} configs={mealConfigs} entrenoAfter={entrenoAfter} enabledKeys={enabledMeals} onClose={() => setShowConfig(false)} onSave={handleSaveConfig} />
      <QtyEditModal visible={!!editingFood} food={editingFood?.food || null} onClose={() => setEditingFood(null)} onSave={handleEditQtySave} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 }, scrollContent: { paddingBottom: 100 },

  // Calendar
  calStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  calDays: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  calDay: { alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.lg, minWidth: 36 },
  calDaySel: { backgroundColor: Colors.primary },
  calDayL: { fontSize: FontSize.xs, color: Colors.gray500, fontWeight: FontWeight.medium },
  calDayN: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold, marginTop: 2 },
  calTodayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary, marginTop: 2 },
  todayLabel: { textAlign: 'center', fontSize: FontSize.sm, color: Colors.gray500, fontWeight: FontWeight.medium, paddingVertical: Spacing.xs },

  // Summary
  summaryCard: { margin: Spacing.lg, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, ...Shadow.md },
  arcCenter: { position: 'absolute', top: 45, left: 0, right: 0, alignItems: 'center' },
  arcConsumed: { fontSize: 32, fontWeight: FontWeight.bold, color: Colors.text },
  arcTarget: { fontSize: FontSize.sm, color: Colors.gray500 },
  arcMarkers: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: -8 },
  arcMarkerText: { fontSize: FontSize.xs, color: Colors.gray400 },
  macroBars: { marginTop: Spacing.lg, gap: Spacing.md },
  macroBarRow: { gap: 4 },
  macroBarLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  macroBarName: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  macroBarValues: { fontSize: FontSize.sm, color: Colors.gray500 },
  macroBarTrack: { height: 6, backgroundColor: Colors.gray200, borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: 6, borderRadius: 3 },
  completeDayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray200 },
  completeDayDone: { backgroundColor: `${Colors.success}20` },
  completeDayText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.gray400 },

  // Meals header
  mealsHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  mealsHdrTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  cfgBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: `${Colors.primary}15` },
  cfgBtnText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },

  // Meal card
  mealCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.sm },
  mealCardDone: { borderWidth: 1, borderColor: `${Colors.success}40` },
  mealHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.gray200 },
  mealHdrL: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mealHdrR: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  mealLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  mealMacros: { fontSize: FontSize.xs, color: Colors.gray500, marginTop: 1 },
  mealCal: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
  mealCompleteBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.gray400, alignItems: 'center', justifyContent: 'center' },
  mealCompleteBtnOn: { backgroundColor: Colors.success, borderColor: Colors.success },
  mealTarget: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, fontSize: FontSize.xs, color: Colors.gray400, fontStyle: 'italic' },
  mealActions: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, paddingVertical: Spacing.md },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  calcBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  calcBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },

  // Swipeable
  swipeContainer: { position: 'relative', overflow: 'hidden' },
  swipeDeleteBg: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center' },
  swipeDeleteBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', width: 80 },
  swipeDeleteText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, backgroundColor: Colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.gray200 },
  foodCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  foodCheckOff: { backgroundColor: Colors.gray300, borderWidth: 1, borderColor: Colors.gray400 },
  foodIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm },
  foodEmojiText: { fontSize: 16 },
  foodInfo: { flex: 1 },
  foodName: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  foodBrand: { fontSize: FontSize.xs, color: Colors.gray400 },
  foodRight: { alignItems: 'flex-end' },
  foodQty: { fontSize: FontSize.xs, color: Colors.gray500 },
  foodCal: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },

  // Add choice

  // Config
  configOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  configCard: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, maxHeight: '80%' },
  configTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.lg },
  configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.gray200 },
  configLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  configCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.gray400, alignItems: 'center', justifyContent: 'center' },
  configCheckOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  configMealName: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  configSizesInline: { flexDirection: 'row', gap: 4 },
  sizeCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center' },
  sizeCircleActive: { backgroundColor: Colors.primary },
  sizeCircleText: { fontSize: 9, color: Colors.gray500, fontWeight: FontWeight.bold },
  sizeCircleTextActive: { color: Colors.white },
  configSubtitle: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.semibold, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  configEntrenoRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  configActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  configCancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray200, alignItems: 'center' },
  configCancelText: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold },
  configSaveBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, alignItems: 'center' },
  configSaveText: { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semibold },

  // Recipe selector

  // Qty edit
  qtyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  qtyCard: { width: '85%', backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.xl },
  qtyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, textAlign: 'center' },
  qtyFoodName: { fontSize: FontSize.sm, color: Colors.gray500, textAlign: 'center', marginTop: 4, marginBottom: Spacing.lg },
  qtyInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  qtyInput: { width: 120, textAlign: 'center', fontSize: 28, fontWeight: '700' as any, color: Colors.text, borderBottomWidth: 2, borderBottomColor: Colors.primary, paddingVertical: Spacing.sm },
  qtyUnit: { fontSize: FontSize.xl, color: Colors.gray500, fontWeight: FontWeight.semibold },
  qtyPresets: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.lg, flexWrap: 'wrap' },
  qtyPresetBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.gray200, borderRadius: BorderRadius.md },
  qtyPresetActive: { backgroundColor: `${Colors.primary}30` },
  qtyPresetText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  qtyPreview: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.lg, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray200 },
  qtyPreviewItem: { fontSize: FontSize.sm, color: Colors.gray500, fontWeight: FontWeight.semibold },
  qtyActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  qtyCancelBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray200, alignItems: 'center' },
  qtyCancelText: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.semibold },
  qtySaveBtn: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, alignItems: 'center' },
  qtySaveText: { fontSize: FontSize.md, color: Colors.white, fontWeight: FontWeight.semibold },

  // Water
  waterCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: '#0c1929', height: 120, position: 'relative' },
  waterFill: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#38bdf8' },
  waterContent: { flex: 1, padding: Spacing.lg, justifyContent: 'space-between' },
  waterHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  waterTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: '#38bdf8' },
  waterRec: { marginLeft: 'auto', fontSize: FontSize.xs, color: Colors.gray500 },
  waterBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  waterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center' },
  waterCenter: { alignItems: 'center' },
  waterCount: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  waterGlasses: { fontSize: FontSize.xs, color: Colors.gray500 },
});
