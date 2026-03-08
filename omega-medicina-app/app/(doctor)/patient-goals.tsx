// Doctor - Definir objetivo fisico del paciente + Roadmap de fases

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Target, ChevronDown, ChevronUp, Save, Zap, Map, Info } from 'lucide-react-native';
import { useScale } from '../../src/hooks/useScale';
import { userService } from '../../src/services/api';

// ─── Helper ────────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined, dec = 1) {
  if (v == null || isNaN(Number(v))) return '—';
  return Number(v).toFixed(dec);
}

function daysAgo(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

function ageColor(days: number | null): string {
  if (days == null) return '#64748b';
  if (days < 15) return '#16a34a';
  if (days <= 30) return '#f59e0b';
  return '#ef4444';
}

function ageLabel(days: number | null): string {
  if (days == null) return '';
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  return `hace ${days} dias`;
}

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function PatientGoalsScreen() {
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

  // ─── Goal form state ──────────────────────────────────────────────────
  const [pesoObj, setPesoObj] = useState('');
  const [bfObj, setBfObj] = useState('');
  const [ffmiObj, setFfmiObj] = useState('');
  const [abdomenObj, setAbdomenObj] = useState('');
  const [cinturaObj, setCinturaObj] = useState('');
  const [caderaObj, setCaderaObj] = useState('');
  const [notas, setNotas] = useState('');
  const [goalsExpanded, setGoalsExpanded] = useState(true);
  const [roadmapExpanded, setRoadmapExpanded] = useState(true);
  const [roadmapShowAll, setRoadmapShowAll] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────
  const { data: measurements, isLoading: loadingMeas } = useQuery({
    queryKey: ['measurements', patientId],
    queryFn: () => userService.getMeasurements(patientId, 1),
    select: (res: any) => {
      const raw = res?.data?.measurements ?? res?.measurements ?? [];
      return raw[0] || null;
    },
    enabled: !!patientId,
  });

  const { data: autoGoals } = useQuery({
    queryKey: ['goals-auto', patientId],
    queryFn: () => userService.getAutoGoals(patientId),
    select: (res: any) => res?.data || null,
    enabled: !!patientId,
  });

  const { data: currentGoal } = useQuery({
    queryKey: ['goals', patientId],
    queryFn: () => userService.getGoals(patientId),
    select: (res: any) => res?.data?.goal || null,
    enabled: !!patientId,
  });

  // Roadmap: progressive phases
  const { data: roadmap, isLoading: loadingRoadmap } = useQuery({
    queryKey: ['goals-roadmap', patientId],
    queryFn: () => userService.getGoalsRoadmap(patientId),
    select: (res: any) => res?.data || null,
    enabled: !!patientId,
  });

  // Pre-populate form from current goal, or suggest from last measurement
  useEffect(() => {
    if (currentGoal && !pesoObj && !bfObj) {
      setPesoObj(currentGoal.goal_peso ? String(currentGoal.goal_peso) : '');
      setBfObj(currentGoal.goal_bf ? String(currentGoal.goal_bf) : '');
      setFfmiObj(currentGoal.goal_ffmi ? String(currentGoal.goal_ffmi) : '');
      setAbdomenObj(currentGoal.goal_abdomen ? String(currentGoal.goal_abdomen) : '');
      setCinturaObj(currentGoal.goal_cintura ? String(currentGoal.goal_cintura) : '');
      setCaderaObj(currentGoal.goal_cadera ? String(currentGoal.goal_cadera) : '');
      setNotas(currentGoal.notas || '');
    } else if (!currentGoal && measurements && !pesoObj && !bfObj) {
      const og = autoGoals?.objetivos_geneticos;
      const curBf = Number(measurements.bf_percent) || 0;
      const curFfmi = Number(measurements.ffmi) || 0;
      const curPeso = Number(measurements.peso) || 0;
      const curAbd = Number(measurements.circ_abdomen) || 0;
      const curCin = Number(measurements.circ_cintura) || 0;

      if (og) {
        const targetBf = og.bf_esencial ? ((curBf + Number(og.bf_esencial)) / 2) : Math.max(curBf - 3, 5);
        const targetFfmi = og.ffmi_limite ? ((curFfmi + Number(og.ffmi_limite)) / 2) : curFfmi + 1;
        const targetPeso = og.peso_objetivo ? ((curPeso + Number(og.peso_objetivo)) / 2) : curPeso;
        setBfObj(targetBf.toFixed(1));
        setFfmiObj(targetFfmi.toFixed(1));
        if (targetPeso) setPesoObj(targetPeso.toFixed(1));
      } else {
        if (curBf) setBfObj(Math.max(curBf - 3, 5).toFixed(1));
        if (curFfmi) setFfmiObj((curFfmi + 1).toFixed(1));
      }
      if (curAbd) setAbdomenObj((curAbd - 3).toFixed(1));
      if (curCin) setCinturaObj((curCin - 2).toFixed(1));
      setSuggestedGoals(true);
    }
  }, [currentGoal, measurements, autoGoals]);

  // Auto-fill from genetic limits
  const autoFill = useCallback(() => {
    if (!autoGoals) return;
    const og = autoGoals.objetivos_geneticos;
    setPesoObj(og?.peso_objetivo ? String(og.peso_objetivo) : '');
    setBfObj(og?.bf_esencial ? String(og.bf_esencial) : '');
    setFfmiObj(og?.ffmi_limite ? String(og.ffmi_limite) : '');
  }, [autoGoals]);

  // Load a roadmap phase into the form
  const usePhase = useCallback((fase: any) => {
    setPesoObj(fase.peso_objetivo ? String(fase.peso_objetivo) : '');
    setBfObj(fase.bf_objetivo ? String(fase.bf_objetivo) : '');
    setFfmiObj(fase.ffmi_objetivo ? String(fase.ffmi_objetivo) : '');
    if (fase.medida_abdomen) setAbdomenObj(String(fase.medida_abdomen));
    if (fase.medida_cintura_cadera) {
      setCinturaObj(String(fase.medida_cintura_cadera.cintura || ''));
      setCaderaObj(String(fase.medida_cintura_cadera.cadera || ''));
    }
    setGoalsExpanded(true);
  }, []);

  // Save goal mutation
  const saveGoalMut = useMutation({
    mutationFn: () =>
      userService.saveGoal(patientId, {
        peso_objetivo: pesoObj ? parseFloat(pesoObj) : undefined,
        bf_objetivo: bfObj ? parseFloat(bfObj) : undefined,
        ffmi_objetivo: ffmiObj ? parseFloat(ffmiObj) : undefined,
        circ_abdomen_objetivo: abdomenObj ? parseFloat(abdomenObj) : undefined,
        circ_cintura_objetivo: cinturaObj ? parseFloat(cinturaObj) : undefined,
        circ_cadera_objetivo: caderaObj ? parseFloat(caderaObj) : undefined,
        notas: notas || undefined,
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', patientId] });
      Alert.alert('Objetivo guardado', 'El objetivo fisico fue actualizado correctamente.');
    },
    onError: (e: any) => Alert.alert('Error', e?.message || 'No se pudo guardar el objetivo'),
  });

  // ─── Derived ────────────────────────────────────────────────────────
  const lastMeas = measurements;
  const lastDate = lastMeas?.fecha;
  const days = daysAgo(lastDate);
  const sexo = roadmap?.metadata?.sexo || 'M';

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
    stateGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 * s },
    formRow: { flexDirection: 'row' as const, gap: 8 * s, marginBottom: 8 * s },
    inputWrap: { flex: 1 } as const,
    inputLabel: { fontSize: 11 * s, color: '#94a3b8', marginBottom: 4 * s },
    input: {
      backgroundColor: '#0a0a0a', borderRadius: 10 * s,
      paddingHorizontal: 12 * s, paddingVertical: 9 * s,
      fontSize: 14 * s, color: '#fff', borderWidth: 1, borderColor: '#252525',
    },
    suggestBanner: {
      flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 * s,
      backgroundColor: '#1e3a5f20', borderRadius: 8 * s,
      padding: 10 * s, marginBottom: 12 * s, borderWidth: 1, borderColor: '#1e3a5f40',
    },
    suggestText: { fontSize: 11 * s, color: '#60a5fa', flex: 1 },
    btn: {
      borderRadius: 12 * s, paddingVertical: 12 * s,
      alignItems: 'center' as const, justifyContent: 'center' as const,
      flexDirection: 'row' as const, gap: 8 * s,
    },
    btnPrimary: { backgroundColor: '#8b5cf6' } as const,
    btnDisabled: { opacity: 0.5 } as const,
    btnText: { fontSize: 14 * s, fontWeight: '700' as const, color: '#fff' },
    autoFillBtn: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      gap: 6 * s, marginBottom: 12 * s,
      paddingVertical: 8 * s, paddingHorizontal: 12 * s,
      backgroundColor: '#8b5cf615', borderRadius: 8 * s,
      borderWidth: 1, borderColor: '#8b5cf640', alignSelf: 'flex-start' as const,
    },
    autoFillText: { fontSize: 12 * s, color: '#8b5cf6', fontWeight: '600' as const },
    notasInput: {
      backgroundColor: '#0a0a0a', borderRadius: 10 * s,
      paddingHorizontal: 12 * s, paddingVertical: 9 * s,
      fontSize: 13 * s, color: '#fff', borderWidth: 1, borderColor: '#252525', minHeight: 60 * s,
    },
    noData: { fontSize: 13 * s, color: '#64748b', textAlign: 'center' as const, paddingVertical: 12 * s },
    divider: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 12 * s },
    updateBtn: {
      flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6 * s,
      paddingHorizontal: 12 * s, paddingVertical: 6 * s, borderRadius: 8 * s,
      borderWidth: 1, borderColor: '#8b5cf640', backgroundColor: '#8b5cf615',
      alignSelf: 'flex-start' as const, marginTop: 8 * s,
    },
    updateBtnText: { fontSize: 11 * s, color: '#8b5cf6', fontWeight: '600' as const },
  };

  return (
    <View style={$.container}>
      {/* Header */}
      <View style={$.header}>
        <Pressable style={$.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18 * s} color="#e2e8f0" />
        </Pressable>
        <View>
          <Text style={$.headerTitle}>Objetivos</Text>
          <Text style={$.headerSub}>{patientName}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <ScrollView style={$.container} contentContainerStyle={$.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Estado actual compacto ─────────────────────────────── */}
        <View style={$.card}>
          <View style={$.cardHeader}>
            <View style={$.cardHeaderLeft}>
              <Target size={16 * s} color="#64748b" />
              <Text style={$.cardTitle}>Estado actual</Text>
            </View>
            {lastDate && (
              <Text style={{ fontSize: 11 * s, color: ageColor(days), fontWeight: '600' }}>
                {ageLabel(days)}
              </Text>
            )}
          </View>
          <View style={$.cardBody}>
            {loadingMeas ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : lastMeas ? (
              <>
                <View style={$.stateGrid}>
                  <StatItem label="Peso" value={fmt(lastMeas.peso)} unit="kg" s={s} />
                  <StatItem label="BF%" value={fmt(lastMeas.bf_percent)} unit="%" s={s} />
                  <StatItem label="FFMI" value={fmt(lastMeas.ffmi)} unit="" s={s} />
                  <StatItem label="P. Magro" value={fmt(lastMeas.peso_magro)} unit="kg" s={s} />
                  {sexo === 'M' ? (
                    <StatItem label="Abdomen" value={fmt(lastMeas.circ_abdomen)} unit="cm" s={s} />
                  ) : (
                    <>
                      <StatItem label="Cintura" value={fmt(lastMeas.circ_cintura)} unit="cm" s={s} />
                      <StatItem label="Cadera" value={fmt(lastMeas.circ_cadera)} unit="cm" s={s} />
                    </>
                  )}
                </View>
                <Pressable
                  style={$.updateBtn}
                  onPress={() => router.push({
                    pathname: '/(doctor)/patient-measures',
                    params: { patientId, patientName },
                  } as any)}
                >
                  <Text style={$.updateBtnText}>Actualizar medidas</Text>
                </Pressable>
              </>
            ) : (
              <Text style={$.noData}>Sin mediciones registradas</Text>
            )}
          </View>
        </View>

        {/* ── Roadmap de fases ────────────────────────────────────── */}
        <View style={$.card}>
          <Pressable style={$.cardHeader} onPress={() => setRoadmapExpanded(p => !p)}>
            <View style={$.cardHeaderLeft}>
              <Map size={16 * s} color="#3b82f6" />
              <Text style={$.cardTitle}>Roadmap de fases</Text>
            </View>
            {roadmapExpanded
              ? <ChevronUp size={16 * s} color="#64748b" />
              : <ChevronDown size={16 * s} color="#64748b" />}
          </Pressable>

          {roadmapExpanded && (
            <View style={$.cardBody}>
              {loadingRoadmap ? (
                <ActivityIndicator size="small" color="#8b5cf6" />
              ) : roadmap?.objetivos_parciales?.length ? (
                <>
                  {/* Summary */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 * s }}>
                    <View>
                      <Text style={{ fontSize: 10 * s, color: '#64748b' }}>Tiempo total estimado</Text>
                      <Text style={{ fontSize: 16 * s, fontWeight: '700', color: '#e2e8f0' }}>
                        {roadmap.tiempo_estimado?.meses || '—'} meses
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10 * s, color: '#64748b' }}>Fases</Text>
                      <Text style={{ fontSize: 16 * s, fontWeight: '700', color: '#e2e8f0' }}>
                        {roadmap.objetivos_parciales.length}
                      </Text>
                    </View>
                  </View>

                  {/* Phase cards — show first only, expandable */}
                  {(roadmapShowAll
                    ? roadmap.objetivos_parciales
                    : roadmap.objetivos_parciales.slice(0, 1)
                  ).map((fase: any, i: number) => {
                    const isCorte = fase.tipo === 'definicion';
                    const badgeColor = isCorte ? '#ef4444' : fase.categoria === 'Élite' ? '#f59e0b' : '#16a34a';
                    const badgeBg = isCorte ? '#ef444420' : fase.categoria === 'Élite' ? '#f59e0b20' : '#16a34a20';
                    const badgeLabel = isCorte ? 'Corte' : fase.categoria === 'Élite' ? 'Élite' : 'Volumen';

                    return (
                      <View key={i} style={{
                        backgroundColor: '#0a0a0a', borderRadius: 10 * s,
                        padding: 12 * s, marginBottom: 8 * s,
                        borderWidth: 1, borderColor: '#1a1a1a',
                        borderLeftWidth: 3, borderLeftColor: badgeColor,
                      }}>
                        {/* Badge + description */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 * s, marginBottom: 6 * s }}>
                          <View style={{
                            paddingHorizontal: 8 * s, paddingVertical: 2 * s,
                            borderRadius: 4 * s, backgroundColor: badgeBg,
                          }}>
                            <Text style={{ fontSize: 10 * s, fontWeight: '700', color: badgeColor }}>{badgeLabel}</Text>
                          </View>
                          <Text style={{ fontSize: 12 * s, color: '#e2e8f0', fontWeight: '600', flex: 1 }}>
                            {fase.descripcion}
                          </Text>
                        </View>

                        {/* Metrics row */}
                        <View style={{ flexDirection: 'row', gap: 12 * s, marginBottom: 6 * s }}>
                          <View>
                            <Text style={{ fontSize: 9 * s, color: '#64748b' }}>BF%</Text>
                            <Text style={{ fontSize: 13 * s, fontWeight: '700', color: '#e2e8f0' }}>{fase.bf_objetivo}%</Text>
                          </View>
                          <View>
                            <Text style={{ fontSize: 9 * s, color: '#64748b' }}>FFMI</Text>
                            <Text style={{ fontSize: 13 * s, fontWeight: '700', color: '#e2e8f0' }}>{fase.ffmi_objetivo}</Text>
                          </View>
                          <View>
                            <Text style={{ fontSize: 9 * s, color: '#64748b' }}>Peso</Text>
                            <Text style={{ fontSize: 13 * s, fontWeight: '700', color: '#e2e8f0' }}>{fase.peso_objetivo} kg</Text>
                          </View>
                          {fase.tiempo_meses != null && (
                            <View>
                              <Text style={{ fontSize: 9 * s, color: '#64748b' }}>Tiempo</Text>
                              <Text style={{ fontSize: 13 * s, fontWeight: '700', color: '#e2e8f0' }}>{fase.tiempo_meses}m</Text>
                            </View>
                          )}
                        </View>

                        {/* Cambios */}
                        <View style={{ flexDirection: 'row', gap: 10 * s, marginBottom: 6 * s }}>
                          <Text style={{ fontSize: 10 * s, color: fase.cambio_peso < 0 ? '#16a34a' : '#f59e0b' }}>
                            {fase.cambio_peso > 0 ? '+' : ''}{fase.cambio_peso} kg peso
                          </Text>
                          <Text style={{ fontSize: 10 * s, color: fase.cambio_musculo > 0 ? '#16a34a' : '#ef4444' }}>
                            {fase.cambio_musculo > 0 ? '+' : ''}{fase.cambio_musculo} kg musc.
                          </Text>
                          <Text style={{ fontSize: 10 * s, color: fase.cambio_grasa < 0 ? '#16a34a' : '#ef4444' }}>
                            {fase.cambio_grasa > 0 ? '+' : ''}{fase.cambio_grasa} kg grasa
                          </Text>
                        </View>

                        {/* Circumference */}
                        {fase.medida_abdomen != null && (
                          <Text style={{ fontSize: 10 * s, color: '#94a3b8' }}>
                            Abdomen objetivo: {fase.medida_abdomen} cm
                          </Text>
                        )}
                        {fase.medida_cintura_cadera && (
                          <Text style={{ fontSize: 10 * s, color: '#94a3b8' }}>
                            Cintura: {fase.medida_cintura_cadera.cintura} cm / Cadera: {fase.medida_cintura_cadera.cadera} cm
                          </Text>
                        )}

                        {/* Use as goal button */}
                        <Pressable
                          style={{
                            marginTop: 8 * s, paddingVertical: 6 * s, paddingHorizontal: 10 * s,
                            borderRadius: 6 * s, backgroundColor: '#8b5cf615',
                            borderWidth: 1, borderColor: '#8b5cf640', alignSelf: 'flex-start',
                          }}
                          onPress={() => usePhase(fase)}
                        >
                          <Text style={{ fontSize: 11 * s, color: '#8b5cf6', fontWeight: '600' }}>
                            Usar como objetivo
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}

                  {/* Show all / collapse toggle */}
                  {roadmap.objetivos_parciales.length > 1 && (
                    <Pressable
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: 6 * s, paddingVertical: 10 * s,
                      }}
                      onPress={() => setRoadmapShowAll(p => !p)}
                    >
                      {roadmapShowAll
                        ? <ChevronUp size={14 * s} color="#8b5cf6" />
                        : <ChevronDown size={14 * s} color="#8b5cf6" />}
                      <Text style={{ fontSize: 12 * s, color: '#8b5cf6', fontWeight: '600' }}>
                        {roadmapShowAll
                          ? 'Mostrar solo la primera fase'
                          : `Ver las ${roadmap.objetivos_parciales.length} fases`}
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <Text style={$.noData}>
                  {loadingRoadmap ? '' : 'No se pudo calcular el roadmap. Se necesitan mediciones recientes.'}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── Objetivo fisico (form) ──────────────────────────────── */}
        <View style={$.card}>
          <Pressable style={$.cardHeader} onPress={() => setGoalsExpanded(p => !p)}>
            <View style={$.cardHeaderLeft}>
              <Target size={16 * s} color="#8b5cf6" />
              <Text style={$.cardTitle}>Objetivo fisico</Text>
            </View>
            {goalsExpanded
              ? <ChevronUp size={16 * s} color="#64748b" />
              : <ChevronDown size={16 * s} color="#64748b" />}
          </Pressable>

          {goalsExpanded && (
            <View style={$.cardBody}>
              {suggestedGoals && (
                <View style={$.suggestBanner}>
                  <Info size={14 * s} color="#60a5fa" />
                  <Text style={$.suggestText}>
                    Valores sugeridos desde la ultima medicion. Ajusta segun criterio clinico.
                  </Text>
                </View>
              )}

              {autoGoals && (
                <Pressable style={$.autoFillBtn} onPress={autoFill}>
                  <Zap size={12 * s} color="#8b5cf6" />
                  <Text style={$.autoFillText}>Autocompletar con limites geneticos</Text>
                </Pressable>
              )}

              <View style={$.formRow}>
                <FormInput label="Peso objetivo (kg)" value={pesoObj} onChange={setPesoObj} s={s} styles={$} />
                <FormInput label="BF% objetivo" value={bfObj} onChange={setBfObj} s={s} styles={$} />
              </View>
              <View style={$.formRow}>
                <FormInput label="FFMI objetivo" value={ffmiObj} onChange={setFfmiObj} s={s} styles={$} />
                <View style={$.inputWrap} />
              </View>

              <View style={$.divider} />
              <Text style={[$.inputLabel, { marginBottom: 8 * s }]}>Circunferencias objetivo (cm)</Text>
              <View style={$.formRow}>
                <FormInput label="Abdomen" value={abdomenObj} onChange={setAbdomenObj} s={s} styles={$} />
                <FormInput label="Cintura" value={cinturaObj} onChange={setCinturaObj} s={s} styles={$} />
                <FormInput label="Cadera" value={caderaObj} onChange={setCaderaObj} s={s} styles={$} />
              </View>

              <View style={$.divider} />
              <Text style={$.inputLabel}>Notas para el paciente</Text>
              <TextInput
                style={$.notasInput}
                value={notas}
                onChangeText={setNotas}
                placeholder="Observaciones, indicaciones especiales..."
                placeholderTextColor="#555"
                multiline
              />

              <Pressable
                style={[$.btn, $.btnPrimary, { marginTop: 14 * s }, saveGoalMut.isPending && $.btnDisabled]}
                onPress={() => saveGoalMut.mutate()}
                disabled={saveGoalMut.isPending}
              >
                {saveGoalMut.isPending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Save size={15 * s} color="#fff" />}
                <Text style={$.btnText}>Guardar objetivo</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────
function StatItem({ label, value, unit, s }: { label: string; value: string; unit: string; s: number }) {
  return (
    <View style={{
      flex: 1, minWidth: '30%',
      backgroundColor: '#0a0a0a', borderRadius: 10 * s,
      padding: 10 * s, alignItems: 'center',
    }}>
      <Text style={{ fontSize: 10 * s, color: '#64748b', marginBottom: 2 * s }}>{label}</Text>
      <Text style={{ fontSize: 16 * s, fontWeight: '700', color: '#e2e8f0' }}>
        {value}
        {unit ? <Text style={{ fontSize: 10 * s, color: '#94a3b8' }}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function FormInput({ label, value, onChange, s, styles }: {
  label: string; value: string; onChange: (v: string) => void; s: number; styles: any;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="—"
        placeholderTextColor="#555"
        keyboardType="decimal-pad"
      />
    </View>
  );
}
