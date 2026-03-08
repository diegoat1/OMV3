// Patient Situation - Current status overview with body composition metrics

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, AlertCircle, ChevronRight, Droplets, Target, Scale, Activity } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';
import { useAuth } from '../../src/contexts/AuthContext';
import { analyticsService, userService } from '../../src/services/api';
import { ScoreCategory, ScoreColor } from '../../src/models';
import { calcularAguaRecomendada, getMissingInputsForMetric, getPrioritizedMissingInputs, MissingInput } from '../../src/core/metabolism';

// Helper para obtener icono de tendencia
const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp size={16} color={Colors.success} />;
    case 'down':
      return <TrendingDown size={16} color={Colors.error} />;
    default:
      return <Minus size={16} color={Colors.gray400} />;
  }
};

// Helper para color de tendencia
const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return Colors.success;
    case 'down':
      return Colors.error;
    default:
      return Colors.gray400;
  }
};

// Helper para color de score
const getScoreColor = (score: number) => {
  if (score >= 70) return Colors.success;
  if (score >= 50) return Colors.warning;
  return Colors.error;
};

// Helper para color de categoría
const getCategoryColor = (color: ScoreColor) => {
  switch (color) {
    case 'green': return Colors.success;
    case 'yellow': return Colors.warning;
    case 'red': return Colors.error;
  }
};

// Componente para categoría de score con barra de progreso
interface CategoryRowProps {
  category: ScoreCategory;
  onPress?: () => void;
}

function CategoryRow({ category, onPress }: CategoryRowProps) {
  const color = getCategoryColor(category.color);
  
  return (
    <Pressable style={styles.categoryRow} onPress={onPress}>
      <View style={styles.categoryLeft}>
        <Text style={styles.categoryEmoji}>{category.emoji}</Text>
        <View style={styles.categoryInfo}>
          <View style={styles.categoryNameRow}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={[styles.categoryScore, { color }]}>{category.score}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[
              styles.progressBarFill, 
              { width: `${category.score}%` as any, backgroundColor: color }
            ]} />
          </View>
          <Text style={styles.categoryImprovement}>{category.improvement}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={Colors.gray400} />
    </Pressable>
  );
}

// Componente para métrica con posible dato faltante
interface MetricCardProps {
  label: string;
  value?: number | string;
  unit?: string;
  subtitle?: string;
  missingField?: string;
  onLoadPress?: () => void;
  color?: string;
}

function MetricCard({ label, value, unit, subtitle, missingField, onLoadPress, color }: MetricCardProps) {
  const hasValue = value !== undefined && value !== null;
  
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      {hasValue ? (
        <>
          <Text style={[styles.metricValue, color ? { color } : {}]}>
            {typeof value === 'number' ? value.toFixed(1) : value}{unit ? ` ${unit}` : ''}
          </Text>
          {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
        </>
      ) : (
        <View style={styles.missingData}>
          <AlertCircle size={16} color={Colors.warning} />
          <Text style={styles.missingText}>Falta dato: {missingField}</Text>
          {onLoadPress && (
            <Pressable style={styles.loadButton} onPress={onLoadPress}>
              <Text style={styles.loadButtonText}>Cargar ahora</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// Helper para calcular tendencia del perímetro abdomen
function calcularTendenciaWaist(history: { date: string; value: number }[]): { 
  trend: 'up' | 'down' | 'stable'; 
  change: number;
  hasEnoughData: boolean;
} {
  if (history.length < 2) {
    return { trend: 'stable', change: 0, hasEnoughData: false };
  }
  
  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest = sorted[0].value;
  const previous = sorted[1].value;
  const change = latest - previous;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (change < -0.5) trend = 'down'; // Bajó (bueno para cintura)
  else if (change > 0.5) trend = 'up'; // Subió (malo para cintura)
  
  return { trend, change, hasEnoughData: true };
}

export default function SituationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || '';

  // Real API: dashboard data with body composition and scores
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => analyticsService.getDashboard(userId),
    select: (res) => res.data,
    enabled: !!userId,
  });

  // Real API: goals
  const { data: goals } = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => userService.getGoals(userId),
    select: (res) => res.data,
    enabled: !!userId,
  });

  // Real API: auto goals
  const { data: autoGoals } = useQuery({
    queryKey: ['autoGoals', userId],
    queryFn: () => userService.getAutoGoals(userId),
    select: (res) => res.data,
    enabled: !!userId,
  });

  // Real API: body composition history
  const { data: compHistory } = useQuery({
    queryKey: ['bodyCompositionHistory', userId],
    queryFn: () => analyticsService.getBodyCompositionHistory(userId, 14),
    select: (res) => {
      const d = res.data;
      return Array.isArray(d) ? d : (d as any)?.history || [];
    },
    enabled: !!userId,
  });

  // Derive body data from dashboard
  const comp = dashboard?.composicion_corporal;
  const meta = dashboard?.metadata;
  const body = {
    weight: comp?.peso || 0,
    height: comp?.altura || 0,
    age: (meta as any)?.edad || 0,
    sex: (meta?.sexo === 'F' ? 'female' : 'male') as 'male' | 'female',
    waist: (comp as any)?.circunferencia_cintura || comp?.abdomen,
    hip: (comp as any)?.circunferencia_cadera,
    neck: (comp as any)?.circunferencia_cuello || undefined,
    bodyFatPercentage: comp?.bf_percent,
    leanMass: comp?.peso_magro,
    ffmi: comp?.ffmi,
    bmi: comp?.imc,
    fatMass: comp?.peso_graso,
    bodyScore: dashboard?.scores?.score_total,
    bodyScoreTrend: undefined as 'up' | 'down' | 'stable' | undefined,
    bodyScoreChange7d: undefined as number | undefined,
  };

  // Build waist history from composition history
  // API returns uppercase aliases: CIRC_CINTURA, CIRC_ABDOMEN, FECHA_REGISTRO
  const histArr = Array.isArray(compHistory) ? compHistory : [];
  const waistHistory = histArr
    .filter((m: any) => m.CIRC_CINTURA || m.CIRC_ABDOMEN || m.circunferencia_cintura || m.circunferencia_abdomen)
    .map((m: any) => ({
      date: m.FECHA_REGISTRO || m.fecha,
      value: m.CIRC_CINTURA || m.CIRC_ABDOMEN || m.circunferencia_cintura || m.circunferencia_abdomen
    }))
    .reverse();

  // Map factor_actividad number to ActivityLevel
  const factorActividad = (meta as any)?.nivel_actividad;
  const activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' =
    factorActividad >= 1.725 ? 'very_active'
    : factorActividad >= 1.55 ? 'active'
    : factorActividad >= 1.375 ? 'moderate'
    : factorActividad >= 1.2 ? 'light'
    : 'sedentary';

  // Calcular agua recomendada usando el core TS
  const hydrationResult = calcularAguaRecomendada({
    weight: body.weight,
    activityLevel: factorActividad ? activityLevel : 'light',
  });

  // Calcular tendencia del perímetro abdomen
  const waistTrend = calcularTendenciaWaist(waistHistory);

  // Obtener datos faltantes priorizados
  const userProfile = {
    weight: body.weight,
    height: body.height,
    age: body.age,
    sex: body.sex,
    waist: body.waist,
    hip: body.hip,
    neck: body.neck,
    bodyFatPercentage: body.bodyFatPercentage,
    leanMass: body.leanMass,
    waistHistory,
  };
  const prioritizedMissing = getPrioritizedMissingInputs(userProfile);

  // Derive objectives - API returns {user_id, goal: {goal_bf, goal_ffmi, goal_peso, ...}}
  const goalsData = (goals as any)?.goal;
  const objective = goalsData ? {
    title: 'Objetivo Definido',
    description: goalsData.descripcion || 'Objetivo personalizado',
    targetWeight: goalsData.goal_peso,
    targetBodyFat: goalsData.goal_bf,
    targetFfmi: goalsData.goal_ffmi,
    targetWaist: goalsData.goal_abdomen,
    estimatedWeeks: goalsData.semanas_estimadas,
    isAccepted: !!(goalsData.goal_peso || goalsData.goal_bf || goalsData.goal_ffmi),
  } : null;
  const autoObjective = autoGoals ? {
    title: 'Objetivo Automatico',
    description: (autoGoals as any).descripcion || 'Objetivo genetico calculado',
    targetWeight: (autoGoals as any).objetivos_geneticos?.peso_objetivo,
    targetBodyFat: (autoGoals as any).objetivos_geneticos?.bf_esencial,
    targetFfmi: (autoGoals as any).objetivos_geneticos?.ffmi_limite,
    targetWaist: (autoGoals as any).objetivos_geneticos?.circ_abdomen_objetivo,
    estimatedWeeks: (autoGoals as any).tiempo_estimado?.semanas,
    isAccepted: false,
  } : null;
  const hasDefinedObjective = objective && objective.isAccepted;
  const displayObjective = hasDefinedObjective ? objective : autoObjective;

  return (
    <View style={styles.container}>
      <BuildBanner />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Puntaje Corporal Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Puntaje Corporal</Text>
            {body.bodyScore !== undefined && (
              <View style={[
                styles.trendBadge,
                { backgroundColor: getTrendColor(body.bodyScoreTrend) + '20' }
              ]}>
                {getTrendIcon(body.bodyScoreTrend)}
                <Text style={[styles.trendText, { color: getTrendColor(body.bodyScoreTrend) }]}>
                  {body.bodyScoreChange7d !== undefined ? 
                    `${body.bodyScoreChange7d > 0 ? '+' : ''}${body.bodyScoreChange7d}` : 
                    '→'
                  } semanal
                </Text>
              </View>
            )}
          </View>
          
          {body.bodyScore !== undefined ? (
            <Text style={[styles.scoreValue, { color: getScoreColor(body.bodyScore) }]}>
              {body.bodyScore}
            </Text>
          ) : (
            <View style={styles.missingScoreContainer}>
              <AlertCircle size={32} color={Colors.warning} />
              <Text style={styles.missingScoreText}>Faltan datos para calcular</Text>
              <Pressable 
                style={styles.loadScoreButton}
                onPress={() => router.push('/(patient)/health' as any)}
              >
                <Text style={styles.loadScoreButtonText}>Completar mediciones</Text>
              </Pressable>
            </View>
          )}
          
          <Text style={styles.scoreSubtext}>de 100 puntos</Text>
        </View>

        {/* Panel de Categorías */}
        <View style={styles.categoriesPanel}>
          <View style={styles.categoriesPanelHeader}>
            <Text style={styles.sectionTitle}>Detalle por Categorías</Text>
          </View>
          
          {/* TODO FASE 4: Categories come from enriched analytics dashboard */}
          {(dashboard?.scores ? [
            { id: 'bf', name: 'Grasa Corporal', emoji: '🔥', score: dashboard.scores.score_bf, color: dashboard.scores.score_bf >= 70 ? 'green' as ScoreColor : dashboard.scores.score_bf >= 40 ? 'yellow' as ScoreColor : 'red' as ScoreColor, improvement: dashboard.scores.categoria_bf },
            { id: 'ffmi', name: 'Masa Muscular', emoji: '💪', score: dashboard.scores.score_ffmi, color: dashboard.scores.score_ffmi >= 70 ? 'green' as ScoreColor : dashboard.scores.score_ffmi >= 40 ? 'yellow' as ScoreColor : 'red' as ScoreColor, improvement: dashboard.scores.categoria_ffmi },
          ] : []).map((category) => (
            <CategoryRow 
              key={category.id} 
              category={category}
              onPress={() => router.push({
                pathname: '/(patient)/score-detail',
                params: { categoryId: category.id }
              } as any)}
            />
          ))}
        </View>

        {/* Perímetro Abdomen con Tendencia */}
        <Text style={styles.sectionTitle}>Perímetro Abdomen</Text>
        <View style={styles.singleMetricCard}>
          {body.waist !== undefined ? (
            <View style={styles.waistContent}>
              <View style={styles.waistMain}>
                <Scale size={24} color={Colors.primary} />
                <Text style={styles.waistValue}>{body.waist} cm</Text>
                {waistTrend.hasEnoughData && (
                  <View style={[
                    styles.waistTrendBadge,
                    { backgroundColor: waistTrend.trend === 'down' ? Colors.success + '20' : 
                                       waistTrend.trend === 'up' ? Colors.error + '20' : Colors.gray100 }
                  ]}>
                    {waistTrend.trend === 'down' ? (
                      <TrendingDown size={14} color={Colors.success} />
                    ) : waistTrend.trend === 'up' ? (
                      <TrendingUp size={14} color={Colors.error} />
                    ) : (
                      <Minus size={14} color={Colors.gray400} />
                    )}
                    <Text style={[
                      styles.waistTrendText,
                      { color: waistTrend.trend === 'down' ? Colors.success : 
                               waistTrend.trend === 'up' ? Colors.error : Colors.gray500 }
                    ]}>
                      {waistTrend.change > 0 ? '+' : ''}{waistTrend.change.toFixed(1)} cm
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.waistSubtext}>
                {waistTrend.hasEnoughData 
                  ? `Tendencia: ${waistTrend.trend === 'down' ? '↓ Bajando' : waistTrend.trend === 'up' ? '↑ Subiendo' : '→ Estable'} (${waistHistory.length} registros)`
                  : 'Último registro'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.missingWaist}>
              <AlertCircle size={20} color={Colors.warning} />
              <Text style={styles.missingText}>Falta dato: Perímetro abdomen</Text>
              <Pressable 
                style={styles.loadButton}
                onPress={() => router.push('/(patient)/health' as any)}
              >
                <Text style={styles.loadButtonText}>Cargar ahora</Text>
                <ChevronRight size={14} color={Colors.primary} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Hidratación - Calculada con Core TS */}
        <Text style={styles.sectionTitle}>Hidratación Diaria</Text>
        <View style={styles.singleMetricCard}>
          <View style={styles.waterContent}>
            <Droplets size={24} color={Colors.primary} />
            <View style={styles.waterInfo}>
              <Text style={styles.waterTarget}>
                {hydrationResult.recommendedLiters} litros/día
              </Text>
              <Text style={styles.waterSubtext}>
                {hydrationResult.formula}
              </Text>
              {hydrationResult.isEstimate && (
                <Text style={styles.waterEstimate}>* Estimación MVP</Text>
              )}
            </View>
          </View>
        </View>

        {/* Datos Faltantes - Missing Data */}
        {prioritizedMissing.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completa tu perfil</Text>
            <View style={styles.missingDataCard}>
              <Text style={styles.missingDataIntro}>
                Estos datos desbloquean más métricas:
              </Text>
              {prioritizedMissing.slice(0, 3).map((missing, index) => (
                <Pressable 
                  key={index}
                  style={styles.missingDataRow}
                  onPress={() => router.push(missing.route as any)}
                >
                  <View style={styles.missingDataInfo}>
                    <AlertCircle size={16} color={Colors.warning} />
                    <View style={styles.missingDataText}>
                      <Text style={styles.missingDataLabel}>{missing.displayName}</Text>
                      <Text style={styles.missingDataDesc}>{missing.description}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.primary} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Estado Actual - Composición Corporal */}
        <Text style={styles.sectionTitle}>Estado Actual</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Peso"
            value={body.weight}
            unit="kg"
            color={Colors.text}
          />
          <MetricCard
            label="Masa Magra"
            value={body.leanMass}
            unit="kg"
            missingField="Masa magra"
            onLoadPress={() => router.push('/(patient)/health' as any)}
          />
          <MetricCard
            label="Masa Grasa"
            value={body.fatMass}
            unit="kg"
            missingField="Masa grasa"
            onLoadPress={() => router.push('/(patient)/health' as any)}
          />
          <MetricCard
            label="BF%"
            value={body.bodyFatPercentage}
            unit="%"
            subtitle={body.bodyFatPercentage ? 
              (body.sex === 'female' ? 
                (body.bodyFatPercentage < 25 ? 'Óptimo' : body.bodyFatPercentage < 32 ? 'Normal' : 'Alto') :
                (body.bodyFatPercentage < 18 ? 'Óptimo' : body.bodyFatPercentage < 25 ? 'Normal' : 'Alto')
              ) : undefined
            }
            missingField="% Grasa corporal"
            onLoadPress={() => router.push('/(patient)/health' as any)}
          />
          <MetricCard
            label="FFMI"
            value={body.ffmi}
            subtitle={body.ffmi ? 
              (body.sex === 'female' ? 
                (body.ffmi < 15 ? 'Bajo' : body.ffmi < 17 ? 'Normal' : body.ffmi < 19 ? 'Bueno' : 'Excelente') :
                (body.ffmi < 18 ? 'Bajo' : body.ffmi < 20 ? 'Normal' : body.ffmi < 22 ? 'Bueno' : 'Excelente')
              ) : undefined
            }
            missingField="FFMI"
            onLoadPress={() => router.push('/(patient)/health' as any)}
          />
          <MetricCard
            label="Altura"
            value={body.height}
            unit="cm"
            color={Colors.text}
          />
        </View>

        {/* Objetivo */}
        <Text style={styles.sectionTitle}>Objetivo</Text>
        {displayObjective ? (
          <View style={[
            styles.objectiveCard,
            !hasDefinedObjective && styles.objectiveCardProposed
          ]}>
            <View style={styles.objectiveHeader}>
              <Target size={24} color={hasDefinedObjective ? Colors.success : Colors.warning} />
              <View style={styles.objectiveInfo}>
                <Text style={styles.objectiveTitle}>{displayObjective.title}</Text>
                {!hasDefinedObjective && (
                  <View style={styles.proposedBadge}>
                    <Text style={styles.proposedBadgeText}>Propuesto</Text>
                  </View>
                )}
              </View>
            </View>
            
            <Text style={styles.objectiveDescription}>{displayObjective.description}</Text>
            
            <View style={styles.objectiveTargets}>
              {displayObjective.targetWeight && (
                <View style={styles.targetItem}>
                  <Text style={styles.targetLabel}>Peso objetivo</Text>
                  <Text style={styles.targetValue}>{displayObjective.targetWeight} kg</Text>
                </View>
              )}
              {displayObjective.targetBodyFat && (
                <View style={styles.targetItem}>
                  <Text style={styles.targetLabel}>BF% objetivo</Text>
                  <Text style={styles.targetValue}>{displayObjective.targetBodyFat}%</Text>
                </View>
              )}
              {displayObjective.targetWaist && (
                <View style={styles.targetItem}>
                  <Text style={styles.targetLabel}>Cintura objetivo</Text>
                  <Text style={styles.targetValue}>{displayObjective.targetWaist} cm</Text>
                </View>
              )}
              {displayObjective.estimatedWeeks && (
                <View style={styles.targetItem}>
                  <Text style={styles.targetLabel}>Tiempo estimado</Text>
                  <Text style={styles.targetValue}>{displayObjective.estimatedWeeks} semanas</Text>
                </View>
              )}
            </View>
            
            {!hasDefinedObjective && (
              <View style={styles.objectiveActions}>
                <Pressable 
                  style={styles.acceptButton}
                  onPress={() => console.log('Aceptar objetivo')}
                >
                  <Text style={styles.acceptButtonText}>Aceptar</Text>
                </Pressable>
                <Pressable 
                  style={styles.editButton}
                  onPress={() => console.log('Editar objetivo')}
                >
                  <Text style={styles.editButtonText}>Editar</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noObjectiveCard}>
            <Target size={32} color={Colors.gray400} />
            <Text style={styles.noObjectiveText}>No hay objetivo definido</Text>
            <Pressable 
              style={styles.createObjectiveButton}
              onPress={() => console.log('Crear objetivo')}
            >
              <Text style={styles.createObjectiveButtonText}>Definir objetivo</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  // Score Card
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.md,
  },
  scoreLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  trendText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 72,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  missingScoreContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  missingScoreText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  loadScoreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  loadScoreButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  // Section Title
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  // Single Metric Card (Waist, Water)
  singleMetricCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  waistContent: {
    alignItems: 'center',
  },
  waistMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  waistValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  waistSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  missingWaist: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  waterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  waterInfo: {
    flex: 1,
  },
  waterTarget: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  waterSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: '47%',
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.success,
    marginTop: 2,
  },
  missingData: {
    gap: Spacing.xs,
  },
  missingText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
  },
  loadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: Spacing.xs,
  },
  loadButtonText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Objective Card
  objectiveCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  objectiveCardProposed: {
    borderLeftColor: Colors.warning,
  },
  objectiveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  objectiveInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  objectiveTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  proposedBadge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  proposedBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
  },
  objectiveDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  objectiveTargets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  targetItem: {
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: '45%',
  },
  targetLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  targetValue: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  objectiveActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.gray100,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  editButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  noObjectiveCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noObjectiveText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginVertical: Spacing.md,
  },
  createObjectiveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  createObjectiveButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  // Categories Panel Styles
  categoriesPanel: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoriesPanelHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  categoryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  categoryEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryScore: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  categoryImprovement: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  // Waist Trend Styles
  waistTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 4,
    marginLeft: Spacing.sm,
  },
  waistTrendText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  // Water Estimate Style
  waterEstimate: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Missing Data Card Styles
  missingDataCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  missingDataIntro: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  missingDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  missingDataInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  missingDataText: {
    flex: 1,
  },
  missingDataLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  missingDataDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
