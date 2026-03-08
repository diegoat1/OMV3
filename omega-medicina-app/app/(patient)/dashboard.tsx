// Patient Dashboard - Main home screen with health score, tasks, and insights
// Conectado con Core TS para Health Score

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Lightbulb, Calendar } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card, Button, HealthScoreCard, TaskItem, ScoreCard } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { analyticsService, engagementService } from '../../src/services/api';
import { DailyTask, Insight, Reminder } from '../../src/models';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useHealthScore } from '../../src/hooks';

export default function PatientDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const patientId = user?.id || '';

  // Hook del Core TS para Health Score combinado
  const { score: coreHealthScore, semaphoreColor, nutritionScore, trainingScore } = useHealthScore();

  // Breakdown para el ScoreCard del Core TS
  const healthBreakdown = [
    { label: 'Datos completos', value: coreHealthScore.components.data_completeness, maxValue: 30 },
    { label: 'Nutrición', value: coreHealthScore.components.nutrition, maxValue: 25 },
    { label: 'Entrenamiento', value: coreHealthScore.components.training, maxValue: 25 },
    { label: 'Métricas', value: coreHealthScore.components.metrics_in_range, maxValue: 20 },
  ];

  // Real API: dashboard data (composition, scores, plan, objective)
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', patientId],
    queryFn: () => analyticsService.getDashboard(patientId),
    select: (res) => res.data,
    enabled: !!patientId,
  });

  // Tasks from engagement API
  const { data: tasksData } = useQuery({
    queryKey: ['engageTasks'],
    queryFn: () => engagementService.getTasks('pending'),
    select: (res: any) => {
      const raw = res?.data?.tasks || res?.tasks || [];
      return raw.map((t: any): DailyTask => ({
        id: String(t.id),
        patientId: patientId,
        title: t.titulo || t.title || '',
        description: t.descripcion,
        type: 'custom' as any,
        completed: t.estado === 'completed',
        scheduledFor: t.fecha_limite || new Date().toISOString(),
        recurrence: 'once' as any,
        order: 0,
      }));
    },
  });
  const tasks: DailyTask[] = tasksData || [];

  // Reminders from engagement API
  const { data: remindersData } = useQuery({
    queryKey: ['engageReminders'],
    queryFn: () => engagementService.getReminders('pending'),
    select: (res: any) => {
      const raw = res?.data?.reminders || res?.reminders || [];
      return raw.slice(0, 3).map((r: any): Reminder => ({
        id: String(r.id),
        patientId: patientId,
        title: r.titulo || '',
        description: r.descripcion,
        category: (r.tipo || 'custom') as any,
        dueDate: r.fecha_vencimiento || new Date().toISOString(),
        frequency: 'once' as any,
        status: r.completado ? 'completed' : 'pending',
        createdBy: patientId,
        createdAt: r.fecha_creacion || new Date().toISOString(),
      }));
    },
  });
  const reminders: Reminder[] = remindersData || [];

  // Insights from engagement API
  const { data: insightsData } = useQuery({
    queryKey: ['engageInsights'],
    queryFn: () => engagementService.getInsights(),
    select: (res: any) => {
      const raw = res?.data?.insights || res?.insights || [];
      const typeMap: Record<string, 'info' | 'warning' | 'success' | 'action'> = {
        positive: 'success', warning: 'warning', info: 'info', tip: 'action',
      };
      return raw.map((i: any): Insight => ({
        id: i.id,
        type: typeMap[i.prioridad] || 'info',
        title: i.titulo || '',
        message: i.mensaje || '',
        priority: 0,
        createdAt: new Date().toISOString(),
      }));
    },
  });
  const insights: Insight[] = insightsData || [];

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      if (completed) {
        return engagementService.updateTask(Number(taskId), { estado: 'completed' } as any);
      }
      return engagementService.updateTask(Number(taskId), { estado: 'pending' } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engageTasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  const handleToggleTask = (taskId: string, completed: boolean) => {
    toggleTaskMutation.mutate({ taskId, completed });
  };

  const completedTasks = tasks?.filter(t => t.completed).length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hola, {((user as any)?.nombre_apellido || 'Usuario').split(' ')[0]} 👋
            </Text>
            <Text style={styles.date}>
              {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
            </Text>
          </View>
        </View>

        {/* Health Score Card - Core TS con breakdown colapsable */}
        <ScoreCard
          title="Health Score"
          score={coreHealthScore.score}
          category={coreHealthScore.category}
          semaphoreColor={semaphoreColor}
          breakdown={healthBreakdown}
          trend={{
            improving: coreHealthScore.status === 'optimal' || coreHealthScore.status === 'on_track',
          }}
          recommendations={coreHealthScore.recommendations}
          onPress={() => router.push('/(patient)/health')}
        />

        {/* Mini scores de Nutrición y Entrenamiento */}
        <View style={styles.miniScoresRow}>
          <View style={styles.miniScoreCard}>
            <Text style={styles.miniScoreEmoji}>🥗</Text>
            <Text style={styles.miniScoreValue}>{nutritionScore}</Text>
            <Text style={styles.miniScoreLabel}>Nutrición</Text>
          </View>
          <View style={styles.miniScoreCard}>
            <Text style={styles.miniScoreEmoji}>🏋️</Text>
            <Text style={styles.miniScoreValue}>{trainingScore}</Text>
            <Text style={styles.miniScoreLabel}>Entrenamiento</Text>
          </View>
        </View>

        {/* Daily Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tareas de hoy</Text>
            <Text style={styles.taskProgress}>
              {completedTasks}/{totalTasks} completadas
            </Text>
          </View>

          {tasks?.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
            />
          ))}
        </View>

        {/* Upcoming Controls */}
        {reminders && reminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Próximos controles</Text>
              <Button
                title="Ver todos"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(patient)/reminders')}
              />
            </View>

            <Card style={styles.remindersCard}>
              {reminders.map((reminder, index) => (
                <View key={reminder.id}>
                  <View style={styles.reminderItem}>
                    <View style={[styles.reminderDot, { backgroundColor: getCategoryColor(reminder.category) }]} />
                    <View style={styles.reminderContent}>
                      <Text style={styles.reminderTitle}>{reminder.title}</Text>
                      <Text style={styles.reminderDate}>
                        {format(new Date(reminder.dueDate), "d 'de' MMM", { locale: es })}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={Colors.gray400} />
                  </View>
                  {index < reminders.length - 1 && <View style={styles.reminderDivider} />}
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Insights */}
        {insights && insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recomendaciones</Text>
            </View>

            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.quickActions}>
            <QuickActionButton
              emoji="⚖️"
              label="Registrar peso"
              onPress={() => router.push('/(patient)/health')}
            />
            <QuickActionButton
              emoji="📏"
              label="Medidas"
              onPress={() => router.push('/(patient)/health')}
            />
            <QuickActionButton
              emoji="🏋️"
              label="Entrenamiento"
              onPress={() => router.push('/(patient)/plan')}
            />
            <QuickActionButton
              emoji="🥗"
              label="Nutrición"
              onPress={() => router.push('/(patient)/plan')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const bgColor = {
    info: Colors.primary,
    warning: Colors.warning,
    success: Colors.success,
    action: Colors.secondary,
  }[insight.type];

  return (
    <Card style={StyleSheet.flatten([styles.insightCard, { borderLeftColor: bgColor }])}>
      <View style={styles.insightHeader}>
        <Lightbulb size={18} color={bgColor} />
        <Text style={[styles.insightTitle, { color: bgColor }]}>{insight.title}</Text>
      </View>
      <Text style={styles.insightMessage}>{insight.message}</Text>
      {insight.actionLabel && (
        <Button
          title={insight.actionLabel}
          variant="ghost"
          size="sm"
          style={styles.insightButton}
          onPress={() => {}}
        />
      )}
    </Card>
  );
}

function QuickActionButton({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Card style={styles.quickActionCard} onPress={onPress}>
      <Text style={styles.quickActionEmoji}>{emoji}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Card>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    screening: '#8b5cf6',
    laboratory: '#3b82f6',
    anthropometric: '#10b981',
    consultation: '#f59e0b',
    vaccination: '#ec4899',
  };
  return colors[category] || Colors.gray500;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  date: {
    fontSize: FontSize.md,
    color: Colors.gray500,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  taskProgress: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  remindersCard: {
    padding: Spacing.md,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  reminderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  reminderDate: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  reminderDivider: {
    height: 1,
    backgroundColor: Colors.gray100,
    marginLeft: 20,
  },
  insightCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  insightTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  insightMessage: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },
  insightButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  quickActionCard: {
    width: '47%',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  quickActionEmoji: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  miniScoresRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  miniScoreCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  miniScoreEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  miniScoreValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  miniScoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
    marginTop: 2,
  },
});
