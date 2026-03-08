// Nutrition Analysis - Gráficos y análisis detallado de nutrición
// Connected to real API: dashboard (macros), engagement (insights), nutrition score hook

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Droplets } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../../src/constants/theme';
import { BuildBanner } from '../../../src/components/ui';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useNutritionScore } from '../../../src/hooks';
import { analyticsService, engagementService } from '../../../src/services/api';

const getScoreColor = (score: number) => {
  if (score >= 70) return Colors.success;
  if (score >= 50) return Colors.warning;
  return Colors.error;
};

export default function NutritionAnalysisScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const patientId = user?.id || '';
  const { score: nutScore, todayScore } = useNutritionScore();
  const displayScore = todayScore ?? nutScore.score;

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard', patientId],
    queryFn: () => analyticsService.getDashboard(patientId),
    select: (res) => (res as any)?.data || res,
    enabled: !!patientId,
  });

  const { data: insightsRaw } = useQuery({
    queryKey: ['engageInsights'],
    queryFn: () => engagementService.getInsights(),
    select: (res: any) => {
      const raw = res?.data?.insights || res?.insights || [];
      return raw.slice(0, 5);
    },
  });
  const insights: Array<{ id: string; titulo: string; mensaje: string; prioridad: string }> = insightsRaw || [];

  const plan = dashData?.plan_nutricional || dashData?.analisis_completo?.plan_nutricional;
  const estado = dashData?.analisis_completo?.estado_actual;
  const agua = dashData?.agua_recomendada_litros;

  const macroTargets = plan ? {
    calories: { target: Math.round(plan.calorias || plan.kcal || 0), unit: 'kcal' },
    protein: { target: Math.round(plan.proteina || plan.p || 0), unit: 'g' },
    fat: { target: Math.round(plan.grasa || plan.g || 0), unit: 'g' },
    carbs: { target: Math.round(plan.carbohidratos || plan.ch || 0), unit: 'g' },
  } : null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const insightTypeColor = (p: string) => {
    switch (p) { case 'positive': return Colors.success; case 'warning': return Colors.warning; default: return Colors.primary; }
  };
  const insightIcon = (p: string) => {
    switch (p) {
      case 'positive': return <TrendingUp size={18} color={Colors.success} />;
      case 'warning': return <Target size={18} color={Colors.warning} />;
      default: return <TrendingDown size={18} color={Colors.primary} />;
    }
  };

  return (
    <View style={styles.container}>
      <BuildBanner />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Análisis Nutricional</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {dashLoading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Nutrition Score from Core TS hook */}
            <View style={styles.avgScoreCard}>
              <Text style={styles.avgScoreLabel}>Nutrition Score</Text>
              <Text style={[styles.avgScoreValue, { color: getScoreColor(displayScore) }]}>
                {displayScore}
              </Text>
              {estado && (
                <Text style={styles.avgScoreSub}>
                  Peso: {estado.peso || '—'} kg | BF: {estado.bf || '—'}%
                </Text>
              )}
            </View>

            {/* Macro Targets from Plan Nutricional */}
            {macroTargets ? (
              <View style={styles.macrosCard}>
                <Text style={styles.sectionTitle}>Plan Nutricional - Objetivos Diarios</Text>
                {Object.entries(macroTargets).map(([key, data]) => {
                  const label = key === 'protein' ? '🥩 Proteína' : key === 'carbs' ? '🍞 Carbohidratos' : key === 'fat' ? '🥑 Grasas' : '🔥 Calorías';
                  return (
                    <View key={key} style={styles.macroRow}>
                      <View style={styles.macroInfo}>
                        <Text style={styles.macroName}>{label}</Text>
                        <Text style={styles.macroValues}>
                          Objetivo: {data.target} {data.unit}
                        </Text>
                      </View>
                      <View style={styles.macroBarBg}>
                        <View style={[styles.macroBarFill, { width: '100%', backgroundColor: Colors.primary }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.macrosCard}>
                <Text style={styles.sectionTitle}>Plan Nutricional</Text>
                <Text style={styles.emptyText}>No hay plan nutricional asignado aún.</Text>
              </View>
            )}

            {/* Water recommendation */}
            {agua != null && agua > 0 && (
              <View style={styles.waterCard}>
                <Droplets size={24} color={Colors.primary} />
                <View style={styles.waterInfo}>
                  <Text style={styles.waterTitle}>Hidratación recomendada</Text>
                  <Text style={styles.waterValue}>{agua.toFixed(1)} litros/día</Text>
                </View>
              </View>
            )}

            {/* Insights from engagement API */}
            {insights.length > 0 && (
              <View style={styles.insightsCard}>
                <Text style={styles.sectionTitle}>Insights</Text>
                {insights.map((insight, idx) => (
                  <View key={insight.id || idx} style={styles.insightItem}>
                    <View style={[styles.insightIcon, { backgroundColor: insightTypeColor(insight.prioridad) + '20' }]}>
                      {insightIcon(insight.prioridad)}
                    </View>
                    <Text style={styles.insightText}>
                      {insight.mensaje || insight.titulo}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Daily tracking placeholder */}
            <View style={styles.trackingCard}>
              <Text style={styles.sectionTitle}>Seguimiento Diario</Text>
              <Text style={styles.emptyText}>
                El registro diario de comidas estará disponible próximamente.
                Mientras tanto, usá el tracker de nutrición desde la pantalla principal.
              </Text>
            </View>
          </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // Avg Score Card
  avgScoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  avgScoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  avgScoreValue: {
    fontSize: 64,
    fontWeight: '700',
  },
  avgScoreSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  // Macros Card
  macrosCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  macroRow: {
    marginBottom: Spacing.md,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  macroName: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  macroValues: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  macroBarBg: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  macroBarFill: {
    height: 8,
    borderRadius: 4,
  },
  // Insights Card
  insightsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
  },
  waterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  waterInfo: {
    flex: 1,
  },
  waterTitle: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  waterValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  trackingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
});
