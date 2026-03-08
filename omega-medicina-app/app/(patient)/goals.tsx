// Patient Goals Screen - Ver objetivo físico definido por el nutricionista

import React from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Target, TrendingDown, TrendingUp, Minus, Clock } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useScale } from '../../src/hooks/useScale';
import { userService } from '../../src/services/api';

function fmt(v: number | null | undefined, dec = 1) {
  if (v == null || isNaN(Number(v))) return '—';
  return Number(v).toFixed(dec);
}

function DeltaRow({
  label, current, target, unit, s, styles, higherIsBetter = false,
}: {
  label: string;
  current: number | null | undefined;
  target: number | null | undefined;
  unit: string;
  s: number;
  styles: any;
  higherIsBetter?: boolean;
}) {
  const hasBoth = current != null && target != null;
  const delta = hasBoth ? (Number(target) - Number(current)) : null;
  const isPositive = delta != null && delta > 0;
  const isNeutral = delta != null && Math.abs(delta) < 0.05;

  const deltaColor = isNeutral
    ? '#94a3b8'
    : higherIsBetter
    ? isPositive ? '#16a34a' : '#ef4444'
    : isPositive ? '#ef4444' : '#16a34a';

  const pct = hasBoth && Number(current) > 0
    ? Math.min(100, (Math.min(Number(current), Number(target)) / Math.max(Number(current), Number(target))) * 100)
    : 0;
  const progressColor = isNeutral ? '#94a3b8' : deltaColor;

  return (
    <View style={styles.deltaRow}>
      <View style={styles.deltaHeader}>
        <Text style={styles.deltaLabel}>{label}</Text>
        <View style={styles.deltaVals}>
          <Text style={styles.deltaValCurrent}>{fmt(current)} {unit}</Text>
          {hasBoth && (
            <>
              <View style={styles.deltaArrow}>
                {isNeutral
                  ? <Minus size={12 * s} color="#94a3b8" />
                  : isPositive
                  ? <TrendingUp size={12 * s} color={deltaColor} />
                  : <TrendingDown size={12 * s} color={deltaColor} />}
              </View>
              <Text style={[styles.deltaValTarget, { color: deltaColor }]}>
                {fmt(target)} {unit}
              </Text>
            </>
          )}
        </View>
      </View>
      {hasBoth && (
        <>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: progressColor }]} />
          </View>
          <Text style={[styles.deltaDesc, { color: deltaColor }]}>
            {isNeutral
              ? 'En objetivo'
              : `${delta! > 0 ? '+' : ''}${fmt(delta)} ${unit}`}
          </Text>
        </>
      )}
      {!hasBoth && <Text style={styles.deltaDescMuted}>Sin objetivo definido</Text>}
    </View>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { s } = useScale();
  const userId = user?.id || '';

  // Fetch last measurement
  const { data: lastMeas, isLoading: loadingMeas } = useQuery({
    queryKey: ['measurements', userId],
    queryFn: () => userService.getMeasurements(userId, 1),
    select: (res: any) => {
      const raw = res?.data?.measurements ?? res?.measurements ?? [];
      return raw[0] || null;
    },
    enabled: !!userId,
  });

  // Fetch goal
  const { data: goal, isLoading: loadingGoal } = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => userService.getGoals(userId),
    select: (res: any) => res?.data?.goal || null,
    enabled: !!userId,
  });

  // Fetch auto-goals for time estimate
  const { data: autoGoals } = useQuery({
    queryKey: ['goals-auto', userId],
    queryFn: () => userService.getAutoGoals(userId),
    select: (res: any) => res?.data || null,
    enabled: !!userId,
  });

  const loading = loadingMeas || loadingGoal;

  // Computed deltas
  const peso = lastMeas?.peso;
  const bf = lastMeas?.bf_percent;
  const ffmi = lastMeas?.ffmi;
  const abdomen = lastMeas?.circ_abdomen;
  const cintura = lastMeas?.circ_cintura;
  const cadera = lastMeas?.circ_cadera;

  const goalPeso = goal?.goal_peso;
  const goalBf = goal?.goal_bf;
  const goalFfmi = goal?.goal_ffmi;
  const goalAbdomen = goal?.goal_abdomen;
  const goalCintura = goal?.goal_cintura;
  const goalCadera = goal?.goal_cadera;

  const hasGoal = goal != null && (goalPeso || goalBf || goalFfmi);

  // Estimate weeks from auto-goals
  const semanas = autoGoals?.tiempo_estimado?.semanas;
  const meses = autoGoals?.tiempo_estimado?.meses;

  // Styles
  const $ = {
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    header: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      paddingHorizontal: 16 * s, paddingTop: 52 * s, paddingBottom: 14 * s,
      borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    },
    backBtn: {
      padding: 8 * s, marginRight: 10 * s,
      borderRadius: 8 * s, backgroundColor: '#1a1a1a',
    },
    title: { fontSize: 20 * s, fontWeight: '800' as const, color: '#fff' },
    subtitle: { fontSize: 12 * s, color: '#64748b', marginTop: 1 * s },
    scroll: { padding: 16 * s, paddingBottom: 60 * s } as const,
    card: {
      backgroundColor: '#111', borderRadius: 14 * s,
      borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 14 * s,
      padding: 14 * s,
    },
    cardTitle: { fontSize: 14 * s, fontWeight: '700' as const, color: '#e2e8f0', marginBottom: 12 * s },
    // Time estimate
    timeCard: {
      backgroundColor: '#8b5cf615', borderRadius: 14 * s,
      borderWidth: 1, borderColor: '#8b5cf640',
      padding: 14 * s, marginBottom: 14 * s,
      flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 * s,
    },
    timeText: { fontSize: 14 * s, fontWeight: '700' as const, color: '#8b5cf6' },
    timeSub: { fontSize: 12 * s, color: '#94a3b8' },
    // Notes
    notasCard: {
      backgroundColor: '#111827', borderRadius: 14 * s,
      borderWidth: 1, borderColor: '#1e3a5f',
      padding: 14 * s, marginBottom: 14 * s,
    },
    notasTitle: { fontSize: 13 * s, fontWeight: '700' as const, color: '#93c5fd', marginBottom: 6 * s },
    notasText: { fontSize: 13 * s, color: '#bfdbfe', lineHeight: 20 * s },
    // Delta rows
    deltaRow: { marginBottom: 14 * s },
    deltaHeader: {
      flexDirection: 'row' as const, justifyContent: 'space-between' as const,
      alignItems: 'center' as const, marginBottom: 5 * s,
    },
    deltaLabel: { fontSize: 13 * s, color: '#e2e8f0', fontWeight: '600' as const },
    deltaVals: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 * s },
    deltaValCurrent: { fontSize: 12 * s, color: '#94a3b8' },
    deltaArrow: {} as const,
    deltaValTarget: { fontSize: 13 * s, fontWeight: '700' as const },
    progressBar: {
      height: 5 * s, backgroundColor: '#1a1a1a', borderRadius: 4 * s,
      overflow: 'hidden' as const,
    },
    progressFill: { height: '100%' as const, borderRadius: 4 * s },
    deltaDesc: { fontSize: 11 * s, marginTop: 3 * s, fontWeight: '600' as const },
    deltaDescMuted: { fontSize: 11 * s, color: '#64748b', marginTop: 2 * s },
    noGoal: {
      alignItems: 'center' as const, padding: 30 * s,
    },
    noGoalEmoji: { fontSize: 42 * s, marginBottom: 12 * s },
    noGoalTitle: { fontSize: 16 * s, fontWeight: '700' as const, color: '#e2e8f0', marginBottom: 6 * s },
    noGoalText: { fontSize: 13 * s, color: '#64748b', textAlign: 'center' as const, lineHeight: 20 * s },
  };

  if (loading) {
    return (
      <View style={[$.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <View style={$.container}>
      {/* Header */}
      <View style={$.header}>
        <Pressable style={$.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18 * s} color="#e2e8f0" />
        </Pressable>
        <View>
          <Text style={$.title}>Mi Objetivo</Text>
          <Text style={$.subtitle}>Definido por tu nutricionista</Text>
        </View>
      </View>

      <ScrollView style={$.container} contentContainerStyle={$.scroll}>
        {!hasGoal ? (
          <View style={$.noGoal}>
            <Text style={$.noGoalEmoji}>🎯</Text>
            <Text style={$.noGoalTitle}>Sin objetivo definido</Text>
            <Text style={$.noGoalText}>
              Tu nutricionista aún no definió un objetivo físico.{'\n'}
              Una vez que lo haga, podrás ver tu progreso aquí.
            </Text>
          </View>
        ) : (
          <>
            {/* Time estimate */}
            {semanas != null && (
              <View style={$.timeCard}>
                <Clock size={22 * s} color="#8b5cf6" />
                <View>
                  <Text style={$.timeText}>
                    ~{semanas} semanas estimadas
                  </Text>
                  <Text style={$.timeSub}>
                    {meses != null ? `Aproximadamente ${meses} meses de trabajo` : 'Tiempo estimado para alcanzar el objetivo'}
                  </Text>
                </View>
              </View>
            )}

            {/* Notas del nutricionista */}
            {goal?.notas && (
              <View style={$.notasCard}>
                <Text style={$.notasTitle}>📝 Nota de tu nutricionista</Text>
                <Text style={$.notasText}>{goal.notas}</Text>
              </View>
            )}

            {/* Composición corporal */}
            <View style={$.card}>
              <Text style={$.cardTitle}>Composición corporal</Text>
              <DeltaRow
                label="Peso"
                current={peso}
                target={goalPeso}
                unit="kg"
                s={s}
                styles={$}
                higherIsBetter={false}
              />
              <DeltaRow
                label="Grasa corporal"
                current={bf}
                target={goalBf}
                unit="%"
                s={s}
                styles={$}
                higherIsBetter={false}
              />
              <DeltaRow
                label="FFMI"
                current={ffmi}
                target={goalFfmi}
                unit=""
                s={s}
                styles={$}
                higherIsBetter={true}
              />
            </View>

            {/* Circunferencias */}
            {(goalAbdomen || goalCintura || goalCadera) && (
              <View style={$.card}>
                <Text style={$.cardTitle}>Circunferencias</Text>
                {goalAbdomen && (
                  <DeltaRow
                    label="Abdomen"
                    current={abdomen}
                    target={goalAbdomen}
                    unit="cm"
                    s={s}
                    styles={$}
                    higherIsBetter={false}
                  />
                )}
                {goalCintura && (
                  <DeltaRow
                    label="Cintura"
                    current={cintura}
                    target={goalCintura}
                    unit="cm"
                    s={s}
                    styles={$}
                    higherIsBetter={false}
                  />
                )}
                {goalCadera && (
                  <DeltaRow
                    label="Cadera"
                    current={cadera}
                    target={goalCadera}
                    unit="cm"
                    s={s}
                    styles={$}
                    higherIsBetter={false}
                  />
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
