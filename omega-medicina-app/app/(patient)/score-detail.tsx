// Score Detail - Breakdown por categoría del puntaje corporal

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Info } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';
import { useAuth } from '../../src/contexts/AuthContext';
import { analyticsService } from '../../src/services/api';
import { ScoreCategory, ScoreColor, ScoreCategoryBreakdown } from '../../src/models';

// Helper para color de categoría
const getCategoryColor = (color: ScoreColor) => {
  switch (color) {
    case 'green': return Colors.success;
    case 'yellow': return Colors.warning;
    case 'red': return Colors.error;
  }
};

// Componente para item de breakdown con barra
interface BreakdownItemProps {
  item: ScoreCategoryBreakdown;
  color: string;
}

function BreakdownItem({ item, color }: BreakdownItemProps) {
  const percentage = (item.value / item.maxValue) * 100;
  
  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownHeader}>
        <Text style={styles.breakdownLabel}>{item.label}</Text>
        <Text style={styles.breakdownValue}>
          {item.value}/{item.maxValue}
        </Text>
      </View>
      <View style={styles.breakdownBarBg}>
        <View 
          style={[
            styles.breakdownBarFill, 
            { width: `${percentage}%` as any, backgroundColor: color }
          ]} 
        />
      </View>
      {item.description && (
        <Text style={styles.breakdownDescription}>{item.description}</Text>
      )}
    </View>
  );
}

export default function ScoreDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || '';
  const params = useLocalSearchParams<{ categoryId: string }>();

  // Real API: scores from analytics
  const { data: scores } = useQuery({
    queryKey: ['scores', userId],
    queryFn: () => analyticsService.getScores(userId),
    select: (res) => res.data,
    enabled: !!userId,
  });

  // Build categories from real scores
  const categories: ScoreCategory[] = scores ? [
    {
      id: 'bf',
      name: 'Grasa Corporal',
      emoji: '\ud83d\udd25',
      score: scores.score_bf,
      color: (scores.score_bf >= 70 ? 'green' : scores.score_bf >= 40 ? 'yellow' : 'red') as ScoreColor,
      improvement: scores.categoria_bf,
      completeness: 100,
      adherence: Math.round(scores.score_bf),
      breakdown: [
        { label: 'Porcentaje grasa', value: scores.score_bf, maxValue: 100, description: scores.categoria_bf },
      ],
    },
    {
      id: 'ffmi',
      name: 'Masa Muscular',
      emoji: '\ud83d\udcaa',
      score: scores.score_ffmi,
      color: (scores.score_ffmi >= 70 ? 'green' : scores.score_ffmi >= 40 ? 'yellow' : 'red') as ScoreColor,
      improvement: scores.categoria_ffmi,
      completeness: 100,
      adherence: Math.round(scores.score_ffmi),
      breakdown: [
        { label: 'FFMI', value: scores.score_ffmi, maxValue: 100, description: scores.categoria_ffmi },
      ],
    },
  ] : [];

  const category = categories.find(c => c.id === params.categoryId);
  const displayCategory = category || categories[0] || {
    id: 'loading', name: 'Cargando...', emoji: '\u23f3', score: 0,
    color: 'yellow' as ScoreColor, improvement: '', completeness: 0, adherence: 0, breakdown: [],
  };
  const color = getCategoryColor(displayCategory.color);

  return (
    <View style={styles.container}>
      <BuildBanner />
      
      {/* Header con botón atrás */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Detalle de Categoría</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Score Card Principal */}
        <View style={[styles.scoreCard, { borderLeftColor: color }]}>
          <View style={styles.scoreCardHeader}>
            <Text style={styles.categoryEmoji}>{displayCategory.emoji}</Text>
            <View style={styles.scoreCardInfo}>
              <Text style={styles.categoryName}>{displayCategory.name}</Text>
              <Text style={[styles.scoreValue, { color }]}>
                {displayCategory.score}/100
              </Text>
            </View>
          </View>
          
          {/* Barra de progreso principal */}
          <View style={styles.mainProgressBg}>
            <View 
              style={[
                styles.mainProgressFill, 
                { width: `${displayCategory.score}%` as any, backgroundColor: color }
              ]} 
            />
          </View>
          
          {/* Métricas de completitud y adherencia */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Completitud</Text>
              <Text style={styles.metricValue}>{displayCategory.completeness ?? 0}%</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Adherencia</Text>
              <Text style={styles.metricValue}>{displayCategory.adherence ?? 0}%</Text>
            </View>
          </View>
        </View>

        {/* Cómo mejorar */}
        <View style={styles.improvementCard}>
          <View style={styles.improvementHeader}>
            <Info size={18} color={Colors.primary} />
            <Text style={styles.improvementTitle}>Cómo mejorar este score</Text>
          </View>
          <Text style={styles.improvementText}>{displayCategory.improvement}</Text>
        </View>

        {/* Breakdown detallado */}
        <Text style={styles.sectionTitle}>Desglose del Puntaje</Text>
        <View style={styles.breakdownCard}>
          {(displayCategory.breakdown || []).map((item, index) => (
            <BreakdownItem 
              key={index} 
              item={item} 
              color={color}
            />
          ))}
        </View>

        {/* Fórmula de cálculo */}
        <View style={styles.formulaCard}>
          <Text style={styles.formulaTitle}>¿Cómo se calcula?</Text>
          <Text style={styles.formulaText}>
            Score = Completitud de datos ({Math.round((displayCategory.completeness ?? 0) * 0.4)}%) + 
            Adherencia ({Math.round((displayCategory.adherence ?? 0) * 0.4)}%) + 
            Métricas en rango ({Math.round((displayCategory.score - (displayCategory.completeness ?? 0) * 0.4 - (displayCategory.adherence ?? 0) * 0.4))}%)
          </Text>
          <View style={styles.formulaLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>≥70: Óptimo</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>40-69: Mejorable</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.legendText}>&lt;40: Atención</Text>
            </View>
          </View>
        </View>
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
  // Score Card
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  categoryEmoji: {
    fontSize: 48,
    marginRight: Spacing.lg,
  },
  scoreCardInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  scoreValue: {
    fontSize: FontSize.display,
    fontWeight: '700',
  },
  mainProgressBg: {
    height: 12,
    backgroundColor: Colors.gray100,
    borderRadius: 6,
    marginBottom: Spacing.lg,
  },
  mainProgressFill: {
    height: 12,
    borderRadius: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.gray200,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  // Improvement Card
  improvementCard: {
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  improvementTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  improvementText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  // Section Title
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  // Breakdown Card
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownItem: {
    marginBottom: Spacing.lg,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  breakdownValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  breakdownBarBg: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  breakdownBarFill: {
    height: 8,
    borderRadius: 4,
  },
  breakdownDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  // Formula Card
  formulaCard: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  formulaTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  formulaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  formulaLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});
