// Doctor - Patient Analytics: trends, scores, composition analysis, history

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  BarChart3, Activity, Droplets, Info, X,
} from 'lucide-react-native';
import { useScale } from '../../src/hooks/useScale';
import { analyticsService } from '../../src/services/api';

// SVG charts
import Svg, { Path, Line as SvgLine, Text as SvgText, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined, dec = 1) {
  if (v == null || isNaN(Number(v))) return '—';
  return Number(v).toFixed(dec);
}

function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function fmtDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
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
  return `hace ${days} días`;
}

const PERIODS = [
  { label: '1M', months: 1 },
  { label: '2M', months: 2 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1A', months: 12 },
  { label: 'Todo', months: 0 },
] as const;

// ─── Category range definitions for tooltips ──────────────────────────────
type RangeItem = { label: string; min: number; max: number; color: string };

function getIMCRanges(): RangeItem[] {
  return [
    { label: 'Bajo peso', min: 0, max: 18.5, color: '#3b82f6' },
    { label: 'Normal', min: 18.5, max: 25, color: '#16a34a' },
    { label: 'Sobrepeso', min: 25, max: 30, color: '#f59e0b' },
    { label: 'Obesidad', min: 30, max: 35, color: '#ef4444' },
    { label: 'Ob. severa', min: 35, max: 40, color: '#dc2626' },
    { label: 'Ob. mórbida', min: 40, max: 50, color: '#991b1b' },
  ];
}

function getBFRanges(sexo: string): RangeItem[] {
  if (sexo === 'M') {
    return [
      { label: 'Modelo', min: 0, max: 10, color: '#8b5cf6' },
      { label: 'Atlético', min: 10, max: 15, color: '#16a34a' },
      { label: 'Fit', min: 15, max: 20, color: '#22c55e' },
      { label: 'Promedio', min: 20, max: 26, color: '#f59e0b' },
      { label: 'Sobrepeso', min: 26, max: 35, color: '#ef4444' },
    ];
  }
  return [
    { label: 'Modelo', min: 0, max: 18, color: '#8b5cf6' },
    { label: 'Atlético', min: 18, max: 22, color: '#16a34a' },
    { label: 'Fit', min: 22, max: 30, color: '#22c55e' },
    { label: 'Promedio', min: 30, max: 35, color: '#f59e0b' },
    { label: 'Sobrepeso', min: 35, max: 45, color: '#ef4444' },
  ];
}

function getFFMIRanges(sexo: string): RangeItem[] {
  if (sexo === 'M') {
    return [
      { label: 'Pobre', min: 14, max: 18, color: '#ef4444' },
      { label: 'Normal', min: 18, max: 20, color: '#f59e0b' },
      { label: 'Bueno', min: 20, max: 22.5, color: '#22c55e' },
      { label: 'Excelente', min: 22.5, max: 25, color: '#16a34a' },
      { label: 'Superior', min: 25, max: 28, color: '#8b5cf6' },
    ];
  }
  return [
    { label: 'Pobre', min: 10, max: 14.5, color: '#ef4444' },
    { label: 'Normal', min: 14.5, max: 16.5, color: '#f59e0b' },
    { label: 'Bueno', min: 16.5, max: 18.5, color: '#22c55e' },
    { label: 'Excelente', min: 18.5, max: 21, color: '#16a34a' },
    { label: 'Superior', min: 21, max: 24, color: '#8b5cf6' },
  ];
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function PatientAnalyticsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    patientId: string;
    patientName: string;
    patientDni: string;
  }>();
  const { s } = useScale();

  const patientId = params.patientId || '';
  const patientName = params.patientName || 'Paciente';
  const patientDni = params.patientDni || '';

  const [period, setPeriod] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(5);
  const [tooltip, setTooltip] = useState<{ title: string; ranges: RangeItem[]; value: number; unit: string; desc: string } | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  // ─── Queries ────────────────────────────────────────────────────────
  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ['analytics-dashboard', patientDni || patientId],
    queryFn: () => analyticsService.getDashboard(patientId, { dni: patientDni }),
    select: (res: any) => res?.data || null,
    enabled: !!(patientDni || patientId),
  });

  const { data: historyRaw, isLoading: loadingHistory } = useQuery({
    queryKey: ['analytics-history', patientDni || patientId],
    queryFn: () => analyticsService.getBodyCompositionHistory(patientId, 200, { dni: patientDni }),
    select: (res: any) => res?.data?.history ?? [],
    enabled: !!(patientDni || patientId),
  });

  // ─── Derived data ──────────────────────────────────────────────────
  const comp = dashboard?.composicion_corporal;
  const meta = dashboard?.metadata;
  const sexo = meta?.sexo || 'M';
  const lastDate = dashboard?.fecha_actualizacion;
  const days = daysAgo(lastDate);
  const categorias = dashboard?.categorias;
  const dashScores = dashboard?.scores;
  const aguaLitros = dashboard?.agua_recomendada_litros;
  const bodyMatrix = dashboard?.body_matrix;

  // Waist-hip ratio
  const rcc = useMemo(() => {
    if (!comp) return null;
    const cin = comp.circunferencia_cintura;
    const cad = comp.circunferencia_cadera;
    if (!cin || !cad || cad === 0) return null;
    return Math.round((cin / cad) * 100) / 100;
  }, [comp]);

  // Filter history by period
  const history = useMemo(() => {
    if (!historyRaw || !historyRaw.length) return [];
    if (period === 0) return historyRaw;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - period);
    return historyRaw.filter((h: any) => {
      const d = new Date(h.FECHA_REGISTRO);
      return d >= cutoff;
    });
  }, [historyRaw, period]);

  // Chart data (oldest first)
  const chartData = useMemo(() => {
    if (!history.length) return [];
    return [...history].reverse().map((h: any, i: number) => ({
      x: i,
      date: h.FECHA_REGISTRO ? fmtDateShort(h.FECHA_REGISTRO) : '',
      peso: Number(h.PESO) || 0,
      pesoGraso: Number(h.PESO_GRASO) || 0,
      pesoMagro: Number(h.PESO_MAGRO) || 0,
      bf: Number(h.BF_PERCENT) || 0,
      ffmi: Number(h.FFMI) || 0,
      imc: Number(h.IMC) || 0,
    }));
  }, [history]);

  // Trend summary for current period
  const periodTrend = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    return {
      dPeso: Math.round((last.peso - first.peso) * 10) / 10,
      dBf: Math.round((last.bf - first.bf) * 10) / 10,
      dFfmi: Math.round((last.ffmi - first.ffmi) * 10) / 10,
      dImc: Math.round((last.imc - first.imc) * 10) / 10,
      points: chartData.length,
    };
  }, [chartData]);

  // Trend analysis (compare last 3 measurements) for badges
  const trend = useMemo(() => {
    if (!historyRaw || historyRaw.length < 2) return null;
    const last = historyRaw[0];
    const prev = historyRaw[Math.min(2, historyRaw.length - 1)];
    const dPeso = (Number(last.PESO) || 0) - (Number(prev.PESO) || 0);
    const dBf = (Number(last.BF_PERCENT) || 0) - (Number(prev.BF_PERCENT) || 0);
    const dFfmi = (Number(last.FFMI) || 0) - (Number(prev.FFMI) || 0);

    const labels: string[] = [];
    if (dBf < -0.3) labels.push('Perdiendo grasa');
    if (dBf > 0.3) labels.push('Ganando grasa');
    if (dFfmi > 0.2) labels.push('Ganando músculo');
    if (dFfmi < -0.2) labels.push('Perdiendo músculo');
    if (!labels.length) labels.push('Estable');

    return {
      dPeso: Math.round(dPeso * 10) / 10,
      dBf: Math.round(dBf * 10) / 10,
      dFfmi: Math.round(dFfmi * 10) / 10,
      labels,
      positive: dBf <= 0 && dFfmi >= 0,
    };
  }, [historyRaw]);

  // ─── Styles ─────────────────────────────────────────────────────────
  const $ = useMemo(() => ({
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
      backgroundColor: '#111', borderRadius: 16 * s,
      borderWidth: 1, borderColor: '#1e1e1e', marginBottom: 16 * s,
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
    noData: { fontSize: 13 * s, color: '#64748b', textAlign: 'center' as const, paddingVertical: 12 * s },
    periodRow: { flexDirection: 'row' as const, gap: 6 * s, marginBottom: 12 * s, flexWrap: 'wrap' as const },
    periodBtn: {
      paddingHorizontal: 12 * s, paddingVertical: 6 * s, borderRadius: 8 * s,
      borderWidth: 1, borderColor: '#252525', backgroundColor: '#0a0a0a',
    },
    periodBtnActive: { borderColor: '#8b5cf6', backgroundColor: '#8b5cf620' },
    periodText: { fontSize: 11 * s, color: '#94a3b8', fontWeight: '600' as const },
    periodTextActive: { color: '#8b5cf6' },
    trendBadge: {
      flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 * s,
      paddingHorizontal: 8 * s, paddingVertical: 4 * s, borderRadius: 6 * s,
      marginRight: 6 * s, marginBottom: 6 * s,
    },
    trendText: { fontSize: 11 * s, fontWeight: '600' as const },
    updateBtn: {
      flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
      gap: 6 * s, paddingVertical: 10 * s, borderRadius: 10 * s,
      borderWidth: 1, borderColor: '#8b5cf640', backgroundColor: '#8b5cf615',
      marginTop: 12 * s,
    },
    updateBtnText: { fontSize: 13 * s, color: '#8b5cf6', fontWeight: '700' as const },
    trendSummary: {
      flexDirection: 'row' as const, flexWrap: 'wrap' as const,
      gap: 12 * s, marginBottom: 14 * s,
      padding: 12 * s, backgroundColor: '#0a0a0a', borderRadius: 10 * s,
      borderWidth: 1, borderColor: '#1e1e1e',
    },
    chartCard: {
      backgroundColor: '#0a0a0a', borderRadius: 12 * s, padding: 12 * s,
      marginBottom: 12 * s, borderWidth: 1, borderColor: '#1e1e1e',
    },
  }), [s]);

  const loading = loadingDash;

  // Paginated history for table
  const paginatedHistory = useMemo(() => {
    return history.slice(0, historyLimit);
  }, [history, historyLimit]);

  return (
    <View style={$.container}>
      {/* Header */}
      <View style={$.header}>
        <Pressable style={$.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18 * s} color="#e2e8f0" />
        </Pressable>
        <View>
          <Text style={$.headerTitle}>Analíticas</Text>
          <Text style={$.headerSub}>{patientName}</Text>
        </View>
      </View>

      <ScrollView style={$.container} contentContainerStyle={$.scroll}>

        {/* ── Estado actual ──────────────────────────────────────── */}
        <View style={$.card}>
          <View style={$.cardHeader}>
            <View style={$.cardHeaderLeft}>
              <Activity size={16 * s} color="#8b5cf6" />
              <Text style={$.cardTitle}>Estado actual</Text>
            </View>
            {lastDate && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11 * s, color: ageColor(days), fontWeight: '600' }}>
                  {ageLabel(days)}
                </Text>
                <Text style={{ fontSize: 10 * s, color: '#64748b', marginTop: 1 * s }}>
                  {fmtDate(lastDate)}
                </Text>
              </View>
            )}
          </View>
          <View style={$.cardBody}>
            {loading ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : comp ? (
              <>
                {/* Row 1: Peso, IMC, BF% */}
                <View style={$.stateGrid}>
                  <StatItem label="Peso" value={fmt(comp.peso)} unit="kg" s={s} accent="#8b5cf6" />
                  <StatItem label="IMC" value={fmt(comp.imc)} unit="" s={s} accent="#f59e0b"
                    sub={categorias?.imc_categoria?.split(' - ')[0]}
                    onInfo={() => setTooltip({
                      title: 'Índice de Masa Corporal',
                      ranges: getIMCRanges(),
                      value: comp.imc || 0,
                      unit: '',
                      desc: categorias?.imc_categoria || '',
                    })}
                  />
                  <StatItem label="BF%" value={fmt(comp.bf_percent)} unit="%" s={s} accent="#ef4444"
                    sub={categorias?.bf_categoria?.split(':')[0]}
                    onInfo={() => setTooltip({
                      title: '% Grasa Corporal',
                      ranges: getBFRanges(sexo),
                      value: comp.bf_percent || 0,
                      unit: '%',
                      desc: categorias?.bf_categoria || '',
                    })}
                  />
                </View>

                {/* Row 2: FFMI, P.Magro, P.Graso */}
                <View style={[$.stateGrid, { marginTop: 8 * s }]}>
                  <StatItem label="FFMI" value={fmt(comp.ffmi)} unit="" s={s} accent="#16a34a"
                    sub={categorias?.ffmi_categoria?.split(':')[0]}
                    onInfo={() => setTooltip({
                      title: 'Índice Masa Libre de Grasa',
                      ranges: getFFMIRanges(sexo),
                      value: comp.ffmi || 0,
                      unit: '',
                      desc: categorias?.ffmi_categoria || '',
                    })}
                  />
                  <StatItem label="P. Magro" value={fmt(comp.peso_magro)} unit="kg" s={s} accent="#3b82f6" />
                  <StatItem label="P. Graso" value={fmt(comp.peso_graso)} unit="kg" s={s} accent="#f59e0b" />
                </View>

                {/* Row 3: Medidas antropométricas */}
                <View style={{ marginTop: 10 * s, padding: 10 * s, backgroundColor: '#0a0a0a', borderRadius: 10 * s, borderWidth: 1, borderColor: '#1e1e1e' }}>
                  <Text style={{ fontSize: 10 * s, color: '#64748b', marginBottom: 6 * s, fontWeight: '600' }}>MEDIDAS</Text>
                  <View style={$.stateGrid}>
                    <MiniStat label="Abdomen" value={fmt(comp.abdomen)} unit="cm" s={s} />
                    <MiniStat label="Cintura" value={fmt(comp.circunferencia_cintura)} unit="cm" s={s} />
                    <MiniStat label="Cadera" value={fmt(comp.circunferencia_cadera)} unit="cm" s={s} />
                    {rcc != null && (
                      <MiniStat label="Rel. C/C" value={rcc.toFixed(2)} unit="" s={s}
                        color={rcc > (sexo === 'M' ? 0.90 : 0.85) ? '#ef4444' : '#16a34a'} />
                    )}
                  </View>
                </View>

                {/* Abdomen CV risk */}
                {categorias?.abdomen_riesgo && (
                  <View style={{
                    marginTop: 8 * s, padding: 10 * s, backgroundColor: '#0a0a0a', borderRadius: 10 * s,
                    borderWidth: 1, borderColor: categorias.abdomen_riesgo.includes('normal') ? '#16a34a30' : '#ef444430',
                    flexDirection: 'row', alignItems: 'center', gap: 8 * s,
                  }}>
                    <Text style={{ fontSize: 10 * s, color: '#64748b', fontWeight: '700' }}>Abdomen:</Text>
                    <Text style={{
                      fontSize: 10 * s, flex: 1,
                      color: categorias.abdomen_riesgo.includes('normal') ? '#16a34a' : '#ef4444',
                    }}>
                      {categorias.abdomen_riesgo}
                    </Text>
                  </View>
                )}

                {/* Agua recomendada */}
                {aguaLitros != null && aguaLitros > 0 && (
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 8 * s, marginTop: 10 * s, padding: 10 * s,
                    backgroundColor: '#0c1929', borderRadius: 10 * s, borderWidth: 1, borderColor: '#1e3a5f',
                  }}>
                    <Droplets size={16 * s} color="#3b82f6" />
                    <Text style={{ fontSize: 12 * s, color: '#94a3b8' }}>
                      Agua recomendada: <Text style={{ color: '#3b82f6', fontWeight: '700', fontSize: 14 * s }}>{aguaLitros} L/día</Text>
                    </Text>
                  </View>
                )}

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

        {/* ── Tendencias (Charts) ────────────────────────────────── */}
        <View style={$.card}>
          <View style={$.cardHeader}>
            <View style={$.cardHeaderLeft}>
              <BarChart3 size={16 * s} color="#3b82f6" />
              <Text style={$.cardTitle}>Tendencias</Text>
            </View>
          </View>
          <View style={$.cardBody}>
            {/* Period selector */}
            <View style={$.periodRow}>
              {PERIODS.map(p => (
                <Pressable
                  key={p.label}
                  style={[$.periodBtn, period === p.months && $.periodBtnActive]}
                  onPress={() => setPeriod(p.months)}
                >
                  <Text style={[$.periodText, period === p.months && $.periodTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Period trend summary */}
            {periodTrend && (
              <View style={$.trendSummary}>
                <Text style={{ fontSize: 11 * s, color: '#94a3b8', width: '100%' as any, fontWeight: '600', marginBottom: 4 * s }}>
                  Resumen ({PERIODS.find(p => p.months === period)?.label || 'Todo'} — {periodTrend.points} mediciones)
                </Text>
                <DeltaBadge label="Peso" delta={periodTrend.dPeso} unit="kg" s={s} invert={false} />
                <DeltaBadge label="BF%" delta={periodTrend.dBf} unit="%" s={s} invert={true} />
                <DeltaBadge label="FFMI" delta={periodTrend.dFfmi} unit="" s={s} invert={false} />
                <DeltaBadge label="IMC" delta={periodTrend.dImc} unit="" s={s} invert={true} />
              </View>
            )}

            {loadingHistory ? (
              <ActivityIndicator size="small" color="#8b5cf6" />
            ) : chartData.length >= 2 ? (
              <>
                {/* Chart 1: Peso */}
                <View style={$.chartCard}>
                  <Text style={{ fontSize: 12 * s, color: '#e2e8f0', fontWeight: '700', marginBottom: 8 * s }}>Peso (kg)</Text>
                  <SmoothMultiChart
                    data={chartData}
                    lines={[
                      { key: 'peso', color: '#8b5cf6', width: 2.5 },
                      { key: 'pesoGraso', color: '#f59e0b', width: 2 },
                      { key: 'pesoMagro', color: '#3b82f6', width: 1.5, dash: '5,3' },
                    ]}
                    height={150 * s} s={s} showTrend showEndpoints
                  />
                  <View style={{ flexDirection: 'row', gap: 14 * s, marginTop: 8 * s, justifyContent: 'center' }}>
                    <LegendDot color="#8b5cf6" label="Total" s={s} />
                    <LegendDot color="#f59e0b" label="Graso" s={s} />
                    <LegendDot color="#3b82f6" label="Magro" s={s} />
                  </View>
                </View>

                {/* Chart 2: BF% */}
                <View style={$.chartCard}>
                  <Text style={{ fontSize: 12 * s, color: '#e2e8f0', fontWeight: '700', marginBottom: 8 * s }}>% Grasa Corporal</Text>
                  <SmoothChart data={chartData} dataKey="bf" color="#ef4444" height={130 * s} s={s} showTrend showEndpoints />
                </View>

                {/* Chart 3: IMC */}
                <View style={$.chartCard}>
                  <Text style={{ fontSize: 12 * s, color: '#e2e8f0', fontWeight: '700', marginBottom: 8 * s }}>IMC</Text>
                  <SmoothChart data={chartData} dataKey="imc" color="#f59e0b" height={130 * s} s={s} showTrend showEndpoints />
                </View>

                {/* Chart 4: FFMI */}
                <View style={$.chartCard}>
                  <Text style={{ fontSize: 12 * s, color: '#e2e8f0', fontWeight: '700', marginBottom: 8 * s }}>FFMI</Text>
                  <SmoothChart data={chartData} dataKey="ffmi" color="#16a34a" height={130 * s} s={s} showTrend showEndpoints />
                </View>
              </>
            ) : (
              <Text style={$.noData}>Se necesitan al menos 2 mediciones para graficar</Text>
            )}
          </View>
        </View>

        {/* ── Análisis de composición (Scores + Trend) ───────────── */}
        <View style={$.card}>
          <View style={$.cardHeader}>
            <View style={$.cardHeaderLeft}>
              <TrendingUp size={16 * s} color="#16a34a" />
              <Text style={$.cardTitle}>Puntaje Corporal</Text>
            </View>
          </View>
          <View style={$.cardBody}>
            {dashScores ? (
              <>
                <View style={$.stateGrid}>
                  <ScoreCard label="BF Score" value={dashScores.score_bf} cat={dashScores.categoria_bf} s={s} />
                  <ScoreCard label="FFMI Score" value={dashScores.score_ffmi} cat={dashScores.categoria_ffmi} s={s} />
                  <ScoreCard label="Body Score" value={dashScores.score_total}
                    cat={bodyMatrix?.categoria || categorias?.tipo_corporal || ''}
                    s={s} onInfo={() => setShowMatrix(true)} />
                </View>

                {/* Trend badges */}
                {trend && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 * s }}>
                    {trend.labels.map((lbl, i) => {
                      const positive = lbl === 'Perdiendo grasa' || lbl === 'Ganando músculo' || lbl === 'Estable';
                      return (
                        <View key={i} style={[$.trendBadge, {
                          backgroundColor: positive ? '#16a34a20' : lbl === 'Estable' ? '#64748b20' : '#ef444420',
                          borderWidth: 1, borderColor: positive ? '#16a34a40' : lbl === 'Estable' ? '#64748b40' : '#ef444440',
                        }]}>
                          {positive ? <TrendingUp size={12 * s} color="#16a34a" /> :
                            lbl === 'Estable' ? <Minus size={12 * s} color="#64748b" /> :
                            <TrendingDown size={12 * s} color="#ef4444" />}
                          <Text style={[$.trendText, {
                            color: positive ? '#16a34a' : lbl === 'Estable' ? '#94a3b8' : '#ef4444',
                          }]}>{lbl}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {trend && (
                  <View style={{ flexDirection: 'row', gap: 16 * s, marginTop: 10 * s, justifyContent: 'center' }}>
                    <DeltaBadge label="Peso" delta={trend.dPeso} unit="kg" s={s} invert={false} />
                    <DeltaBadge label="BF%" delta={trend.dBf} unit="%" s={s} invert={true} />
                    <DeltaBadge label="FFMI" delta={trend.dFfmi} unit="" s={s} invert={false} />
                  </View>
                )}
              </>
            ) : (
              <Text style={$.noData}>Sin datos de scores</Text>
            )}
          </View>
        </View>

        {/* ── Historial de mediciones (collapsible table) ─────────── */}
        <View style={$.card}>
          <Pressable style={$.cardHeader} onPress={() => { setShowHistory(p => !p); setHistoryLimit(5); }}>
            <View style={$.cardHeaderLeft}>
              <BarChart3 size={16 * s} color="#64748b" />
              <Text style={$.cardTitle}>Historial</Text>
              <Text style={{ fontSize: 11 * s, color: '#64748b' }}>({history.length})</Text>
            </View>
            {showHistory
              ? <ChevronUp size={16 * s} color="#64748b" />
              : <ChevronDown size={16 * s} color="#64748b" />}
          </Pressable>

          {showHistory && (
            <View style={$.cardBody}>
              {loadingHistory ? (
                <ActivityIndicator size="small" color="#8b5cf6" />
              ) : history.length > 0 ? (
                <>
                  {(() => {
                    const screenW = Dimensions.get('window').width;
                    const tableW = screenW - 40 * s; // padding
                    const baseCols = [
                      { h: 'Fecha', flex: 1.6 },
                      { h: 'Peso', flex: 1 },
                      { h: 'BF%', flex: 0.9 },
                      { h: 'FFMI', flex: 0.9 },
                      { h: 'IMC', flex: 0.9 },
                      { h: 'Abd.', flex: 0.9 },
                    ];
                    const fCols = sexo === 'F' ? [{ h: 'Cint.', flex: 0.9 }, { h: 'Cad.', flex: 0.9 }] : [];
                    const extraCols = [
                      { h: '\u0394Peso', flex: 1 },
                      { h: 'Calidad', flex: 1.2 },
                      { h: 'Grasa', flex: 1.2 },
                      { h: 'Músculo', flex: 1.2 },
                    ];
                    const allCols = [...baseCols, ...fCols, ...extraCols];
                    const totalFlex = allCols.reduce((a, c) => a + c.flex, 0);
                    const colWidths = allCols.map(c => Math.floor((c.flex / totalFlex) * tableW));
                    // Ensure minimum readable width — if too narrow, use horizontal scroll
                    const minTotal = allCols.length * 48;
                    const useScroll = tableW < minTotal;
                    const finalWidths = useScroll
                      ? allCols.map(c => Math.max(52 * s, Math.floor((c.flex / totalFlex) * minTotal)))
                      : colWidths;

                    const tableContent = (
                      <View>
                        {/* Table header */}
                        <View style={{
                          flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#252525',
                          paddingBottom: 8 * s, marginBottom: 4 * s,
                        }}>
                          {allCols.map((col, ci) => (
                            <Text key={col.h} style={{
                              width: finalWidths[ci], fontSize: 10 * s, fontWeight: '700',
                              color: '#64748b', textAlign: 'center',
                            }}>{col.h}</Text>
                          ))}
                        </View>
                        {/* Table rows */}
                        {paginatedHistory.map((m: any, i: number) => {
                          const prevPeso = i < history.length - 1 ? Number(history[i + 1]?.PESO || 0) : null;
                          const curPeso = Number(m.PESO || 0);
                          const dp = prevPeso != null ? curPeso - prevPeso : null;
                          const deltaColor = dp == null ? '#64748b' : dp < -0.05 ? '#16a34a' : dp > 0.05 ? '#ef4444' : '#64748b';
                          const qualColor = catColor(m.DELTA_PESO_CAT);
                          const fbmColor = catColor(m.FBM_GAIN_CAT);
                          const lbmColor = catColor(m.LBM_LOSS_CAT);
                          let ci = 0;
                          return (
                            <View key={i} style={{
                              flexDirection: 'row', paddingVertical: 6 * s,
                              backgroundColor: i % 2 === 0 ? '#0a0a0a' : '#111',
                              borderRadius: 4 * s,
                            }}>
                              <Text style={{ width: finalWidths[ci++], fontSize: 10 * s, color: '#94a3b8', textAlign: 'center', fontWeight: '500' }}>
                                {fmtDateShort(m.FECHA_REGISTRO)}
                              </Text>
                              <Text style={{ width: finalWidths[ci++], fontSize: 11 * s, color: '#e2e8f0', textAlign: 'center', fontWeight: '600' }}>{fmt(m.PESO)}</Text>
                              <Text style={{ width: finalWidths[ci++], fontSize: 11 * s, color: '#e2e8f0', textAlign: 'center' }}>{fmt(m.BF_PERCENT)}</Text>
                              <Text style={{ width: finalWidths[ci++], fontSize: 11 * s, color: '#e2e8f0', textAlign: 'center' }}>{fmt(m.FFMI)}</Text>
                              <Text style={{ width: finalWidths[ci++], fontSize: 11 * s, color: '#e2e8f0', textAlign: 'center' }}>{fmt(m.IMC)}</Text>
                              <Text style={{ width: finalWidths[ci++], fontSize: 11 * s, color: '#e2e8f0', textAlign: 'center' }}>{fmt(m.CIRC_ABDOMEN)}</Text>
                              {sexo === 'F' && (
                                <>
                                  <Text style={{ width: finalWidths[ci++], fontSize: 11 * s, color: '#e2e8f0', textAlign: 'center' }}>{fmt(m.CIRC_CINTURA)}</Text>
                                  <Text style={{ width: finalWidths[ci++], fontSize: 11 * s, color: '#e2e8f0', textAlign: 'center' }}>{fmt(m.CIRC_CADERA)}</Text>
                                </>
                              )}
                              <Text style={{ width: finalWidths[ci++], fontSize: 11 * s, color: deltaColor, textAlign: 'center', fontWeight: '600' }}>
                                {dp != null ? `${dp > 0 ? '+' : ''}${dp.toFixed(1)}` : '—'}
                              </Text>
                              <Text style={{ width: finalWidths[ci++], fontSize: 10 * s, color: qualColor, textAlign: 'center' }}>
                                {m.DELTA_PESO_CAT || '—'}
                              </Text>
                              <Text style={{ width: finalWidths[ci++], fontSize: 10 * s, color: fbmColor, textAlign: 'center' }}>
                                {m.FBM_GAIN_CAT || '—'}
                              </Text>
                              <Text style={{ width: finalWidths[ci++], fontSize: 10 * s, color: lbmColor, textAlign: 'center' }}>
                                {m.LBM_LOSS_CAT || '—'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    );

                    return useScroll ? (
                      <ScrollView horizontal showsHorizontalScrollIndicator>
                        {tableContent}
                      </ScrollView>
                    ) : tableContent;
                  })()}

                  {/* Load more */}
                  {historyLimit < history.length && (
                    <Pressable
                      style={{
                        marginTop: 10 * s, paddingVertical: 8 * s, borderRadius: 8 * s,
                        borderWidth: 1, borderColor: '#252525', alignItems: 'center',
                      }}
                      onPress={() => setHistoryLimit(prev => prev + 10)}
                    >
                      <Text style={{ fontSize: 11 * s, color: '#8b5cf6', fontWeight: '600' }}>
                        Ver más ({history.length - historyLimit} restantes)
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <Text style={$.noData}>Sin historial de mediciones</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Tooltip Modal ─────────────────────────────────────────── */}
      <Modal visible={!!tooltip} transparent animationType="fade" onRequestClose={() => setTooltip(null)}>
        <Pressable style={{
          flex: 1, backgroundColor: '#000000cc', justifyContent: 'center', alignItems: 'center', padding: 24 * s,
        }} onPress={() => setTooltip(null)}>
          <Pressable style={{
            backgroundColor: '#111', borderRadius: 16 * s, padding: 20 * s,
            width: '100%', maxWidth: 360 * s, borderWidth: 1, borderColor: '#1e1e1e',
          }} onPress={() => {}}>
            {tooltip && (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 * s }}>
                  <Text style={{ fontSize: 16 * s, fontWeight: '700', color: '#fff' }}>{tooltip.title}</Text>
                  <Pressable onPress={() => setTooltip(null)} style={{ padding: 4 * s }}>
                    <X size={18 * s} color="#64748b" />
                  </Pressable>
                </View>

                {/* Current value */}
                <View style={{ alignItems: 'center', marginBottom: 16 * s }}>
                  <Text style={{ fontSize: 28 * s, fontWeight: '800', color: '#fff' }}>
                    {fmt(tooltip.value)}{tooltip.unit}
                  </Text>
                  <Text style={{ fontSize: 12 * s, color: '#94a3b8', marginTop: 4 * s, textAlign: 'center' }}>
                    {tooltip.desc}
                  </Text>
                </View>

                {/* Category bar */}
                <CategoryBar ranges={tooltip.ranges} value={tooltip.value} s={s} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Body Score Tooltip (with matrix) ─────────────────────── */}
      <Modal visible={showMatrix} transparent animationType="fade" onRequestClose={() => setShowMatrix(false)}>
        <Pressable style={{
          flex: 1, backgroundColor: '#000000cc', justifyContent: 'center', alignItems: 'center', padding: 16 * s,
        }} onPress={() => setShowMatrix(false)}>
          <Pressable style={{
            backgroundColor: '#111', borderRadius: 16 * s, padding: 16 * s,
            width: '100%', maxWidth: 400 * s, borderWidth: 1, borderColor: '#1e1e1e',
          }} onPress={() => {}}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 * s }}>
              <Text style={{ fontSize: 16 * s, fontWeight: '700', color: '#fff' }}>Body Score</Text>
              <Pressable onPress={() => setShowMatrix(false)} style={{ padding: 4 * s }}>
                <X size={18 * s} color="#64748b" />
              </Pressable>
            </View>

            {/* Score + complexión */}
            {dashScores && (
              <View style={{ alignItems: 'center', marginBottom: 14 * s }}>
                <Text style={{ fontSize: 34 * s, fontWeight: '800', color: dashScores.score_total >= 80 ? '#16a34a' : dashScores.score_total >= 50 ? '#f59e0b' : '#ef4444' }}>
                  {dashScores.score_total}
                </Text>
                <Text style={{ fontSize: 14 * s, color: '#e2e8f0', fontWeight: '600', marginTop: 2 * s }}>
                  {bodyMatrix?.categoria || categorias?.tipo_corporal || '—'}
                </Text>
                {categorias?.imc_categoria && (
                  <Text style={{ fontSize: 11 * s, color: '#94a3b8', marginTop: 4 * s, textAlign: 'center' }}>
                    {categorias.imc_categoria}
                  </Text>
                )}
              </View>
            )}

            {/* Separator */}
            <View style={{ height: 1, backgroundColor: '#1e1e1e', marginBottom: 14 * s }} />

            {/* Matrix */}
            <Text style={{ fontSize: 12 * s, color: '#94a3b8', fontWeight: '600', marginBottom: 8 * s }}>
              Mapa de complexión física
            </Text>
            {bodyMatrix ? (
              <BodyMatrixGrid matrix={bodyMatrix} s={s} />
            ) : (
              <Text style={{ fontSize: 12 * s, color: '#64748b', textAlign: 'center', paddingVertical: 16 * s }}>
                Sin datos para mostrar la matriz
              </Text>
            )}

            {/* Current values footer */}
            {bodyMatrix && (
              <View style={{
                flexDirection: 'row', justifyContent: 'center', gap: 20 * s,
                marginTop: 12 * s, paddingTop: 10 * s, borderTopWidth: 1, borderTopColor: '#1e1e1e',
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 10 * s, color: '#64748b' }}>IMC</Text>
                  <Text style={{ fontSize: 15 * s, fontWeight: '700', color: '#fff' }}>{bodyMatrix.imc_value}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 10 * s, color: '#64748b' }}>BF%</Text>
                  <Text style={{ fontSize: 15 * s, fontWeight: '700', color: '#fff' }}>{bodyMatrix.bf_value}%</Text>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Category Bar (tooltip visual) ────────────────────────────────────────
function CategoryBar({ ranges, value, s }: { ranges: RangeItem[]; value: number; s: number }) {
  const totalMin = ranges[0].min;
  const totalMax = ranges[ranges.length - 1].max;
  const totalRange = totalMax - totalMin;
  const clampedVal = Math.max(totalMin, Math.min(totalMax, value));
  const pct = ((clampedVal - totalMin) / totalRange) * 100;

  return (
    <View>
      {/* Bar */}
      <View style={{ flexDirection: 'row', height: 12 * s, borderRadius: 6 * s, overflow: 'hidden', marginBottom: 4 * s }}>
        {ranges.map((r, i) => {
          const w = ((r.max - r.min) / totalRange) * 100;
          return (
            <View key={i} style={{
              width: `${w}%` as any, backgroundColor: r.color, height: '100%',
            }} />
          );
        })}
      </View>

      {/* Marker */}
      <View style={{ position: 'relative', height: 14 * s, marginBottom: 12 * s }}>
        <View style={{
          position: 'absolute', left: `${pct}%` as any,
          marginLeft: -6 * s, top: 0,
          width: 12 * s, height: 12 * s, borderRadius: 6 * s,
          backgroundColor: '#fff', borderWidth: 2, borderColor: '#8b5cf6',
        }} />
      </View>

      {/* Range labels */}
      {ranges.map((r, i) => {
        const isActive = value >= r.min && value < r.max;
        return (
          <View key={i} style={{
            flexDirection: 'row', alignItems: 'center', gap: 8 * s,
            paddingVertical: 5 * s, paddingHorizontal: 8 * s,
            backgroundColor: isActive ? '#8b5cf615' : 'transparent',
            borderRadius: 6 * s, marginBottom: 2 * s,
          }}>
            <View style={{ width: 10 * s, height: 10 * s, borderRadius: 3 * s, backgroundColor: r.color }} />
            <Text style={{ fontSize: 12 * s, color: isActive ? '#fff' : '#94a3b8', fontWeight: isActive ? '700' : '400', flex: 1 }}>
              {r.label}
            </Text>
            <Text style={{ fontSize: 11 * s, color: '#64748b' }}>
              {r.min === 0 ? `< ${r.max}` : r.max >= 50 ? `> ${r.min}` : `${r.min} - ${r.max}`}
            </Text>
            {isActive && <Text style={{ fontSize: 10 * s, color: '#8b5cf6', fontWeight: '700' }}>◀</Text>}
          </View>
        );
      })}
    </View>
  );
}

// ─── Body Composition Matrix Grid ─────────────────────────────────────────
const MATRIX_COLORS: Record<string, string> = {
  'Atlético': '#16a34a',
  'Musculoso': '#22c55e',
  'Delgado muscular': '#3b82f6',
  'Delgado': '#60a5fa',
  'En forma': '#22c55e',
  'Delgadez': '#94a3b8',
  'Bajo peso': '#f59e0b',
  'Con sobrepeso': '#f97316',
  'Obeso': '#ef4444',
  'Obesidad oculta': '#dc2626',
};

function BodyMatrixGrid({ matrix, s }: { matrix: any; s: number }) {
  const grid: string[][] = matrix.matrix;  // 4 rows x 4 cols
  const bfLabels: string[] = matrix.bf_labels;
  const imcLabels: string[] = matrix.imc_labels;
  const activeRow = matrix.imc_row;
  const activeCol = matrix.bf_band;

  const cellW = 72 * s;
  const cellH = 44 * s;
  const labelW = 52 * s;
  const labelH = 18 * s;

  return (
    <View>
      {/* Axis label: BF% */}
      <Text style={{ fontSize: 10 * s, color: '#64748b', textAlign: 'center', marginBottom: 4 * s, fontWeight: '600' }}>
        % Grasa Corporal →
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* BF column headers */}
          <View style={{ flexDirection: 'row', marginLeft: labelW }}>
            {bfLabels.map((lbl, i) => (
              <View key={i} style={{
                width: cellW, height: labelH, justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 9 * s, color: i === activeCol ? '#f59e0b' : '#64748b',
                  fontWeight: i === activeCol ? '700' : '500',
                }}>{lbl}</Text>
              </View>
            ))}
          </View>

          {/* Grid rows */}
          {grid.map((row: string[], ri: number) => (
            <View key={ri} style={{ flexDirection: 'row' }}>
              {/* IMC row label */}
              <View style={{
                width: labelW, height: cellH, justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 9 * s, color: ri === activeRow ? '#f59e0b' : '#64748b',
                  fontWeight: ri === activeRow ? '700' : '500', textAlign: 'center',
                }}>{imcLabels[ri]}</Text>
              </View>

              {/* Cells */}
              {row.map((cat: string, ci: number) => {
                const isActive = ri === activeRow && ci === activeCol;
                const bgColor = isActive ? '#f59e0b' : (MATRIX_COLORS[cat] || '#333');
                return (
                  <View key={ci} style={{
                    width: cellW, height: cellH,
                    backgroundColor: isActive ? bgColor : bgColor + '25',
                    borderWidth: 1, borderColor: isActive ? '#f59e0b' : '#252525',
                    justifyContent: 'center', alignItems: 'center',
                    borderRadius: 4 * s, margin: 1,
                  }}>
                    <Text style={{
                      fontSize: 8.5 * s,
                      color: isActive ? '#000' : '#e2e8f0',
                      fontWeight: isActive ? '800' : '500',
                      textAlign: 'center', paddingHorizontal: 2 * s,
                    }} numberOfLines={2}>{cat}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Axis label: IMC */}
      <Text style={{ fontSize: 10 * s, color: '#64748b', marginTop: 6 * s, fontWeight: '600' }}>
        ↑ IMC
      </Text>
    </View>
  );
}

// ─── Category color helper ────────────────────────────────────────────────
function catColor(cat: string | null | undefined): string {
  if (!cat) return '#64748b';
  const lower = cat.toLowerCase();
  if (lower.includes('ideal') || lower.includes('excelente') || lower.includes('bueno') || lower.includes('optim'))
    return '#16a34a';
  if (lower.includes('aceptable') || lower.includes('normal') || lower.includes('moderado'))
    return '#f59e0b';
  return '#ef4444';
}

// ─── Smooth SVG Chart (Catmull-Rom) ────────────────────────────────────────
const CHART_PAD = { top: 14, right: 16, bottom: 24, left: 44 };

function getPoints(
  data: any[], key: string, w: number, h: number, minY?: number, maxY?: number,
): { x: number; y: number; val: number }[] {
  const vals = data.map(d => Number(d[key]) || 0);
  const mn = minY ?? Math.min(...vals);
  const mx = maxY ?? Math.max(...vals);
  const range = mx - mn || 1;
  const plotW = w - CHART_PAD.left - CHART_PAD.right;
  const plotH = h - CHART_PAD.top - CHART_PAD.bottom;

  return data.map((_, i) => ({
    x: CHART_PAD.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2),
    y: CHART_PAD.top + plotH - ((vals[i] - mn) / range) * plotH,
    val: vals[i],
  }));
}

function catmullRomPath(pts: { x: number; y: number }[], tension = 0.3): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function linearRegression(pts: { x: number; y: number }[]): { x1: number; y1: number; x2: number; y2: number } | null {
  if (pts.length < 2) return null;
  const n = pts.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of pts) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 0.001) return null;
  const m = (n * sxy - sx * sy) / denom;
  const b = (sy - m * sx) / n;
  return { x1: pts[0].x, y1: m * pts[0].x + b, x2: pts[n - 1].x, y2: m * pts[n - 1].x + b };
}

function yTicks(data: any[], key: string, count = 4, minY?: number, maxY?: number) {
  const vals = data.map(d => Number(d[key]) || 0);
  const mn = minY ?? Math.min(...vals);
  const mx = maxY ?? Math.max(...vals);
  const step = (mx - mn) / (count - 1) || 1;
  return Array.from({ length: count }, (_, i) => mn + step * i);
}

function xLabels(data: { date: string }[], count = 5) {
  if (data.length <= count) return data.map((d, i) => ({ i, label: d.date }));
  const step = (data.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, k) => {
    const idx = Math.round(step * k);
    return { i: idx, label: data[idx]?.date || '' };
  });
}

function ChartGrid({ w, h, data, dataKey, s, minY, maxY }: {
  w: number; h: number; data: any[]; dataKey: string; s: number; minY?: number; maxY?: number;
}) {
  const ticks = yTicks(data, dataKey, 4, minY, maxY);
  const labels = xLabels(data);
  const plotH = h - CHART_PAD.top - CHART_PAD.bottom;
  const plotW = w - CHART_PAD.left - CHART_PAD.right;

  return (
    <>
      {ticks.map((t, i) => {
        const y = CHART_PAD.top + plotH - (plotH * i) / (ticks.length - 1);
        return (
          <React.Fragment key={i}>
            <SvgLine x1={CHART_PAD.left} y1={y} x2={w - CHART_PAD.right} y2={y} stroke="#1e1e1e" strokeWidth={1} />
            <SvgText x={CHART_PAD.left - 6} y={y + 3} fill="#64748b" fontSize={9 * s} textAnchor="end">
              {t.toFixed(1)}
            </SvgText>
          </React.Fragment>
        );
      })}
      {labels.map(({ i: idx, label }) => {
        const px = CHART_PAD.left + (data.length > 1 ? (idx / (data.length - 1)) * plotW : plotW / 2);
        return (
          <SvgText key={idx} x={px} y={h - 4} fill="#64748b" fontSize={8 * s} textAnchor="middle">
            {label}
          </SvgText>
        );
      })}
    </>
  );
}

function SmoothChart({ data, dataKey, color, height, s, showTrend, showEndpoints }: {
  data: any[]; dataKey: string; color: string; height: number; s: number;
  showTrend?: boolean; showEndpoints?: boolean;
}) {
  const w = Dimensions.get('window').width - 64 * s;
  const h = height;
  if (!data.length) return null;

  const pts = getPoints(data, dataKey, w, h);
  const pathD = catmullRomPath(pts);
  const trendLine = showTrend ? linearRegression(pts) : null;

  return (
    <View style={{ height: h }}>
      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill="transparent" />
        <ChartGrid w={w} h={h} data={data} dataKey={dataKey} s={s} />

        {/* Gradient fill */}
        <Defs>
          <LinearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.15" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {pts.length > 1 && (
          <Path
            d={`${pathD} L${pts[pts.length - 1].x},${h - CHART_PAD.bottom} L${pts[0].x},${h - CHART_PAD.bottom} Z`}
            fill={`url(#grad-${dataKey})`}
          />
        )}

        {/* Trend line */}
        {trendLine && (
          <SvgLine
            x1={trendLine.x1} y1={trendLine.y1} x2={trendLine.x2} y2={trendLine.y2}
            stroke={color} strokeWidth={1} strokeDasharray="6,4" opacity={0.5}
          />
        )}

        {/* Data curve */}
        <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Endpoint dots + values */}
        {showEndpoints && pts.length >= 2 && (
          <>
            <Circle cx={pts[0].x} cy={pts[0].y} r={3.5 * s} fill={color} />
            <SvgText x={pts[0].x} y={pts[0].y - 8 * s} fill={color} fontSize={9 * s} textAnchor="middle" fontWeight="700">
              {pts[0].val.toFixed(1)}
            </SvgText>
            <Circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={4 * s} fill="#fff" stroke={color} strokeWidth={2} />
            <SvgText x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 8 * s} fill="#fff" fontSize={10 * s} textAnchor="middle" fontWeight="700">
              {pts[pts.length - 1].val.toFixed(1)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

function SmoothMultiChart({ data, lines, height, s, showTrend, showEndpoints }: {
  data: any[];
  lines: { key: string; color: string; width: number; dash?: string }[];
  height: number; s: number; showTrend?: boolean; showEndpoints?: boolean;
}) {
  const w = Dimensions.get('window').width - 64 * s;
  const h = height;
  if (!data.length) return null;

  const allVals = lines.flatMap(l => data.map(d => Number(d[l.key]) || 0));
  const minY = Math.min(...allVals);
  const maxY = Math.max(...allVals);

  const allPts = lines.map(l => getPoints(data, l.key, w, h, minY, maxY));

  return (
    <View style={{ height: h }}>
      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill="transparent" />
        <ChartGrid w={w} h={h} data={data} dataKey={lines[0].key} s={s} minY={minY} maxY={maxY} />

        {/* Gradient fill for primary line */}
        <Defs>
          <LinearGradient id="grad-multi" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lines[0].color} stopOpacity="0.1" />
            <Stop offset="1" stopColor={lines[0].color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {allPts[0].length > 1 && (
          <Path
            d={`${catmullRomPath(allPts[0])} L${allPts[0][allPts[0].length - 1].x},${h - CHART_PAD.bottom} L${allPts[0][0].x},${h - CHART_PAD.bottom} Z`}
            fill="url(#grad-multi)"
          />
        )}

        {/* Trend line for primary */}
        {showTrend && (() => {
          const tl = linearRegression(allPts[0]);
          return tl ? (
            <SvgLine x1={tl.x1} y1={tl.y1} x2={tl.x2} y2={tl.y2}
              stroke={lines[0].color} strokeWidth={1} strokeDasharray="6,4" opacity={0.4} />
          ) : null;
        })()}

        {/* Lines */}
        {lines.map((l, li) => {
          const pts = allPts[li];
          const pathD = catmullRomPath(pts);
          return (
            <Path key={l.key} d={pathD} fill="none" stroke={l.color}
              strokeWidth={l.width} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={l.dash} />
          );
        })}

        {/* Endpoint for primary */}
        {showEndpoints && allPts[0].length >= 2 && (
          <>
            <Circle cx={allPts[0][0].x} cy={allPts[0][0].y} r={3 * s} fill={lines[0].color} />
            <Circle cx={allPts[0][allPts[0].length - 1].x} cy={allPts[0][allPts[0].length - 1].y} r={4 * s} fill="#fff" stroke={lines[0].color} strokeWidth={2} />
            <SvgText x={allPts[0][allPts[0].length - 1].x} y={allPts[0][allPts[0].length - 1].y - 8 * s} fill="#fff" fontSize={10 * s} textAnchor="middle" fontWeight="700">
              {allPts[0][allPts[0].length - 1].val.toFixed(1)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────
function StatItem({ label, value, unit, s, sub, accent, onInfo }: {
  label: string; value: string; unit: string; s: number; sub?: string; accent?: string; onInfo?: () => void;
}) {
  return (
    <View style={{
      flex: 1, minWidth: '30%',
      backgroundColor: '#0a0a0a', borderRadius: 12 * s,
      padding: 10 * s, alignItems: 'center',
      borderWidth: 1, borderColor: '#1e1e1e',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 * s }}>
        <Text style={{ fontSize: 10 * s, color: accent || '#64748b', fontWeight: '600', marginBottom: 2 * s }}>{label}</Text>
        {onInfo && (
          <Pressable onPress={onInfo} hitSlop={8} style={{ marginBottom: 2 * s }}>
            <Info size={11 * s} color="#64748b" />
          </Pressable>
        )}
      </View>
      <Text style={{ fontSize: 18 * s, fontWeight: '800', color: '#e2e8f0' }}>
        {value}
        {unit ? <Text style={{ fontSize: 10 * s, color: '#94a3b8', fontWeight: '500' }}> {unit}</Text> : null}
      </Text>
      {sub ? (
        <Text style={{
          fontSize: 8 * s, color: '#94a3b8', marginTop: 2 * s, textAlign: 'center',
          backgroundColor: '#ffffff08', paddingHorizontal: 6 * s, paddingVertical: 2 * s, borderRadius: 4 * s,
        }} numberOfLines={1}>{sub}</Text>
      ) : null}
    </View>
  );
}

function MiniStat({ label, value, unit, s, color }: {
  label: string; value: string; unit: string; s: number; color?: string;
}) {
  return (
    <View style={{ flex: 1, minWidth: '22%', alignItems: 'center', paddingVertical: 4 * s }}>
      <Text style={{ fontSize: 9 * s, color: '#64748b', marginBottom: 1 * s }}>{label}</Text>
      <Text style={{ fontSize: 14 * s, fontWeight: '700', color: color || '#e2e8f0' }}>
        {value}
        {unit ? <Text style={{ fontSize: 9 * s, color: '#94a3b8' }}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function LegendDot({ color, label, s }: { color: string; label: string; s: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 * s }}>
      <View style={{ width: 12 * s, height: 3 * s, backgroundColor: color, borderRadius: 2 * s }} />
      <Text style={{ fontSize: 10 * s, color: '#94a3b8' }}>{label}</Text>
    </View>
  );
}

function ScoreCard({ label, value, cat, s, onInfo }: {
  label: string; value: number; cat: string; s: number; onInfo?: () => void;
}) {
  const color = value >= 80 ? '#16a34a' : value >= 50 ? '#f59e0b' : '#ef4444';
  const Wrapper = onInfo ? Pressable : View;
  return (
    <Wrapper style={{
      flex: 1, minWidth: '30%', backgroundColor: '#0a0a0a',
      borderRadius: 12 * s, padding: 12 * s, alignItems: 'center',
      borderWidth: 1, borderColor: '#1e1e1e',
    }} {...(onInfo ? { onPress: onInfo } : {})}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 * s }}>
        <Text style={{ fontSize: 10 * s, color: '#64748b', marginBottom: 4 * s, fontWeight: '600' }}>{label}</Text>
        {onInfo && <Info size={10 * s} color="#64748b" style={{ marginBottom: 4 * s }} />}
      </View>
      <Text style={{ fontSize: 26 * s, fontWeight: '800', color }}>{value}</Text>
      {cat ? (
        <Text style={{
          fontSize: 9 * s, color: '#94a3b8', marginTop: 4 * s, textAlign: 'center',
          backgroundColor: '#ffffff08', paddingHorizontal: 6 * s, paddingVertical: 2 * s, borderRadius: 4 * s,
        }} numberOfLines={2}>{cat}</Text>
      ) : null}
    </Wrapper>
  );
}

function DeltaBadge({ label, delta, unit, s, invert }: {
  label: string; delta: number; unit: string; s: number; invert: boolean;
}) {
  const positive = invert ? delta < 0 : delta > 0;
  const neutral = Math.abs(delta) < 0.1;
  const color = neutral ? '#94a3b8' : positive ? '#16a34a' : '#ef4444';
  return (
    <View style={{
      alignItems: 'center', backgroundColor: '#0a0a0a', paddingHorizontal: 10 * s,
      paddingVertical: 6 * s, borderRadius: 8 * s, borderWidth: 1, borderColor: '#1e1e1e',
    }}>
      <Text style={{ fontSize: 10 * s, color: '#64748b', marginBottom: 2 * s }}>{label}</Text>
      <Text style={{ fontSize: 14 * s, fontWeight: '700', color }}>
        {delta > 0 ? '+' : ''}{delta.toFixed(1)}{unit}
      </Text>
    </View>
  );
}
