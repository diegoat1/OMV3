// Health Score Card - Displays the health score with trend indicator

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { Card } from './Card';
import { Colors, Spacing, FontSize, FontWeight, getScoreColor } from '../../constants/theme';
import { HealthScore } from '../../models';

interface HealthScoreCardProps {
  score: HealthScore;
  onPress?: () => void;
}

export function HealthScoreCard({ score, onPress }: HealthScoreCardProps) {
  const scoreColor = getScoreColor(score.score);
  
  const TrendIcon = score.trend === 'up' 
    ? TrendingUp 
    : score.trend === 'down' 
      ? TrendingDown 
      : Minus;
  
  const trendColor = score.trend === 'up' 
    ? Colors.success 
    : score.trend === 'down' 
      ? Colors.error 
      : Colors.gray400;

  return (
    <Card style={styles.card} onPress={onPress} variant="elevated">
      <View style={styles.header}>
        <Text style={styles.title}>Health Score</Text>
        <View style={[styles.trendBadge, { backgroundColor: `${trendColor}15` }]}>
          <TrendIcon size={14} color={trendColor} />
          <Text style={[styles.trendText, { color: trendColor }]}>
            {score.trendPercentage > 0 ? '+' : ''}{score.trendPercentage}%
          </Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.score, { color: scoreColor }]}>{score.score}</Text>
        <Text style={styles.maxScore}>/100</Text>
      </View>
      
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${score.score}%`, backgroundColor: scoreColor }
          ]} 
        />
      </View>
      
      <View style={styles.breakdown}>
        <BreakdownItem label="Datos" value={score.breakdown.dataCompleteness} max={30} />
        <BreakdownItem label="Tareas" value={score.breakdown.taskAdherence} max={30} />
        <BreakdownItem label="Métricas" value={score.breakdown.metricsInRange} max={25} />
        <BreakdownItem label="Constancia" value={score.breakdown.consistency} max={15} />
      </View>
    </Card>
  );
}

function BreakdownItem({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100;
  
  return (
    <View style={styles.breakdownItem}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <View style={styles.breakdownBar}>
        <View style={[styles.breakdownFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.breakdownValue}>{value}/{max}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    gap: 4,
  },
  trendText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  score: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
  },
  maxScore: {
    fontSize: FontSize.xl,
    color: Colors.gray400,
    marginLeft: Spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: 4,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  breakdown: {
    gap: Spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    width: 60,
  },
  breakdownBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.gray100,
    borderRadius: 2,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  breakdownValue: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
    width: 35,
    textAlign: 'right',
  },
});
