/**
 * ScoreCard - Componente para mostrar scores con semáforo y breakdown colapsable
 * Usa el core TS para cálculos
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../../constants/theme';

export interface ScoreBreakdownItem {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

export interface ScoreCardProps {
  title: string;
  score: number;
  maxScore?: number;
  category?: string;
  semaphoreColor: 'green' | 'yellow' | 'red';
  breakdown?: ScoreBreakdownItem[];
  trend?: {
    improving: boolean;
    percentage?: number;
  };
  recommendations?: string[];
  onPress?: () => void;
}

const SEMAPHORE_COLORS = {
  green: Colors.success,
  yellow: Colors.warning,
  red: Colors.error,
};

export function ScoreCard({
  title,
  score,
  maxScore = 100,
  category,
  semaphoreColor,
  breakdown,
  trend,
  recommendations,
  onPress,
}: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Pressable 
      style={[styles.container, onPress && styles.pressable]} 
      onPress={onPress}
    >
      {/* Header con Score y Semáforo */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trend.improving ? Colors.successLight + '30' : Colors.errorLight + '30' }]}>
              {trend.improving ? (
                <TrendingUp size={14} color={Colors.success} />
              ) : (
                <TrendingDown size={14} color={Colors.error} />
              )}
              {trend.percentage !== undefined && (
                <Text style={[styles.trendText, { color: trend.improving ? Colors.success : Colors.error }]}>
                  {trend.improving ? '+' : ''}{trend.percentage}%
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.scoreRow}>
          {/* Semáforo */}
          <View style={[styles.semaphore, { backgroundColor: SEMAPHORE_COLORS[semaphoreColor] }]} />
          
          {/* Score */}
          <Text style={[styles.scoreValue, { color: SEMAPHORE_COLORS[semaphoreColor] }]}>
            {score}
          </Text>
          <Text style={styles.scoreMax}>/{maxScore}</Text>
          
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: SEMAPHORE_COLORS[semaphoreColor] + '20' }]}>
              <Text style={[styles.categoryText, { color: SEMAPHORE_COLORS[semaphoreColor] }]}>
                {getCategoryLabel(category)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Breakdown Toggle */}
      {breakdown && breakdown.length > 0 && (
        <Pressable style={styles.breakdownToggle} onPress={toggleExpanded}>
          <Text style={styles.breakdownToggleText}>
            {expanded ? 'Ocultar detalles' : 'Ver detalles'}
          </Text>
          {expanded ? (
            <ChevronUp size={16} color={Colors.gray500} />
          ) : (
            <ChevronDown size={16} color={Colors.gray500} />
          )}
        </Pressable>
      )}

      {/* Breakdown Expandido */}
      {expanded && breakdown && (
        <View style={styles.breakdownContainer}>
          {breakdown.map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownLabelRow}>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <Text style={styles.breakdownValue}>
                  {item.value}/{item.maxValue}
                </Text>
              </View>
              <View style={styles.breakdownBarBg}>
                <View 
                  style={[
                    styles.breakdownBarFill, 
                    { 
                      width: `${(item.value / item.maxValue) * 100}%`,
                      backgroundColor: item.color || getBarColor(item.value / item.maxValue),
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recomendaciones (si está expandido) */}
      {expanded && recommendations && recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recomendaciones</Text>
          {recommendations.slice(0, 3).map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    excellent: 'Excelente',
    good: 'Bueno',
    average: 'Regular',
    needs_work: 'Mejorable',
    poor: 'Bajo',
  };
  return labels[category] || category;
}

function getBarColor(ratio: number): string {
  if (ratio >= 0.7) return Colors.success;
  if (ratio >= 0.4) return Colors.warning;
  return Colors.error;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  pressable: {
    // Efecto visual al presionar
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.gray600,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  semaphore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
  },
  scoreMax: {
    fontSize: FontSize.lg,
    color: Colors.gray400,
  },
  categoryBadge: {
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  breakdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    marginTop: Spacing.sm,
    gap: 4,
  },
  breakdownToggleText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  breakdownContainer: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  breakdownItem: {
    gap: Spacing.xs,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },
  breakdownValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray700,
  },
  breakdownBarBg: {
    height: 6,
    backgroundColor: Colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationsContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  recommendationsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  recommendationBullet: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  recommendationText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },
});
