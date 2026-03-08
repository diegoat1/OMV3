// Patient Training - Toggle Simplificado/Automático con registro y score

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, X, Check, ChevronRight, Zap, Edit3 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';
import { useTrainingScore } from '../../src/hooks';
import { TrainingSessionType } from '../../src/models';
import { trainingService } from '../../src/services/api';

type TrainingMode = 'simplified' | 'automatic';

const sessionTypeConfig: Record<TrainingSessionType, { label: string; emoji: string; color: string }> = {
  strength: { label: 'Fuerza', emoji: '🏋️', color: Colors.secondary },
  calisthenics: { label: 'Calistenia', emoji: '💪', color: Colors.primary },
  running: { label: 'Running', emoji: '🏃', color: Colors.success },
  mobility: { label: 'Movilidad', emoji: '🧘', color: Colors.warning },
  other: { label: 'Otro', emoji: '⚡', color: Colors.gray500 },
};

// Fallback routine when no API plan is available
const fallbackRoutine = {
  name: 'Sin plan asignado',
  exercises: [] as { id: string; name: string; sets: number; reps: number; weight: number; lastWeight: number; progression: string }[],
};

const getScoreColor = (score: number) => {
  if (score >= 70) return Colors.success;
  if (score >= 50) return Colors.warning;
  return Colors.error;
};

export default function TrainingScreen() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<TrainingMode>('simplified');
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedType, setSelectedType] = useState<TrainingSessionType>('strength');
  const [duration, setDuration] = useState('45');
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState('');
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  const { score: trainingScore, logs: coreLogs } = useTrainingScore(4);

  // Today's session from API (for automatic mode)
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['todaySession'],
    queryFn: () => trainingService.getTodaySession(),
    select: (res: any) => res?.data?.today || res?.today || null,
  });

  const todayRoutine = todayData
    ? {
        name: todayData.plan_nombre || 'Plan activo',
        exercises: (todayData.ejercicios || []).map((e: any, i: number) => ({
          id: String(e.id || i),
          name: e.nombre || e.name || `Ejercicio ${i + 1}`,
          sets: e.series || e.sets || 3,
          reps: e.repeticiones || e.reps || 10,
          weight: e.peso || e.weight || 0,
          lastWeight: e.peso_anterior || 0,
          progression: e.progresion || '+1 rep',
        })),
      }
    : fallbackRoutine;

  const registerMutation = useMutation({
    mutationFn: (data: any) => trainingService.registerSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaySession'] });
      queryClient.invalidateQueries({ queryKey: ['sessionHistory'] });
    },
  });

  // Mapeo de tipos
  const typeMapping: Record<string, TrainingSessionType> = {
    strength: 'strength', cardio: 'running', hiit: 'calisthenics', flexibility: 'mobility', sports: 'other', other: 'other',
  };

  // Calendario semanal
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const log = coreLogs.find(l => l.date === dateStr);
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('es', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: i === 0,
        log: log ? { ...log, sessionType: typeMapping[log.type] || 'other' } : undefined,
      });
    }
    return days;
  };

  const days = getLast7Days();
  const activeDays = days.filter(d => d.log).length;

  // Balance de tipos
  const typeBalance = () => {
    const counts: Record<string, number> = {};
    coreLogs.forEach(l => {
      const t = typeMapping[l.type] || 'other';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  };

  const balance = typeBalance();
  const dominantType = Object.entries(balance).sort((a, b) => b[1] - a[1])[0];
  const needsBalance = dominantType && dominantType[1] > coreLogs.length * 0.6;

  // Progresión automática
  const toggleExercise = (id: string) => {
    setCompletedExercises(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSaveLog = () => {
    registerMutation.mutate({
      plan_id: todayData?.plan_id || null,
      ejercicios_completados: completedExercises.map(id => {
        const ex = todayRoutine.exercises.find((e: any) => e.id === id);
        return ex ? { nombre: ex.name, series: ex.sets, reps: ex.reps, peso: ex.weight } : { id };
      }),
      duracion_minutos: parseInt(duration) || 45,
      notas: notes || `${selectedType} - RPE ${rpe}`,
    });
    setShowLogModal(false);
    setDuration('45');
    setRpe(7);
    setNotes('');
  };

  return (
    <View style={styles.container}>
      <BuildBanner />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Entrenamiento</Text>
          <Pressable style={styles.addButton} onPress={() => setShowLogModal(true)}>
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Registrar</Text>
          </Pressable>
        </View>

        {/* Toggle Simplificado/Automático */}
        <View style={styles.toggleContainer}>
          <Pressable 
            style={[styles.toggleOption, mode === 'simplified' && styles.toggleOptionActive]}
            onPress={() => setMode('simplified')}
          >
            <Edit3 size={18} color={mode === 'simplified' ? Colors.white : Colors.gray500} />
            <Text style={[styles.toggleText, mode === 'simplified' && styles.toggleTextActive]}>
              Simplificado
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.toggleOption, mode === 'automatic' && styles.toggleOptionActive]}
            onPress={() => setMode('automatic')}
          >
            <Zap size={18} color={mode === 'automatic' ? Colors.white : Colors.gray500} />
            <Text style={[styles.toggleText, mode === 'automatic' && styles.toggleTextActive]}>
              Automático
            </Text>
          </Pressable>
        </View>

        {/* Calendario Semanal (ambos modos) */}
        <View style={styles.calendarCard}>
          <Text style={styles.sectionTitle}>Esta semana</Text>
          <View style={styles.calendarRow}>
            {days.map((day) => (
              <View key={day.date} style={[styles.calendarDay, day.isToday && styles.calendarDayToday]}>
                <Text style={[styles.calendarDayName, day.isToday && styles.calendarTextToday]}>
                  {day.dayName}
                </Text>
                <Text style={[styles.calendarDayNum, day.isToday && styles.calendarTextToday]}>
                  {day.dayNum}
                </Text>
                {day.log ? (
                  <View style={[styles.calendarDot, { backgroundColor: sessionTypeConfig[day.log.sessionType].color }]}>
                    <Text style={styles.calendarDotEmoji}>{sessionTypeConfig[day.log.sessionType].emoji}</Text>
                  </View>
                ) : (
                  <View style={styles.calendarDotEmpty} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* MODO SIMPLIFICADO */}
        {mode === 'simplified' && (
          <>
            {/* Score de Entrenamiento */}
            <View style={styles.scoreCard}>
              {coreLogs.length > 0 ? (
                <>
                  <View style={styles.scoreHeader}>
                    <Text style={styles.scoreLabel}>Score de Entrenamiento</Text>
                    <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(trainingScore.score) + '20' }]}>
                      <Text style={[styles.scoreBadgeText, { color: getScoreColor(trainingScore.score) }]}>
                        {trainingScore.category}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.scoreMain}>
                    <Text style={[styles.scoreValue, { color: getScoreColor(trainingScore.score) }]}>
                      {trainingScore.score}
                    </Text>
                    <Text style={styles.scoreMax}>/100</Text>
                  </View>
                  
                  {/* Consistencia */}
                  <View style={styles.consistencyRow}>
                    <Text style={styles.consistencyLabel}>Consistencia semanal:</Text>
                    <Text style={styles.consistencyValue}>{activeDays}/7 dias activos</Text>
                  </View>

                  {/* Balance */}
                  {needsBalance && (
                    <View style={styles.balanceWarning}>
                      <Text style={styles.balanceWarningText}>
                        Solo haces {sessionTypeConfig[dominantType[0] as TrainingSessionType]?.label || 'un tipo'}. 
                        Prueba agregar {dominantType[0] === 'strength' ? 'movilidad o cardio' : 'fuerza'}.
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, color: Colors.textSecondary, textAlign: 'center' }}>
                    En desarrollo - Registra tu primera sesion para ver tu score
                  </Text>
                </View>
              )}
            </View>

            {/* Recomendación Accionable */}
            {coreLogs.length > 0 && (
              <View style={styles.recommendationCard}>
                <Text style={styles.recommendationTitle}>Recomendacion</Text>
                <Text style={styles.recommendationText}>
                  {trainingScore.recommendations[0] || 'Manten tu consistencia actual'}
                </Text>
                <Pressable style={styles.recommendationButton}>
                  <Text style={styles.recommendationButtonText}>Ver plan sugerido</Text>
                  <ChevronRight size={16} color={Colors.primary} />
                </Pressable>
              </View>
            )}

            {/* Registros Recientes */}
            <View style={styles.logsSection}>
              <Text style={styles.sectionTitle}>Registros recientes</Text>
              {coreLogs.length === 0 ? (
                <View style={styles.scoreCard}>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 8 }}>
                    Sin registros aun - Usa el boton "Registrar" para comenzar
                  </Text>
                </View>
              ) : coreLogs.slice(-5).reverse().map((log, idx) => {
                const mappedType = typeMapping[log.type] || 'other';
                const config = sessionTypeConfig[mappedType];
                return (
                  <View key={idx} style={styles.logItem}>
                    <View style={[styles.logIcon, { backgroundColor: config.color + '20' }]}>
                      <Text style={styles.logEmoji}>{config.emoji}</Text>
                    </View>
                    <View style={styles.logInfo}>
                      <Text style={styles.logType}>{config.label}</Text>
                      <Text style={styles.logDetails}>{log.duration_minutes} min • RPE {log.rpe}</Text>
                    </View>
                    <Text style={styles.logDate}>
                      {new Date(log.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* MODO AUTOMÁTICO */}
        {mode === 'automatic' && (
          <>
            {/* Rutina de Hoy */}
            <View style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <View>
                  <Text style={styles.routineTitle}>🎯 Rutina de hoy</Text>
                  <Text style={styles.routineName}>{todayRoutine.name}</Text>
                </View>
                <View style={styles.routineProgress}>
                  <Text style={styles.routineProgressText}>
                    {completedExercises.length}/{todayRoutine.exercises.length}
                  </Text>
                </View>
              </View>

              <View style={styles.exercisesList}>
                {todayRoutine.exercises.map((exercise: { id: string; name: string; sets: number; reps: number; weight: number; lastWeight: number; progression: string }, index: number) => {
                  const isCompleted = completedExercises.includes(exercise.id);
                  return (
                    <Pressable 
                      key={exercise.id} 
                      style={[styles.exerciseItem, isCompleted && styles.exerciseItemCompleted]}
                      onPress={() => toggleExercise(exercise.id)}
                    >
                      <View style={[styles.exerciseCheck, isCompleted && styles.exerciseCheckActive]}>
                        {isCompleted && <Check size={14} color={Colors.white} />}
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={[styles.exerciseName, isCompleted && styles.exerciseNameCompleted]}>
                          {exercise.name}
                        </Text>
                        <Text style={styles.exerciseDetails}>
                          {exercise.sets} series × {exercise.reps} {exercise.name === 'Plancha' ? 'seg' : 'reps'}
                        </Text>
                      </View>
                      {isCompleted && (
                        <View style={styles.progressionBadge}>
                          <Text style={styles.progressionText}>{exercise.progression}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {completedExercises.length === todayRoutine.exercises.length && (
                <View style={styles.completedBanner}>
                  <Text style={styles.completedText}>🎉 ¡Rutina completada! Mañana subiremos la intensidad.</Text>
                </View>
              )}
            </View>

            {/* Progresión */}
            <View style={styles.progressionCard}>
              <Text style={styles.sectionTitle}>📈 Tu progresión</Text>
              <Text style={styles.progressionInfo}>
                Al completar ejercicios, el sistema sugiere automáticamente:
              </Text>
              <View style={styles.progressionRules}>
                <View style={styles.progressionRule}>
                  <Text style={styles.progressionRuleEmoji}>💪</Text>
                  <Text style={styles.progressionRuleText}>Calistenia: +1 rep por serie</Text>
                </View>
                <View style={styles.progressionRule}>
                  <Text style={styles.progressionRuleEmoji}>🏋️</Text>
                  <Text style={styles.progressionRuleText}>Fuerza: +2.5% de carga</Text>
                </View>
                <View style={styles.progressionRule}>
                  <Text style={styles.progressionRuleEmoji}>⏱️</Text>
                  <Text style={styles.progressionRuleText}>Isométricos: +5 segundos</Text>
                </View>
              </View>
            </View>

            {/* Score simplificado */}
            <View style={styles.miniScoreCard}>
              <View style={styles.miniScoreLeft}>
                <Text style={styles.miniScoreLabel}>Score semanal</Text>
                <Text style={[styles.miniScoreValue, { color: getScoreColor(trainingScore.score) }]}>
                  {trainingScore.score}/100
                </Text>
              </View>
              <View style={styles.miniScoreRight}>
                <Text style={styles.miniScoreLabel}>Días activos</Text>
                <Text style={styles.miniScoreValue}>{activeDays}/7</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal Registrar Sesión */}
      <Modal visible={showLogModal} transparent animationType="slide" onRequestClose={() => setShowLogModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar sesión</Text>
              <Pressable onPress={() => setShowLogModal(false)}>
                <X size={24} color={Colors.gray500} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Tipo */}
              <Text style={styles.inputLabel}>Tipo de sesión</Text>
              <View style={styles.typeSelector}>
                {Object.entries(sessionTypeConfig).map(([type, config]) => (
                  <Pressable
                    key={type}
                    style={[styles.typeOption, selectedType === type && { backgroundColor: config.color + '20', borderColor: config.color }]}
                    onPress={() => setSelectedType(type as TrainingSessionType)}
                  >
                    <Text style={styles.typeEmoji}>{config.emoji}</Text>
                    <Text style={[styles.typeLabel, selectedType === type && { color: config.color }]}>{config.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Duración */}
              <Text style={styles.inputLabel}>Duración (minutos)</Text>
              <TextInput
                style={styles.textInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="45"
              />

              {/* RPE */}
              <Text style={styles.inputLabel}>RPE (1-10)</Text>
              <View style={styles.rpeSelector}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <Pressable
                    key={value}
                    style={[styles.rpeOption, rpe === value && styles.rpeOptionSelected]}
                    onPress={() => setRpe(value)}
                  >
                    <Text style={[styles.rpeText, rpe === value && styles.rpeTextSelected]}>{value}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Notas */}
              <Text style={styles.inputLabel}>Notas (opcional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Cómo te sentiste, ejercicios destacados..."
                multiline
                numberOfLines={3}
              />

              {/* Guardar */}
              <Pressable style={styles.saveButton} onPress={handleSaveLog}>
                <Text style={styles.saveButtonText}>Guardar sesión</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, gap: Spacing.xs },
  addButtonText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
  // Toggle
  toggleContainer: { flexDirection: 'row', backgroundColor: Colors.gray100, borderRadius: BorderRadius.lg, padding: 4, marginBottom: Spacing.lg },
  toggleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, gap: Spacing.xs },
  toggleOptionActive: { backgroundColor: Colors.primary },
  toggleText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray500 },
  toggleTextActive: { color: Colors.white },
  // Calendar
  calendarCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calendarDay: { alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.md, flex: 1 },
  calendarDayToday: { backgroundColor: Colors.primary + '10' },
  calendarDayName: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 2 },
  calendarDayNum: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.xs },
  calendarTextToday: { color: Colors.primary },
  calendarDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  calendarDotEmoji: { fontSize: 12 },
  calendarDotEmpty: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.gray100 },
  // Score Card
  scoreCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  scoreLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  scoreBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  scoreBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },
  scoreMain: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.md },
  scoreValue: { fontSize: 48, fontWeight: '700' },
  scoreMax: { fontSize: FontSize.lg, color: Colors.textSecondary },
  consistencyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  consistencyLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  consistencyValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  balanceWarning: { backgroundColor: Colors.warning + '10', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.md },
  balanceWarningText: { fontSize: FontSize.sm, color: Colors.warning },
  // Recommendation
  recommendationCard: { backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  recommendationTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primary, marginBottom: Spacing.xs },
  recommendationText: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20, marginBottom: Spacing.md },
  recommendationButton: { flexDirection: 'row', alignItems: 'center' },
  recommendationButtonText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  // Logs
  logsSection: { marginBottom: Spacing.lg },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  logIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  logEmoji: { fontSize: 18 },
  logInfo: { flex: 1 },
  logType: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  logDetails: { fontSize: FontSize.xs, color: Colors.textSecondary },
  logDate: { fontSize: FontSize.xs, color: Colors.textSecondary },
  // Routine Card
  routineCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  routineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  routineTitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  routineName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginTop: 2 },
  routineProgress: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  routineProgressText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  exercisesList: { gap: Spacing.sm },
  exerciseItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: BorderRadius.md },
  exerciseItemCompleted: { backgroundColor: Colors.success + '10' },
  exerciseCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.gray300, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  exerciseCheckActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  exerciseNameCompleted: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  exerciseDetails: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  progressionBadge: { backgroundColor: Colors.success + '20', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  progressionText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.success },
  completedBanner: { backgroundColor: Colors.success + '10', borderRadius: BorderRadius.md, padding: Spacing.md, marginTop: Spacing.md },
  completedText: { fontSize: FontSize.sm, color: Colors.success, textAlign: 'center' },
  // Progression Card
  progressionCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  progressionInfo: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  progressionRules: { gap: Spacing.sm },
  progressionRule: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressionRuleEmoji: { fontSize: 18 },
  progressionRuleText: { fontSize: FontSize.sm, color: Colors.text },
  // Mini Score
  miniScoreCard: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  miniScoreLeft: { flex: 1, borderRightWidth: 1, borderRightColor: Colors.gray100, paddingRight: Spacing.md },
  miniScoreRight: { flex: 1, paddingLeft: Spacing.md },
  miniScoreLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 2 },
  miniScoreValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalScroll: { padding: Spacing.lg },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.md },
  // Type Selector
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeOption: { alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.gray200, width: '31%' },
  typeEmoji: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  // Text Input
  textInput: { backgroundColor: Colors.gray50, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  // RPE Selector
  rpeSelector: { flexDirection: 'row', justifyContent: 'space-between' },
  rpeOption: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, justifyContent: 'center', alignItems: 'center' },
  rpeOptionSelected: { backgroundColor: Colors.primary },
  rpeText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray500 },
  rpeTextSelected: { color: Colors.white },
  // Save Button
  saveButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  saveButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
});
