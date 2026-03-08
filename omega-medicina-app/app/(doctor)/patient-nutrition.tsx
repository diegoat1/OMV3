// Doctor - Plan nutricional del paciente

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, PanResponder, TextInput,
  ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
  type LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Apple, Save, RefreshCw, ChevronDown, ChevronUp, BarChart3, Calendar, Search, X, ClipboardList, Plus, Calculator, Settings, Check, Lock, Minus } from 'lucide-react-native';
import { useScale } from '../../src/hooks/useScale';
import { analyticsService, nutritionService } from '../../src/services/api';

// ─── Activity factor options ───────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  { value: 1.2,   label: 'Sedentario',  desc: 'Poco o ningun ejercicio' },
  { value: 1.375, label: 'Ligero',      desc: 'Ejercicio 1-3 dias/semana' },
  { value: 1.55,  label: 'Moderado',    desc: 'Ejercicio 3-5 dias/semana' },
  { value: 1.725, label: 'Activo',      desc: 'Ejercicio 6-7 dias/semana' },
  { value: 1.9,   label: 'Muy activo',  desc: 'Trabajo fisico + ejercicio diario' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined, dec = 0) {
  if (v == null || isNaN(Number(v))) return '—';
  return Number(v).toFixed(dec);
}

const rd = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const scoreColor = (s: number) => s >= 70 ? '#16a34a' : s >= 50 ? '#f59e0b' : '#ef4444';

const MEAL_ORDER = ['desayuno', 'media_manana', 'almuerzo', 'merienda', 'media_tarde', 'cena'];
const MEAL_LABELS: Record<string, string> = {
  desayuno: 'Desayuno', media_manana: 'Media Manana', almuerzo: 'Almuerzo',
  merienda: 'Merienda', media_tarde: 'Media Tarde', cena: 'Cena',
};
const MEAL_EMOJIS: Record<string, string> = {
  desayuno: '🌅', media_manana: '🍎', almuerzo: '🍽️',
  merienda: '🥤', media_tarde: '🫐', cena: '🌙',
};
const sortMeals = (meals: any[]) => {
  return [...meals].sort((a, b) => {
    const ia = MEAL_ORDER.indexOf(a.meal_key);
    const ib = MEAL_ORDER.indexOf(b.meal_key);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
};

// ─── Interfaces ────────────────────────────────────────────────────────────
interface PlanningFood {
  nombre: string;
  total_gramos: number;
  porciones: number;
  medida_casera_g: number;
  medida_desc: string;
  proteina_g: number;
  grasa_g: number;
  carbohidratos_g: number;
  calorias: number;
  proteina_100g: number;
  grasa_100g: number;
  carbohidratos_100g: number;
  locked: boolean;
  isExtra?: boolean;
  recipeSource?: string;
}

interface PlanningMealState {
  recipeId: number | null;
  recipeName: string | null;
  foods: PlanningFood[];
  calculating: boolean;
}

const sumFoods = (foods: PlanningFood[]) => {
  let p = 0, g = 0, c = 0, cal = 0;
  for (const f of foods) { p += f.proteina_g || 0; g += f.grasa_g || 0; c += f.carbohidratos_g || 0; cal += f.calorias || 0; }
  return { p: rd(p), g: rd(g), c: rd(c), cal: Math.round(cal) };
};

const recalcFood = (food: PlanningFood, field: 'gramos' | 'porciones', value: number): PlanningFood => {
  const gramos = field === 'gramos' ? value : value * food.medida_casera_g;
  const porciones = field === 'porciones' ? value : (food.medida_casera_g > 0 ? value / food.medida_casera_g : 0);
  return {
    ...food,
    total_gramos: rd(gramos),
    porciones: rd(porciones, 2),
    proteina_g: rd(gramos * food.proteina_100g / 100),
    grasa_g: rd(gramos * food.grasa_100g / 100),
    carbohidratos_g: rd(gramos * food.carbohidratos_100g / 100),
    calorias: Math.round(gramos * (food.proteina_100g * 4 + food.carbohidratos_100g * 4 + food.grasa_100g * 9) / 100),
  };
};

// ─── Circle Progress ───────────────────────────────────────────────────────
function CircleProgress({ size, strokeWidth, progress, color, label, value, target, s }: {
  size: number; strokeWidth: number; progress: number; color: string;
  label: string; value: number; target: number; s: number;
}) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const isOver = progress > 1;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size * s, height: size * s, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          position: 'absolute', width: size * s, height: size * s, borderRadius: size * s / 2,
          borderWidth: strokeWidth * s, borderColor: '#252525',
        }} />
        <View style={{
          position: 'absolute', width: size * s, height: size * s, borderRadius: size * s / 2,
          borderWidth: strokeWidth * s,
          borderColor: isOver ? '#ef4444CC' : color,
          borderTopColor: clampedProgress > 0.25 ? (isOver ? '#ef4444CC' : color) : 'transparent',
          borderRightColor: clampedProgress > 0.5 ? (isOver ? '#ef4444CC' : color) : 'transparent',
          borderBottomColor: clampedProgress > 0.75 ? (isOver ? '#ef4444CC' : color) : 'transparent',
          borderLeftColor: clampedProgress > 0 ? (isOver ? '#ef4444CC' : color) : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }} />
        <Text style={{ fontSize: size * 0.22 * s, fontWeight: '700', color: isOver ? '#ef4444' : color }}>
          {Math.round(value)}
        </Text>
      </View>
      <Text style={{ fontSize: 8 * s, color: '#94a3b8', marginTop: 2 * s }}>
        {label} /{Math.round(target)}
      </Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function PatientNutritionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    patientId: string;
    patientName: string;
    patientDni: string;
  }>();
  const { s } = useScale();
  const qc = useQueryClient();

  const patientId = params.patientId || '';
  const patientName = params.patientName || 'Paciente';
  const patientDni = params.patientDni || '';

  const [factorActividad, setFactorActividad] = useState(1.55);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [selectedVelocity, setSelectedVelocity] = useState<number>(1);
  const [calcExpanded, setCalcExpanded] = useState(false);
  const [planExpanded, setPlanExpanded] = useState(false);
  const [adherenceExpanded, setAdherenceExpanded] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Planning state — mirrors patient view
  const [planningExpanded, setPlanningExpanded] = useState(false);
  const [planDate, setPlanDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0];
  });
  const [planMeals, setPlanMeals] = useState<Record<string, PlanningMealState>>({});
  const [enabledPlanMeals, setEnabledPlanMeals] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    MEAL_ORDER.forEach(k => { m[k] = k !== 'media_tarde'; });
    return m;
  });
  const [showPlanRecipeSelector, setShowPlanRecipeSelector] = useState<string | null>(null);
  const [showPlanFoodSearch, setShowPlanFoodSearch] = useState<string | null>(null);
  const [planRecipeSearch, setPlanRecipeSearch] = useState('');
  const [planFoodSearch, setPlanFoodSearch] = useState('');

  const [historyDays, setHistoryDays] = useState(14);

  // Manual plan state
  const [showManualPlan, setShowManualPlan] = useState(false);
  const [manualCal, setManualCal] = useState('');
  const [manualP, setManualP] = useState('');
  const [manualG, setManualG] = useState('');
  const [manualC, setManualC] = useState('');

  // ─── Queries ──────────────────────────────────────────────────────────
  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['analytics-dashboard', patientDni || patientId],
    queryFn: () => analyticsService.getDashboard(patientId, { dni: patientDni }),
    select: (res: any) => res?.data || null,
    enabled: !!(patientDni || patientId),
  });

  const currentPlan = dashboard?.plan_nutricional;
  const meta = dashboard?.metadata;

  // Recipes list
  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => nutritionService.getRecipes(),
    select: (res: any) => {
      const d = res?.data || res;
      return Array.isArray(d) ? d : (d as any)?.recipes || [];
    },
  });

  // Meal blocks for patient
  const { data: patientBlocks } = useQuery({
    queryKey: ['mealBlocks-patient', patientName],
    queryFn: () => nutritionService.getMealBlocks(),
    select: (res: any) => res?.data || res || null,
  });

  // Food search
  const { data: planFoodResults } = useQuery({
    queryKey: ['foodSearch-plan', planFoodSearch],
    queryFn: () => nutritionService.getFoods(planFoodSearch),
    select: (res: any) => {
      const d = res?.data || res;
      return Array.isArray(d) ? d : [];
    },
    enabled: !!planFoodSearch && planFoodSearch.length >= 2,
  });

  // Adherence data
  const { data: adherence, isLoading: loadingAdherence } = useQuery({
    queryKey: ['dailyLogHistory', patientName, historyDays],
    queryFn: () => nutritionService.getDailyLogHistoryForPatient(patientName, historyDays),
    select: (res: any) => res?.data || null,
    enabled: !!patientName,
  });

  // Day detail query
  const { data: dayDetail } = useQuery({
    queryKey: ['dailyLogDetail', patientName, expandedDay],
    queryFn: () => nutritionService.getDailyLogForPatient(patientName, expandedDay!),
    select: (res: any) => res?.data || null,
    enabled: !!expandedDay && !!patientName,
  });

  // Init enabled meals from patient blocks
  useEffect(() => {
    const comidas = patientBlocks?.blocks?.comidas;
    if (comidas) {
      const updated: Record<string, boolean> = {};
      MEAL_ORDER.forEach(k => {
        const data = comidas[k];
        updated[k] = !!(data && (data.gramos?.proteina > 0 || data.gramos?.grasa > 0 || data.gramos?.carbohidratos > 0));
      });
      setEnabledPlanMeals(updated);
    }
  }, [patientBlocks]);

  // Initialize slider with patient's last factor_actividad
  useEffect(() => {
    const fa = meta?.nivel_actividad;
    if (fa && typeof fa === 'number' && fa >= 1.2 && fa <= 1.9) {
      setFactorActividad(fa);
    }
  }, [meta?.nivel_actividad]);

  // ─── Mutations ────────────────────────────────────────────────────────
  const calcMut = useMutation({
    mutationFn: () =>
      nutritionService.autoCalculateForPatient(patientName, factorActividad),
    onSuccess: (res: any) => {
      const result = res?.data || null;
      setCalcResult(result);
      if (result?.opciones_velocidad?.length) setSelectedVelocity(1);
    },
    onError: (e: any) => Alert.alert('Error', e?.message || 'Error al calcular plan'),
  });

  const savePlanMut = useMutation({
    mutationFn: () => {
      const opcion = calcResult?.opciones_velocidad?.[selectedVelocity];
      if (!opcion) throw new Error('Selecciona una velocidad primero');
      return nutritionService.createPlan({
        nombre_apellido: patientName,
        calorias: opcion.calorias,
        proteina: opcion.macros.proteina_g,
        grasa: opcion.macros.grasa_g,
        ch: opcion.macros.carbohidratos_g,
        factor_actividad: factorActividad,
        velocidad_cambio: opcion.velocidad_semanal_kg,
        deficit_calorico: opcion.deficit_diario || 0,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analytics-dashboard', patientDni || patientId] });
      qc.invalidateQueries({ queryKey: ['nutritionPlans'] });
      Alert.alert('Plan guardado', 'El plan nutricional fue creado exitosamente.');
    },
    onError: (e: any) => Alert.alert('Error', e?.message || 'No se pudo guardar el plan'),
  });

  const manualPlanMut = useMutation({
    mutationFn: () => {
      const cal = parseFloat(manualCal) || 0;
      const p = parseFloat(manualP) || 0;
      const g = parseFloat(manualG) || 0;
      const c = parseFloat(manualC) || 0;
      if (cal <= 0 || p <= 0) throw new Error('Ingresa al menos calorias y proteina');
      return nutritionService.createPlan({
        nombre_apellido: patientName,
        calorias: cal, proteina: p, grasa: g, ch: c,
        factor_actividad: factorActividad,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analytics-dashboard', patientDni || patientId] });
      setShowManualPlan(false);
      setManualCal(''); setManualP(''); setManualG(''); setManualC('');
      Alert.alert('Plan guardado', 'Plan manual creado exitosamente.');
    },
    onError: (e: any) => Alert.alert('Error', e?.message || 'No se pudo guardar'),
  });

  const savePlanningMut = useMutation({
    mutationFn: () => {
      const activeMeals = MEAL_ORDER.filter(k => enabledPlanMeals[k]);
      const meals = activeMeals
        .filter(k => planMeals[k]?.foods?.length > 0)
        .map(k => {
          const ms = planMeals[k];
          const sums = sumFoods(ms.foods);
          const macros = getPlanMealMacros(k);
          return {
            meal_key: k,
            recipe_id: ms.recipeId,
            recipe_name: ms.recipeName,
            foods_json: ms.foods,
            completed: false,
            total_p: sums.p, total_g: sums.g, total_c: sums.c, total_cal: sums.cal,
            target_p: macros?.proteina || 0, target_g: macros?.grasa || 0, target_c: macros?.carbohidratos || 0,
          };
        });
      if (meals.length === 0) throw new Error('Calcula al menos una comida');
      return nutritionService.saveDailyLogForPatient(patientName, planDate, meals);
    },
    onSuccess: () => {
      Alert.alert('Planificacion guardada', `Comidas precargadas para ${planDate}`);
      setPlanMeals({});
    },
    onError: (e: any) => Alert.alert('Error', e?.message || 'No se pudo guardar'),
  });

  // ─── Planning helpers ─────────────────────────────────────────────────
  const blocks = patientBlocks?.blocks || null;
  const getPlanMealMacros = (mealKey: string) => {
    if (!blocks?.comidas?.[mealKey]) return null;
    return blocks.comidas[mealKey].gramos;
  };

  const calculatePlanRecipe = useCallback(async (mealKey: string, recipeId: number, recipeName: string) => {
    const macros = getPlanMealMacros(mealKey);
    if (!macros) return;

    setPlanMeals(prev => ({
      ...prev,
      [mealKey]: { ...prev[mealKey], calculating: true },
    }));

    try {
      const result = await nutritionService.calculateRecipe(recipeId, {
        proteina: macros.proteina,
        grasa: macros.grasa,
        carbohidratos: macros.carbohidratos,
        libertad: blocks?.libertad || 0,
      } as any);

      const calcData = result?.data || result;
      const calculation = calcData?.calculation;
      const variables = calculation?.alimentos_variables || [];
      const fijos = calculation?.alimentos_fijos || [];
      const allFoods = [...variables, ...fijos];

      const newFoods: PlanningFood[] = allFoods.map((a: any) => ({
        nombre: a.nombre,
        total_gramos: a.total_gramos || 0,
        porciones: a.porciones || 0,
        medida_casera_g: a.medida_casera_g || (a.total_gramos && a.porciones ? a.total_gramos / a.porciones : 0),
        medida_desc: a.medida_desc || a.medida || '',
        proteina_g: a.proteina_g || 0,
        grasa_g: a.grasa_g || 0,
        carbohidratos_g: a.carbohidratos_g || 0,
        calorias: a.calorias || 0,
        proteina_100g: a.proteina_100g || (a.total_gramos > 0 ? (a.proteina_g / a.total_gramos) * 100 : 0),
        grasa_100g: a.grasa_100g || (a.total_gramos > 0 ? (a.grasa_g / a.total_gramos) * 100 : 0),
        carbohidratos_100g: a.carbohidratos_100g || (a.total_gramos > 0 ? (a.carbohidratos_g / a.total_gramos) * 100 : 0),
        locked: false,
        recipeSource: recipeName,
      }));

      setPlanMeals(prev => {
        const existing = (prev[mealKey]?.foods || []).filter(f => f.recipeSource !== recipeName);
        return {
          ...prev,
          [mealKey]: {
            recipeId, recipeName,
            foods: [...existing, ...newFoods],
            calculating: false,
          },
        };
      });
    } catch {
      setPlanMeals(prev => ({
        ...prev,
        [mealKey]: { ...prev[mealKey], calculating: false },
      }));
    }
  }, [blocks]);

  const selectPlanRecipe = (mealKey: string, recipe: { id: number; nombre: string }) => {
    setPlanMeals(prev => ({
      ...prev,
      [mealKey]: { ...prev[mealKey], recipeId: recipe.id, recipeName: recipe.nombre, foods: prev[mealKey]?.foods || [], calculating: false },
    }));
    setShowPlanRecipeSelector(null);
    setPlanRecipeSearch('');
    setTimeout(() => calculatePlanRecipe(mealKey, recipe.id, recipe.nombre), 100);
  };

  const updatePlanFood = (mealKey: string, foodIdx: number, field: 'gramos' | 'porciones', value: number) => {
    setPlanMeals(prev => {
      const ms = prev[mealKey];
      if (!ms?.foods) return prev;
      const foods = [...ms.foods];
      foods[foodIdx] = recalcFood(foods[foodIdx], field, value);
      return { ...prev, [mealKey]: { ...ms, foods } };
    });
  };

  const togglePlanFoodLock = (mealKey: string, foodIdx: number) => {
    setPlanMeals(prev => {
      const ms = prev[mealKey];
      if (!ms?.foods) return prev;
      const foods = [...ms.foods];
      foods[foodIdx] = { ...foods[foodIdx], locked: !foods[foodIdx].locked };
      return { ...prev, [mealKey]: { ...ms, foods } };
    });
  };

  const removePlanFood = (mealKey: string, foodIdx: number) => {
    setPlanMeals(prev => {
      const ms = prev[mealKey];
      if (!ms?.foods) return prev;
      const foods = ms.foods.filter((_, i) => i !== foodIdx);
      return { ...prev, [mealKey]: { ...ms, foods } };
    });
  };

  const addPlanExtraFood = (mealKey: string, food: any) => {
    const gramos = food.Gramo1 || food.porcion1 || 100;
    const p100 = food.P ?? food.proteina ?? 0;
    const g100 = food.G ?? food.grasa ?? 0;
    const c100 = food.CH ?? food.carbohidratos ?? 0;
    const nombre = food.Largadescripcion || food.Cortadescripcion || food.nombre || '';
    const newFood: PlanningFood = {
      nombre,
      total_gramos: gramos,
      porciones: 1,
      medida_casera_g: gramos,
      medida_desc: food.Medidacasera1 || '1 porcion',
      proteina_g: rd(gramos * p100 / 100),
      grasa_g: rd(gramos * g100 / 100),
      carbohidratos_g: rd(gramos * c100 / 100),
      calorias: Math.round(gramos * (p100 * 4 + c100 * 4 + g100 * 9) / 100),
      proteina_100g: p100, grasa_100g: g100, carbohidratos_100g: c100,
      locked: false, isExtra: true,
    };
    setPlanMeals(prev => {
      const ms = prev[mealKey] || { recipeId: null, recipeName: null, foods: [], calculating: false };
      return { ...prev, [mealKey]: { ...ms, foods: [...ms.foods, newFood] } };
    });
    setShowPlanFoodSearch(null);
    setPlanFoodSearch('');
  };

  const filteredPlanRecipes = (recipes || []).filter((r: any) =>
    !planRecipeSearch || r.nombre?.toLowerCase().includes(planRecipeSearch.toLowerCase())
  );

  const groupFoodsByRecipe = (foods: PlanningFood[]) => {
    const groups: { source: string | null; foods: { food: PlanningFood; idx: number }[] }[] = [];
    let currentSource: string | null | undefined = undefined;
    let currentGroup: typeof groups[0] | null = null;
    foods.forEach((food, idx) => {
      const src = food.recipeSource || null;
      if (src !== currentSource || !currentGroup) {
        currentGroup = { source: src, foods: [] };
        groups.push(currentGroup);
        currentSource = src;
      }
      currentGroup.foods.push({ food, idx });
    });
    return groups;
  };

  // ─── Styles ─────────────────────────────────────────────────────────
  const $ = {
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    header: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      paddingHorizontal: 16 * s, paddingTop: 52 * s, paddingBottom: 12 * s,
      borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    },
    backBtn: { padding: 8 * s, marginRight: 10 * s, borderRadius: 8 * s, backgroundColor: '#1a1a1a' },
    headerTitle: { fontSize: 18 * s, fontWeight: '700' as const, color: '#fff' },
    headerSub: { fontSize: 12 * s, color: '#64748b', marginTop: 1 * s },
    scroll: { padding: 16 * s, paddingBottom: 60 * s } as const,
    card: {
      backgroundColor: '#111', borderRadius: 14 * s,
      borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 * s,
      overflow: 'hidden' as const,
    },
    cardHeader: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      justifyContent: 'space-between' as const, padding: 14 * s,
    },
    cardHeaderLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 * s },
    cardTitle: { fontSize: 15 * s, fontWeight: '700' as const, color: '#fff' },
    cardBody: { paddingHorizontal: 14 * s, paddingBottom: 14 * s },
    inputLabel: { fontSize: 11 * s, color: '#94a3b8', marginBottom: 4 * s },
    velOption: {
      borderRadius: 10 * s, padding: 12 * s, marginBottom: 8 * s,
      borderWidth: 1, borderColor: '#252525', backgroundColor: '#0a0a0a',
    },
    velOptionSelected: { borderColor: '#8b5cf6', backgroundColor: '#8b5cf615' },
    velRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    velName: { fontSize: 14 * s, fontWeight: '700' as const, color: '#fff' },
    velCal: { fontSize: 14 * s, fontWeight: '700' as const, color: '#8b5cf6' },
    velDesc: { fontSize: 11 * s, color: '#94a3b8', marginTop: 4 * s },
    btn: {
      borderRadius: 12 * s, paddingVertical: 12 * s,
      alignItems: 'center' as const, justifyContent: 'center' as const,
      flexDirection: 'row' as const, gap: 8 * s,
    },
    btnPrimary: { backgroundColor: '#8b5cf6' } as const,
    btnSecondary: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' } as const,
    btnDisabled: { opacity: 0.5 } as const,
    btnText: { fontSize: 14 * s, fontWeight: '700' as const, color: '#fff' },
    btnRow: { flexDirection: 'row' as const, gap: 8 * s, marginTop: 4 * s },
    noData: { fontSize: 13 * s, color: '#64748b', textAlign: 'center' as const, paddingVertical: 12 * s },
    divider: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 12 * s },
    infoRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 4 * s },
    infoLabel: { fontSize: 12 * s, color: '#64748b' },
    infoValue: { fontSize: 12 * s, color: '#e2e8f0', fontWeight: '600' as const },
    input: {
      backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#252525',
      borderRadius: 8 * s, padding: 10 * s, color: '#fff', fontSize: 14 * s,
      marginBottom: 8 * s,
    },
    barContainer: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, gap: 3 * s, height: 60 * s, marginVertical: 8 * s },
    bar: { flex: 1, borderRadius: 3 * s, minWidth: 8 * s },
    dayItem: {
      borderRadius: 8 * s, padding: 10 * s, marginBottom: 6 * s,
      borderWidth: 1, borderColor: '#1a1a1a', backgroundColor: '#0a0a0a',
    },
    dayRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const },
    // Planning meal card
    planMealCard: {
      backgroundColor: '#0a0a0a', borderRadius: 10 * s, borderWidth: 1,
      borderColor: '#1a1a1a', marginBottom: 8 * s, overflow: 'hidden' as const,
    },
    planMealHeader: {
      flexDirection: 'row' as const, justifyContent: 'space-between' as const,
      alignItems: 'center' as const, padding: 10 * s,
    },
    planMealLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 * s },
    foodRow: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: 4 * s, paddingHorizontal: 10 * s, gap: 4 * s },
    foodName: { flex: 1, fontSize: 10 * s, color: '#e2e8f0', fontWeight: '500' as const },
    foodInput: {
      fontSize: 11 * s, color: '#fff', textAlign: 'center' as const, paddingVertical: 2 * s,
      paddingHorizontal: 3 * s, borderWidth: 1, borderColor: '#252525', borderRadius: 4 * s,
      width: 38 * s, backgroundColor: '#111',
    },
    recipeGroupDot: { width: 5 * s, height: 5 * s, borderRadius: 3 * s, backgroundColor: '#8b5cf6' },
  };

  // Adherence last 14 days for bar chart
  const last14 = useMemo(() => {
    if (!adherence?.summaries) return [];
    return adherence.summaries.slice(0, 14).reverse();
  }, [adherence]);

  const activePlanMeals = MEAL_ORDER.filter(k => enabledPlanMeals[k]);

  return (
    <View style={$.container}>
      {/* Header */}
      <View style={$.header}>
        <Pressable style={$.backBtn} onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(doctor)/patients' as any);
        }}>
          <ArrowLeft size={18 * s} color="#e2e8f0" />
        </Pressable>
        <View>
          <Text style={$.headerTitle}>Plan Nutricional</Text>
          <Text style={$.headerSub}>{patientName}</Text>
        </View>
      </View>

      <ScrollView style={$.container} contentContainerStyle={$.scroll}>

        {/* ── Plan actual (collapsible) ─────────────────────────── */}
        <View style={$.card}>
          <Pressable style={$.cardHeader} onPress={() => setPlanExpanded(p => !p)}>
            <View style={$.cardHeaderLeft}>
              <Apple size={16 * s} color="#16a34a" />
              <Text style={$.cardTitle}>Plan actual</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 * s }}>
              {currentPlan?.tiene_plan && (
                <Text style={{ fontSize: 11 * s, color: '#94a3b8' }}>
                  {fmt(currentPlan.calorias_totales)} kcal
                  {currentPlan.dias_desde_creacion != null && ` · ${currentPlan.dias_desde_creacion}d`}
                </Text>
              )}
              {planExpanded
                ? <ChevronUp size={16 * s} color="#64748b" />
                : <ChevronDown size={16 * s} color="#64748b" />}
            </View>
          </Pressable>

          {planExpanded && (
            <View style={$.cardBody}>
              {loadingDash ? (
                <ActivityIndicator size="small" color="#8b5cf6" />
              ) : currentPlan?.tiene_plan ? (
                <>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 * s }}>
                    <PlanStat label="Calorias" value={fmt(currentPlan.calorias_totales)} unit="kcal" s={s} />
                    <PlanStat label="Proteina" value={fmt(currentPlan.proteina_total)} unit="g" s={s} color="#8b5cf6" />
                    <PlanStat label="Grasa" value={fmt(currentPlan.grasa_total)} unit="g" s={s} color="#f59e0b" />
                    <PlanStat label="Carbos" value={fmt(currentPlan.carbohidratos_total)} unit="g" s={s} color="#16a34a" />
                  </View>
                  {currentPlan.fecha_creacion && (
                    <View style={[$.infoRow, { marginTop: 8 * s }]}>
                      <Text style={$.infoLabel}>Creado</Text>
                      <Text style={$.infoValue}>{String(currentPlan.fecha_creacion).slice(0, 10)}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={$.noData}>Sin plan nutricional activo</Text>
              )}

              <View style={$.divider} />
              <Pressable onPress={() => setShowManualPlan(p => !p)}>
                <Text style={{ fontSize: 13 * s, color: '#8b5cf6', fontWeight: '600' }}>
                  {showManualPlan ? 'Ocultar plan manual' : '+ Crear plan manual'}
                </Text>
              </Pressable>

              {showManualPlan && (
                <View style={{ marginTop: 8 * s }}>
                  <Text style={$.inputLabel}>Calorias</Text>
                  <TextInput style={$.input} keyboardType="numeric" value={manualCal} onChangeText={setManualCal} placeholder="ej. 2200" placeholderTextColor="#555" />
                  <Text style={$.inputLabel}>Proteina (g)</Text>
                  <TextInput style={$.input} keyboardType="numeric" value={manualP} onChangeText={setManualP} placeholder="ej. 140" placeholderTextColor="#555" />
                  <Text style={$.inputLabel}>Grasa (g)</Text>
                  <TextInput style={$.input} keyboardType="numeric" value={manualG} onChangeText={setManualG} placeholder="ej. 65" placeholderTextColor="#555" />
                  <Text style={$.inputLabel}>Carbohidratos (g)</Text>
                  <TextInput style={$.input} keyboardType="numeric" value={manualC} onChangeText={setManualC} placeholder="ej. 250" placeholderTextColor="#555" />
                  <Pressable
                    style={[$.btn, $.btnPrimary, { marginTop: 4 * s }, manualPlanMut.isPending && $.btnDisabled]}
                    onPress={() => manualPlanMut.mutate()}
                    disabled={manualPlanMut.isPending}
                  >
                    {manualPlanMut.isPending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Save size={15 * s} color="#fff" />}
                    <Text style={$.btnText}>Guardar plan manual</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Calculadora ────────────────────────────────────────── */}
        <View style={$.card}>
          <Pressable style={$.cardHeader} onPress={() => setCalcExpanded(p => !p)}>
            <View style={$.cardHeaderLeft}>
              <RefreshCw size={16 * s} color="#8b5cf6" />
              <Text style={$.cardTitle}>Calcular nuevo plan</Text>
            </View>
            {calcExpanded
              ? <ChevronUp size={16 * s} color="#64748b" />
              : <ChevronDown size={16 * s} color="#64748b" />}
          </Pressable>

          {calcExpanded && (
            <View style={$.cardBody}>
              <Text style={$.inputLabel}>Factor de actividad</Text>
              <ActivitySlider value={factorActividad} onChange={setFactorActividad} s={s} />

              <View style={$.btnRow}>
                <Pressable
                  style={[$.btn, $.btnSecondary, { flex: 1 }, calcMut.isPending && $.btnDisabled]}
                  onPress={() => calcMut.mutate()}
                  disabled={calcMut.isPending}
                >
                  {calcMut.isPending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <RefreshCw size={15 * s} color="#e2e8f0" />}
                  <Text style={$.btnText}>Calcular opciones</Text>
                </Pressable>
              </View>

              {calcResult && (
                <>
                  <View style={$.divider} />
                  <View style={$.infoRow}>
                    <Text style={$.infoLabel}>TDEE mantenimiento</Text>
                    <Text style={$.infoValue}>{calcResult.tdee_mantenimiento} kcal</Text>
                  </View>
                  <View style={$.infoRow}>
                    <Text style={$.infoLabel}>Tipo de objetivo</Text>
                    <Text style={[$.infoValue, {
                      color: calcResult.tipo_objetivo === 'perdida' ? '#ef4444'
                        : calcResult.tipo_objetivo === 'ganancia' ? '#16a34a' : '#f59e0b',
                    }]}>
                      {calcResult.tipo_objetivo === 'perdida' ? 'Perdida de grasa'
                        : calcResult.tipo_objetivo === 'ganancia' ? 'Ganancia muscular' : 'Mantenimiento'}
                    </Text>
                  </View>

                  <View style={$.divider} />
                  <Text style={[$.inputLabel, { marginBottom: 8 * s }]}>Velocidad de cambio</Text>

                  {calcResult.opciones_velocidad?.map((opt: any, idx: number) => (
                    <Pressable
                      key={idx}
                      style={[$.velOption, idx === selectedVelocity && $.velOptionSelected]}
                      onPress={() => setSelectedVelocity(idx)}
                    >
                      <View style={$.velRow}>
                        <Text style={$.velName}>{opt.nombre}</Text>
                        <Text style={$.velCal}>{opt.calorias} kcal</Text>
                      </View>
                      <Text style={$.velDesc}>{opt.descripcion}</Text>
                      <View style={{ flexDirection: 'row', gap: 12 * s, marginTop: 8 * s }}>
                        <MacroBadge label="P" val={opt.macros?.proteina_g} s={s} color="#8b5cf6" />
                        <MacroBadge label="G" val={opt.macros?.grasa_g} s={s} color="#f59e0b" />
                        <MacroBadge label="C" val={opt.macros?.carbohidratos_g} s={s} color="#16a34a" />
                      </View>
                    </Pressable>
                  ))}

                  <Pressable
                    style={[$.btn, $.btnPrimary, { marginTop: 8 * s }, savePlanMut.isPending && $.btnDisabled]}
                    onPress={() => savePlanMut.mutate()}
                    disabled={savePlanMut.isPending}
                  >
                    {savePlanMut.isPending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Save size={15 * s} color="#fff" />}
                    <Text style={$.btnText}>Guardar plan nutricional</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── Adherencia nutricional ──────────────────────────────── */}
        <View style={$.card}>
          <Pressable style={$.cardHeader} onPress={() => setAdherenceExpanded(p => !p)}>
            <View style={$.cardHeaderLeft}>
              <BarChart3 size={16 * s} color="#16a34a" />
              <Text style={$.cardTitle}>Adherencia nutricional</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 * s }}>
              {adherence && adherence.total_days > 0 && (
                <Text style={{ fontSize: 11 * s, color: scoreColor(adherence.average_score), fontWeight: '700' }}>
                  {fmt(adherence.average_score)}/100
                </Text>
              )}
              {adherenceExpanded
                ? <ChevronUp size={16 * s} color="#64748b" />
                : <ChevronDown size={16 * s} color="#64748b" />}
            </View>
          </Pressable>

          {adherenceExpanded && (
            <View style={$.cardBody}>
              {loadingAdherence ? (
                <ActivityIndicator size="small" color="#8b5cf6" />
              ) : !adherence || adherence.total_days === 0 ? (
                <Text style={$.noData}>Sin datos de registro. El paciente aun no ha guardado dias.</Text>
              ) : (
                <>
                  {/* Summary stats */}
                  <View style={{ flexDirection: 'row', gap: 8 * s, marginBottom: 12 * s }}>
                    <PlanStat label="Score prom." value={fmt(adherence.average_score)} unit="/100" s={s} color={scoreColor(adherence.average_score)} />
                    <PlanStat label="Racha" value={String(adherence.streak)} unit="dias" s={s} color="#8b5cf6" />
                    <PlanStat label="Registros" value={String(adherence.total_days)} unit="dias" s={s} />
                  </View>

                  {/* Bar chart */}
                  {last14.length > 0 && (
                    <>
                      <Text style={$.inputLabel}>Ultimos {last14.length} dias</Text>
                      <View style={$.barContainer}>
                        {last14.map((day: any) => {
                          const h = Math.max(4, (day.daily_score / 100) * 56 * s);
                          return (
                            <Pressable
                              key={day.fecha}
                              style={[$.bar, { height: h, backgroundColor: scoreColor(day.daily_score) }]}
                              onPress={() => setExpandedDay(expandedDay === day.fecha ? null : day.fecha)}
                            />
                          );
                        })}
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 8 * s, color: '#555' }}>{last14[0]?.fecha?.slice(5)}</Text>
                        <Text style={{ fontSize: 8 * s, color: '#555' }}>{last14[last14.length - 1]?.fecha?.slice(5)}</Text>
                      </View>
                    </>
                  )}

                  {/* Day list */}
                  <View style={[$.divider, { marginTop: 8 * s }]} />
                  <Text style={$.inputLabel}>Detalle por dia</Text>
                  {adherence.summaries.map((day: any) => (
                    <Pressable
                      key={day.fecha}
                      style={$.dayItem}
                      onPress={() => setExpandedDay(expandedDay === day.fecha ? null : day.fecha)}
                    >
                      <View style={$.dayRow}>
                        <Text style={{ fontSize: 12 * s, color: '#e2e8f0', fontWeight: '600' }}>
                          {day.fecha}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 * s }}>
                          <Text style={{ fontSize: 11 * s, color: '#94a3b8' }}>
                            {day.meals_completed}/{day.meals_total}
                          </Text>
                          <View style={{
                            backgroundColor: scoreColor(day.daily_score) + '22',
                            paddingHorizontal: 8 * s, paddingVertical: 2 * s, borderRadius: 8 * s,
                          }}>
                            <Text style={{ fontSize: 13 * s, fontWeight: '700', color: scoreColor(day.daily_score) }}>
                              {Math.round(day.daily_score)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Expanded day detail — with circles and foods */}
                      {expandedDay === day.fecha && (
                        <View style={{ marginTop: 10 * s }}>
                          {/* Day macro circles */}
                          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 * s, marginBottom: 10 * s }}>
                            <CircleProgress size={44} strokeWidth={3} s={s}
                              progress={day.target_p > 0 ? day.total_p / day.target_p : 0}
                              color="#8b5cf6" label="P" value={day.total_p || 0} target={day.target_p || 0} />
                            <CircleProgress size={44} strokeWidth={3} s={s}
                              progress={day.target_g > 0 ? day.total_g / day.target_g : 0}
                              color="#f59e0b" label="G" value={day.total_g || 0} target={day.target_g || 0} />
                            <CircleProgress size={44} strokeWidth={3} s={s}
                              progress={day.target_c > 0 ? day.total_c / day.target_c : 0}
                              color="#16a34a" label="C" value={day.total_c || 0} target={day.target_c || 0} />
                          </View>

                          {/* Meals detail */}
                          {dayDetail && dayDetail.fecha === day.fecha && sortMeals(dayDetail.meals || []).map((m: any) => (
                            <View key={m.meal_key} style={{
                              marginTop: 4 * s, paddingVertical: 6 * s, paddingHorizontal: 8 * s,
                              borderRadius: 6 * s, backgroundColor: m.completed ? '#16a34a10' : '#0a0a0a',
                              borderWidth: 1, borderColor: m.completed ? '#16a34a30' : '#1a1a1a',
                              marginBottom: 4 * s,
                            }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 12 * s, color: m.completed ? '#e2e8f0' : '#64748b', fontWeight: '600' }}>
                                  {m.completed ? '✓ ' : '○ '}{MEAL_EMOJIS[m.meal_key] || ''} {MEAL_LABELS[m.meal_key] || m.meal_key}
                                </Text>
                                <Text style={{ fontSize: 10 * s, color: '#94a3b8' }}>
                                  {fmt(m.total_p)}P {fmt(m.total_g)}G {fmt(m.total_c)}C
                                </Text>
                              </View>
                              {m.recipe_name && (
                                <Text style={{ fontSize: 10 * s, color: '#8b5cf6', marginTop: 2 * s, paddingLeft: 4 * s }}>
                                  {m.recipe_name}
                                </Text>
                              )}
                              {m.foods_json && Array.isArray(m.foods_json) && m.foods_json.length > 0 && (
                                <View style={{ paddingLeft: 4 * s, marginTop: 4 * s }}>
                                  {m.foods_json.map((f: any, fi: number) => (
                                    <View key={fi} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 * s }}>
                                      <Text style={{ fontSize: 9 * s, color: '#94a3b8', flex: 1 }} numberOfLines={1}>
                                        {f.nombre || f.Largadescripcion}
                                      </Text>
                                      <Text style={{ fontSize: 9 * s, color: '#64748b' }}>
                                        {Math.round(f.total_gramos || 0)}g
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  ))}

                  <Pressable
                    style={[$.btn, $.btnSecondary, { marginTop: 8 * s }]}
                    onPress={() => setHistoryDays(prev => prev + 7)}
                  >
                    <Text style={[$.btnText, { fontSize: 12 * s }]}>Cargar mas dias</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── Planificar comidas (mirrors patient view) ──────────── */}
        <View style={$.card}>
          <Pressable style={$.cardHeader} onPress={() => setPlanningExpanded(p => !p)}>
            <View style={$.cardHeaderLeft}>
              <ClipboardList size={16 * s} color="#8b5cf6" />
              <Text style={$.cardTitle}>Planificar comidas</Text>
            </View>
            {planningExpanded
              ? <ChevronUp size={16 * s} color="#64748b" />
              : <ChevronDown size={16 * s} color="#64748b" />}
          </Pressable>

          {planningExpanded && (
            <View style={$.cardBody}>
              {/* Date selector */}
              <Text style={$.inputLabel}>Fecha de planificacion</Text>
              <TextInput
                style={$.input}
                value={planDate}
                onChangeText={setPlanDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#555"
              />

              {/* Meal cards — same as patient */}
              {activePlanMeals.map(mealKey => {
                const macros = getPlanMealMacros(mealKey);
                const ms = planMeals[mealKey];
                const hasFoods = ms?.foods && ms.foods.length > 0;
                const foodSums = hasFoods ? sumFoods(ms.foods) : null;

                return (
                  <View key={mealKey} style={$.planMealCard}>
                    <View style={$.planMealHeader}>
                      <View style={$.planMealLeft}>
                        <Text style={{ fontSize: 16 * s }}>{MEAL_EMOJIS[mealKey]}</Text>
                        <Text style={{ fontSize: 13 * s, fontWeight: '600', color: '#e2e8f0' }}>
                          {MEAL_LABELS[mealKey]}
                        </Text>
                        {ms?.calculating && <ActivityIndicator size="small" color="#8b5cf6" />}
                      </View>
                      {macros && (
                        <Text style={{ fontSize: 10 * s, color: '#64748b' }}>
                          {Math.round(macros.proteina)}P {Math.round(macros.grasa)}G {Math.round(macros.carbohidratos)}C
                        </Text>
                      )}
                    </View>

                    {/* Macro circles if foods exist */}
                    {hasFoods && macros && foodSums && (
                      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 * s, paddingVertical: 4 * s }}>
                        <CircleProgress size={38} strokeWidth={3} s={s}
                          progress={macros.proteina > 0 ? foodSums.p / macros.proteina : 0}
                          color="#8b5cf6" label="P" value={foodSums.p} target={macros.proteina} />
                        <CircleProgress size={38} strokeWidth={3} s={s}
                          progress={macros.grasa > 0 ? foodSums.g / macros.grasa : 0}
                          color="#f59e0b" label="G" value={foodSums.g} target={macros.grasa} />
                        <CircleProgress size={38} strokeWidth={3} s={s}
                          progress={macros.carbohidratos > 0 ? foodSums.c / macros.carbohidratos : 0}
                          color="#16a34a" label="C" value={foodSums.c} target={macros.carbohidratos} />
                      </View>
                    )}

                    {/* Food list grouped by recipe */}
                    {hasFoods && (() => {
                      const groups = groupFoodsByRecipe(ms.foods);
                      return groups.map((group, gi) => (
                        <View key={gi}>
                          {group.source && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * s, paddingHorizontal: 10 * s, paddingTop: 4 * s }}>
                              <View style={$.recipeGroupDot} />
                              <Text style={{ fontSize: 10 * s, color: '#8b5cf6', fontWeight: '600' }} numberOfLines={1}>{group.source}</Text>
                            </View>
                          )}
                          {group.foods.map(({ food, idx }) => (
                            <View key={idx} style={[$.foodRow, food.locked && { opacity: 0.5 }]}>
                              <Pressable style={{ flex: 1, minWidth: 0 }} onLongPress={() => removePlanFood(mealKey, idx)}>
                                <Text style={$.foodName} numberOfLines={1}>{food.nombre}</Text>
                              </Pressable>
                              <TextInput
                                style={$.foodInput}
                                keyboardType="numeric"
                                value={String(Math.round(food.total_gramos))}
                                onChangeText={v => updatePlanFood(mealKey, idx, 'gramos', parseFloat(v) || 0)}
                                editable={!food.locked}
                                selectTextOnFocus
                              />
                              <Text style={{ fontSize: 9 * s, color: '#64748b', width: 8 * s }}>g</Text>
                              <TextInput
                                style={$.foodInput}
                                keyboardType="numeric"
                                value={String(rd(food.porciones, 2))}
                                onChangeText={v => updatePlanFood(mealKey, idx, 'porciones', parseFloat(v) || 0)}
                                editable={!food.locked}
                                selectTextOnFocus
                              />
                              <Text style={{ fontSize: 8 * s, color: '#64748b', maxWidth: 30 * s }} numberOfLines={1}>
                                {(food.medida_desc || 'porc.').slice(0, 5)}
                              </Text>
                              <Pressable style={{ padding: 3 * s }} onPress={() => togglePlanFoodLock(mealKey, idx)}>
                                {food.locked ? <Lock size={10 * s} color="#16a34a" /> : <Check size={10 * s} color="#555" />}
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      ));
                    })()}

                    {/* Action buttons */}
                    <View style={{ flexDirection: 'row', gap: 6 * s, padding: 8 * s }}>
                      <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 3 * s, paddingVertical: 4 * s, paddingHorizontal: 8 * s, borderRadius: 6 * s, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#252525' }}
                        onPress={() => setShowPlanRecipeSelector(mealKey)}
                      >
                        <Plus size={10 * s} color="#8b5cf6" />
                        <Text style={{ fontSize: 10 * s, color: '#8b5cf6', fontWeight: '500' }}>Receta</Text>
                      </Pressable>
                      <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 3 * s, paddingVertical: 4 * s, paddingHorizontal: 8 * s, borderRadius: 6 * s, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#252525' }}
                        onPress={() => setShowPlanFoodSearch(mealKey)}
                      >
                        <Plus size={10 * s} color="#8b5cf6" />
                        <Text style={{ fontSize: 10 * s, color: '#8b5cf6', fontWeight: '500' }}>Alimento</Text>
                      </Pressable>
                      {ms?.recipeName && (
                        <Pressable
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 3 * s, paddingVertical: 4 * s, paddingHorizontal: 8 * s, marginLeft: 'auto' }}
                          onPress={() => calculatePlanRecipe(mealKey, ms.recipeId!, ms.recipeName!)}
                          disabled={ms.calculating}
                        >
                          <Calculator size={10 * s} color="#8b5cf6" />
                          <Text style={{ fontSize: 10 * s, color: '#8b5cf6', fontWeight: '500' }}>Recalcular</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Save planning */}
              <Pressable
                style={[$.btn, $.btnPrimary, { marginTop: 8 * s }, savePlanningMut.isPending && $.btnDisabled]}
                onPress={() => savePlanningMut.mutate()}
                disabled={savePlanningMut.isPending}
              >
                {savePlanningMut.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Save size={15 * s} color="#fff" />}
                <Text style={$.btnText}>Guardar planificacion</Text>
              </Pressable>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Recipe selector modal for planning */}
      <Modal visible={showPlanRecipeSelector !== null} transparent animationType="slide" onRequestClose={() => { setShowPlanRecipeSelector(null); setPlanRecipeSearch(''); }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#111', borderTopLeftRadius: 16 * s, borderTopRightRadius: 16 * s, maxHeight: '80%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 * s, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
                <Text style={{ fontSize: 15 * s, fontWeight: '700', color: '#fff' }}>
                  Receta para {showPlanRecipeSelector ? (MEAL_LABELS[showPlanRecipeSelector] || showPlanRecipeSelector) : ''}
                </Text>
                <Pressable onPress={() => { setShowPlanRecipeSelector(null); setPlanRecipeSearch(''); }}>
                  <X size={22 * s} color="#64748b" />
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', margin: 10 * s, borderRadius: 8 * s, paddingHorizontal: 10 * s, gap: 6 * s }}>
                <Search size={14 * s} color="#64748b" />
                <TextInput
                  style={{ flex: 1, color: '#fff', fontSize: 13 * s, paddingVertical: 8 * s }}
                  placeholder="Buscar receta..."
                  placeholderTextColor="#555"
                  value={planRecipeSearch}
                  onChangeText={setPlanRecipeSearch}
                  autoFocus
                />
              </View>

              <ScrollView style={{ padding: 10 * s }} keyboardShouldPersistTaps="handled">
                {filteredPlanRecipes.length === 0 ? (
                  <Text style={{ color: '#64748b', textAlign: 'center', paddingVertical: 20 * s }}>Sin resultados</Text>
                ) : (
                  filteredPlanRecipes.map((r: any) => (
                    <Pressable
                      key={r.id}
                      style={{ paddingVertical: 10 * s, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
                      onPress={() => showPlanRecipeSelector && selectPlanRecipe(showPlanRecipeSelector, r)}
                    >
                      <Text style={{ fontSize: 13 * s, color: '#e2e8f0', fontWeight: '500' }}>{r.nombre}</Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Food search modal for planning */}
      <Modal visible={showPlanFoodSearch !== null} transparent animationType="slide" onRequestClose={() => { setShowPlanFoodSearch(null); setPlanFoodSearch(''); }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: '#111', borderTopLeftRadius: 16 * s, borderTopRightRadius: 16 * s, maxHeight: '85%' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 * s, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
                <Text style={{ fontSize: 15 * s, fontWeight: '700', color: '#fff' }}>Agregar alimento</Text>
                <Pressable onPress={() => { setShowPlanFoodSearch(null); setPlanFoodSearch(''); }}>
                  <X size={22 * s} color="#64748b" />
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0a', margin: 10 * s, borderRadius: 8 * s, paddingHorizontal: 10 * s, gap: 6 * s }}>
                <Search size={14 * s} color="#64748b" />
                <TextInput
                  style={{ flex: 1, color: '#fff', fontSize: 13 * s, paddingVertical: 8 * s }}
                  placeholder="Buscar alimento..."
                  placeholderTextColor="#555"
                  value={planFoodSearch}
                  onChangeText={setPlanFoodSearch}
                  autoFocus
                />
                {planFoodSearch.length > 0 && (
                  <Pressable onPress={() => setPlanFoodSearch('')}>
                    <X size={14 * s} color="#64748b" />
                  </Pressable>
                )}
              </View>

              <ScrollView style={{ padding: 10 * s }} keyboardShouldPersistTaps="handled">
                {!planFoodSearch || planFoodSearch.length < 2 ? (
                  <Text style={{ color: '#64748b', textAlign: 'center', paddingVertical: 20 * s }}>Escribe al menos 2 caracteres</Text>
                ) : !planFoodResults || planFoodResults.length === 0 ? (
                  <Text style={{ color: '#64748b', textAlign: 'center', paddingVertical: 20 * s }}>Sin resultados</Text>
                ) : (
                  planFoodResults.slice(0, 30).map((food: any, i: number) => (
                    <Pressable
                      key={food.ID || food.id || i}
                      style={{ paddingVertical: 10 * s, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
                      onPress={() => showPlanFoodSearch && addPlanExtraFood(showPlanFoodSearch, food)}
                    >
                      <Text style={{ fontSize: 13 * s, color: '#e2e8f0', fontWeight: '500' }}>
                        {food.Largadescripcion || food.Cortadescripcion || food.nombre}
                      </Text>
                      <Text style={{ fontSize: 10 * s, color: '#64748b', marginTop: 2 * s }}>
                        P:{rd(food.P ?? food.proteina ?? 0)} G:{rd(food.G ?? food.grasa ?? 0)} C:{rd(food.CH ?? food.carbohidratos ?? 0)} /100g
                      </Text>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Activity Slider ──────────────────────────────────────────────────────
const SLIDER_MIN = 1.2;
const SLIDER_MAX = 1.9;
const SNAP_THRESHOLD = 0.03;

function ActivitySlider({ value, onChange, s }: { value: number; onChange: (v: number) => void; s: number }) {
  const trackWidth = useRef(0);
  const trackX = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const nearest = ACTIVITY_OPTIONS.reduce((best, opt) =>
    Math.abs(opt.value - value) < Math.abs(best.value - value) ? opt : best
  , ACTIVITY_OPTIONS[0]);

  const pct = (v: number) => ((v - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  const computeValue = useCallback((pageX: number) => {
    if (!trackWidth.current) return;
    const x = pageX - trackX.current;
    const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
    let raw = SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN);
    for (const opt of ACTIVITY_OPTIONS) {
      if (Math.abs(raw - opt.value) < SNAP_THRESHOLD) { raw = opt.value; break; }
    }
    onChangeRef.current(Math.round(raw * 1000) / 1000);
  }, []);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponderCapture: (_, gs) => Math.abs(gs.dx) > Math.abs(gs.dy),
    onPanResponderGrant: (e) => computeValue(e.nativeEvent.pageX),
    onPanResponderMove: (e) => computeValue(e.nativeEvent.pageX),
    onPanResponderTerminationRequest: () => false,
  }), [computeValue]);

  const viewRef = useRef<View>(null);

  return (
    <View style={{ marginBottom: 12 * s }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 * s }}>
        <Text style={{ fontSize: 22 * s, fontWeight: '700', color: '#8b5cf6' }}>{value.toFixed(2)}</Text>
        <Text style={{ fontSize: 12 * s, color: '#94a3b8' }}>{nearest.label} — {nearest.desc}</Text>
      </View>

      <View
        ref={viewRef}
        {...panResponder.panHandlers}
        onLayout={(e: LayoutChangeEvent) => {
          trackWidth.current = e.nativeEvent.layout.width;
          if (viewRef.current) {
            const node = viewRef.current as any;
            if (node.measure) {
              node.measure((_x: number, _y: number, _w: number, _h: number, pageX: number) => {
                if (pageX != null) trackX.current = pageX;
              });
            } else if (node.getBoundingClientRect) {
              trackX.current = node.getBoundingClientRect().left;
            }
          }
        }}
        style={{ height: 48 * s, justifyContent: 'center', paddingVertical: 8 * s }}
      >
        <View style={{ height: 4 * s, backgroundColor: '#252525', borderRadius: 2 * s }} />
        <View style={{
          position: 'absolute', left: 0, height: 4 * s, borderRadius: 2 * s,
          backgroundColor: '#8b5cf6', width: `${pct(value)}%`,
        }} />
        {ACTIVITY_OPTIONS.map(opt => (
          <View key={opt.value} style={{
            position: 'absolute', left: `${pct(opt.value)}%`,
            width: 8 * s, height: 8 * s, borderRadius: 4 * s, marginLeft: -4 * s,
            backgroundColor: value >= opt.value ? '#8b5cf6' : '#444',
          }} />
        ))}
        <View style={{
          position: 'absolute', left: `${pct(value)}%`, marginLeft: -10 * s,
          width: 20 * s, height: 20 * s, borderRadius: 10 * s,
          backgroundColor: '#8b5cf6', borderWidth: 2, borderColor: '#c4b5fd',
        }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 * s }}>
        {ACTIVITY_OPTIONS.map(opt => (
          <Text key={opt.value} style={{
            fontSize: 8 * s, color: Math.abs(value - opt.value) < SNAP_THRESHOLD ? '#8b5cf6' : '#555',
            textAlign: 'center', width: 50 * s,
          }}>{opt.label}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────
function PlanStat({ label, value, unit, s, color }: {
  label: string; value: string; unit: string; s: number; color?: string;
}) {
  return (
    <View style={{
      flex: 1, minWidth: '22%', backgroundColor: '#0a0a0a',
      borderRadius: 10 * s, padding: 10 * s, alignItems: 'center',
    }}>
      <Text style={{ fontSize: 10 * s, color: '#64748b', marginBottom: 2 * s }}>{label}</Text>
      <Text style={{ fontSize: 18 * s, fontWeight: '700', color: color || '#e2e8f0' }}>{value}</Text>
      <Text style={{ fontSize: 9 * s, color: '#94a3b8' }}>{unit}</Text>
    </View>
  );
}

function MacroBadge({ label, val, s, color }: { label: string; val: number; s: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 * s }}>
      <View style={{ width: 6 * s, height: 6 * s, borderRadius: 3 * s, backgroundColor: color }} />
      <Text style={{ fontSize: 11 * s, color: '#94a3b8' }}>
        {label}: {val != null ? `${Math.round(val)}g` : '—'}
      </Text>
    </View>
  );
}
