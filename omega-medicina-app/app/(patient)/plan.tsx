// Patient Plan Screen - Nutrition, Training, and Mobility

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { 
  Apple, 
  Dumbbell, 
  Activity, 
  ChevronRight, 
  Clock, 
  Flame,
  Play,
  CheckCircle,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card, Button } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { nutritionService, trainingService } from '../../src/services/api';

type TabType = 'nutrition' | 'training' | 'mobility';

export default function PlanScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('nutrition');
  const patientId = user?.id || '';

  const { data: nutritionPlan } = useQuery({
    queryKey: ['nutritionPlans', patientId],
    queryFn: () => nutritionService.getPlans(patientId),
    select: (res) => {
      const plans = res.data;
      if (!plans || !Array.isArray(plans) || plans.length === 0) return null;
      // Return the most recent plan
      return plans[0];
    },
    enabled: !!patientId,
  });

  const { data: trainingPlan } = useQuery({
    queryKey: ['trainingPlans', patientId],
    queryFn: () => trainingService.getPlans(patientId),
    select: (res) => {
      const plans = res.data;
      if (!plans || !Array.isArray(plans) || plans.length === 0) return null;
      return plans[0];
    },
    enabled: !!patientId,
  });

  const { data: mobilityRoutines } = useQuery({
    queryKey: ['freePrograms'],
    queryFn: () => trainingService.getPrograms(),
    select: (res) => res.data,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi Plan</Text>
        <Text style={styles.subtitle}>Nutrición, entrenamiento y movilidad</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TabButton
          icon={<Apple size={20} />}
          label="Nutrición"
          active={activeTab === 'nutrition'}
          onPress={() => setActiveTab('nutrition')}
          color={Colors.success}
        />
        <TabButton
          icon={<Dumbbell size={20} />}
          label="Entreno"
          active={activeTab === 'training'}
          onPress={() => setActiveTab('training')}
          color={Colors.primary}
        />
        <TabButton
          icon={<Activity size={20} />}
          label="Movilidad"
          active={activeTab === 'mobility'}
          onPress={() => setActiveTab('mobility')}
          color={Colors.warning}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'nutrition' && nutritionPlan && (
          <NutritionTab plan={nutritionPlan} />
        )}
        {activeTab === 'training' && trainingPlan && (
          <TrainingTab plan={trainingPlan} />
        )}
        {activeTab === 'mobility' && mobilityRoutines && (
          <MobilityTab routines={mobilityRoutines} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TabButton({ icon, label, active, onPress, color }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      style={[
        styles.tabButton,
        active && { backgroundColor: `${color}15`, borderColor: color },
      ]}
      onPress={onPress}
    >
      <View style={{ opacity: active ? 1 : 0.5 }}>
        {React.cloneElement(icon as React.ReactElement<any>, { color: active ? color : Colors.gray500 })}
      </View>
      <Text style={[styles.tabLabel, active ? { color } : null]}>{label}</Text>
    </Pressable>
  );
}

function NutritionTab({ plan }: { plan: any }) {
  return (
    <View>
      {/* Daily Summary */}
      <Card style={styles.summaryCard} variant="elevated">
        <Text style={styles.cardTitle}>Objetivo del día</Text>
        <View style={styles.macrosRow}>
          <MacroItem label="Calorías" value={plan.dailyCalories} unit="kcal" color={Colors.error} />
          <MacroItem label="Proteína" value={plan.macros.protein} unit="g" color={Colors.primary} />
          <MacroItem label="Carbos" value={plan.macros.carbs} unit="g" color={Colors.warning} />
          <MacroItem label="Grasas" value={plan.macros.fat} unit="g" color={Colors.success} />
        </View>
      </Card>

      {/* Meals */}
      <Text style={styles.sectionTitle}>Comidas sugeridas</Text>
      {plan.meals.map((meal: any) => (
        <Card key={meal.id} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealTime}>{meal.time} • {meal.targetCalories} kcal</Text>
            </View>
            <ChevronRight size={20} color={Colors.gray400} />
          </View>
          <View style={styles.suggestionsContainer}>
            {meal.suggestions.map((suggestion: string, index: number) => (
              <View key={index} style={styles.suggestionItem}>
                <View style={styles.suggestionDot} />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        </Card>
      ))}

      {/* Blocks System Placeholder */}
      <Card style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>🧱 Sistema de Bloques</Text>
        <Text style={styles.placeholderText}>
          Próximamente: Sistema simplificado de bloques nutricionales (P/G/C) 
          y modo "E" (energía = 100 kcal).
        </Text>
      </Card>
    </View>
  );
}

function MacroItem({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={styles.macroItem}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroUnit}>{unit}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function TrainingTab({ plan }: { plan: any }) {
  const today = new Date().getDay();
  const todaySession = plan.sessions.find((s: any) => s.dayOfWeek === today);

  return (
    <View>
      {/* Today's Session */}
      {todaySession ? (
        <Card style={styles.todayCard} variant="elevated">
          <View style={styles.todayHeader}>
            <View style={[styles.todayBadge, { backgroundColor: `${Colors.success}15` }]}>
              <Text style={styles.todayBadgeText}>HOY</Text>
            </View>
            <Text style={styles.todayTitle}>{todaySession.name}</Text>
          </View>
          <View style={styles.todayMeta}>
            <View style={styles.metaItem}>
              <Clock size={16} color={Colors.gray500} />
              <Text style={styles.metaText}>{todaySession.duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Dumbbell size={16} color={Colors.gray500} />
              <Text style={styles.metaText}>{todaySession.exercises.length} ejercicios</Text>
            </View>
          </View>
          <Button
            title="Comenzar entrenamiento"
            icon={<Play size={18} color={Colors.white} />}
            fullWidth
            style={{ marginTop: Spacing.lg }}
            onPress={() => {}}
          />
        </Card>
      ) : (
        <Card style={styles.restCard}>
          <Text style={styles.restEmoji}>😴</Text>
          <Text style={styles.restTitle}>Día de descanso</Text>
          <Text style={styles.restText}>Aprovecha para hacer movilidad o descansar</Text>
        </Card>
      )}

      {/* Weekly Plan */}
      <Text style={styles.sectionTitle}>Plan semanal</Text>
      {plan.sessions.map((session: any) => (
        <Card key={session.id} style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionDay}>
              <Text style={styles.sessionDayText}>{getDayName(session.dayOfWeek)}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionName}>{session.name}</Text>
              <Text style={styles.sessionMeta}>
                {session.duration} min • {session.exercises.length} ejercicios
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.gray400} />
          </View>
        </Card>
      ))}

      {/* Exercise Philosophy */}
      <Card style={styles.philosophyCard}>
        <Text style={styles.philosophyTitle}>💡 Filosofía de entrenamiento</Text>
        <Text style={styles.philosophyText}>
          3 ejercicios principales por sesión. Enfoque en progresión de cargas y técnica. 
          Registra tus pesos y RPE para optimizar tu progreso.
        </Text>
      </Card>
    </View>
  );
}

function MobilityTab({ routines }: { routines: any[] }) {
  return (
    <View>
      <Text style={styles.introText}>
        5-10 minutos diarios de movilidad mejoran tu rendimiento y previenen lesiones.
      </Text>

      {routines.map((routine) => (
        <Card key={routine.id} style={styles.routineCard}>
          <View style={styles.routineHeader}>
            <View style={[styles.routineIcon, { backgroundColor: `${Colors.warning}15` }]}>
              <Activity size={24} color={Colors.warning} />
            </View>
            <View style={styles.routineInfo}>
              <Text style={styles.routineName}>{routine.name}</Text>
              <View style={styles.routineMeta}>
                <Clock size={14} color={Colors.gray500} />
                <Text style={styles.routineMetaText}>{routine.duration} min</Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{routine.difficulty}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.targetAreas}>
            {routine.targetAreas.map((area: string, index: number) => (
              <View key={index} style={styles.targetBadge}>
                <Text style={styles.targetText}>{area}</Text>
              </View>
            ))}
          </View>

          <View style={styles.exercisesList}>
            {routine.exercises.slice(0, 3).map((exercise: any, index: number) => (
              <View key={index} style={styles.exerciseItem}>
                <Text style={styles.exerciseNumber}>{index + 1}</Text>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDuration}>{exercise.duration}s</Text>
              </View>
            ))}
            {routine.exercises.length > 3 && (
              <Text style={styles.moreExercises}>
                +{routine.exercises.length - 3} más
              </Text>
            )}
          </View>

          <Button
            title="Iniciar rutina"
            variant="outline"
            icon={<Play size={16} color={Colors.primary} />}
            fullWidth
            style={{ marginTop: Spacing.md }}
            onPress={() => {}}
          />
        </Card>
      ))}

      {/* Video Placeholder */}
      <Card style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>🎥 Videos guiados</Text>
        <Text style={styles.placeholderText}>
          Próximamente: Videos y enlaces a rutinas guiadas de movilidad.
        </Text>
      </Card>
    </View>
  );
}

function getDayName(dayOfWeek: number): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[dayOfWeek];
}

import React from 'react';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.gray500,
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.surface,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray500,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  macroUnit: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
  },
  macroLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  mealCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  mealName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  mealTime: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  suggestionsContainer: {
    gap: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: Spacing.sm,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },
  placeholderCard: {
    padding: Spacing.lg,
    backgroundColor: `${Colors.secondary}08`,
    marginTop: Spacing.lg,
  },
  placeholderTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },
  todayCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  todayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  todayBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
  todayTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  todayMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  restCard: {
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  restEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  restTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  restText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 4,
  },
  sessionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDay: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sessionDayText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray600,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  sessionMeta: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  philosophyCard: {
    padding: Spacing.lg,
    backgroundColor: `${Colors.primary}08`,
    marginTop: Spacing.lg,
  },
  philosophyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  philosophyText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },
  introText: {
    fontSize: FontSize.md,
    color: Colors.gray600,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  routineCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  routineIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  routineMetaText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    textTransform: 'capitalize',
  },
  targetAreas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  targetBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: BorderRadius.sm,
  },
  targetText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    textTransform: 'capitalize',
  },
  exercisesList: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  exerciseNumber: {
    width: 20,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.gray400,
  },
  exerciseName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  exerciseDuration: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  moreExercises: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
