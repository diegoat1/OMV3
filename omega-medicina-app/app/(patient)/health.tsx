// Cuerpo - Composición corporal, scores BF/FFMI y evolución

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, TrendingDown, TrendingUp, Minus, Info, Target } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { analyticsService, userService } from '../../src/services/api';

// ─── helpers ────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 70 ? Colors.success : s >= 50 ? Colors.warning : Colors.error;

const scoreLabel = (s: number) =>
  s >= 70 ? 'Óptimo' : s >= 50 ? 'Aceptable' : 'A mejorar';

const fmtDelta = (v: number | undefined, unit: string) => {
  if (v === undefined || v === null) return null;
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)} ${unit}`;
};

// ─── types ───────────────────────────────────────────────────────────────────

type MeasurementField = 'peso' | 'abdomen' | 'cintura' | 'cadera';

const FIELD_META: Record<MeasurementField, { label: string; unit: string; placeholder: string }> = {
  peso:     { label: 'Peso',     unit: 'kg', placeholder: '75.0' },
  abdomen:  { label: 'Abdomen',  unit: 'cm', placeholder: '85' },
  cintura:  { label: 'Cintura',  unit: 'cm', placeholder: '80' },
  cadera:   { label: 'Cadera',   unit: 'cm', placeholder: '95' },
};

// ─── sub-components ──────────────────────────────────────────────────────────

function ScoreRing({ score, label, sub }: { score: number; label: string; sub: string }) {
  const color = scoreColor(score);
  return (
    <View style={ring.wrap}>
      <View style={[ring.circle, { borderColor: color }]}>
        <Text style={[ring.value, { color }]}>{Math.round(score)}</Text>
        <Text style={ring.max}>/100</Text>
      </View>
      <Text style={ring.label}>{label}</Text>
      <Text style={[ring.sub, { color }]}>{sub}</Text>
    </View>
  );
}

function SubScore({ label, score, category }: { label: string; score: number; category: string }) {
  const color = scoreColor(score);
  return (
    <View style={[sub.card, { borderLeftColor: color }]}>
      <View style={sub.row}>
        <Text style={sub.label}>{label}</Text>
        <Text style={[sub.value, { color }]}>{Math.round(score)}</Text>
      </View>
      <Text style={[sub.cat, { color }]}>{category}</Text>
      <View style={sub.bar}>
        <View style={[sub.fill, { width: `${Math.min(score, 100)}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MetricRow({
  label, value, unit, delta, deltaUnit,
}: {
  label: string; value: string; unit: string; delta?: number; deltaUnit?: string;
}) {
  const deltaStr = delta !== undefined ? fmtDelta(delta, deltaUnit ?? '') : null;
  const deltaColor = delta === undefined ? Colors.gray400
    : delta < 0 ? Colors.success
    : delta > 0 ? Colors.warning
    : Colors.gray400;

  return (
    <View style={metric.row}>
      <Text style={metric.label}>{label}</Text>
      <View style={metric.right}>
        {deltaStr && (
          <Text style={[metric.delta, { color: deltaColor }]}>{deltaStr}</Text>
        )}
        <Text style={metric.value}>{value}</Text>
        <Text style={metric.unit}>{unit}</Text>
      </View>
    </View>
  );
}

// ─── history row ─────────────────────────────────────────────────────────────

function HistoryRow({ item, index }: { item: any; index: number }) {
  const delta = item.delta_peso ?? null;
  const deltaColor = delta === null ? Colors.gray400
    : delta < 0 ? Colors.success
    : delta > 0 ? Colors.warning
    : Colors.gray400;
  const deltaStr = delta !== null
    ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)} kg`
    : '—';

  const score = item.body_score ?? item.score_bf ?? null;
  const scoreColor = score === null ? Colors.gray400
    : score >= 70 ? Colors.success
    : score >= 50 ? Colors.warning
    : Colors.error;

  const bg = index % 2 === 0 ? Colors.surface : Colors.background;

  return (
    <View style={[hist.row, { backgroundColor: bg }]}>
      <Text style={hist.date}>{item.fecha?.slice(0, 10) ?? '—'}</Text>
      <Text style={hist.cell}>{item.peso != null ? `${item.peso.toFixed(1)}` : '—'}</Text>
      <Text style={hist.cell}>{item.bf_percent != null ? `${item.bf_percent.toFixed(1)}%` : '—'}</Text>
      <Text style={[hist.cell, { color: deltaColor }]}>{deltaStr}</Text>
      {score !== null && (
        <Text style={[hist.cell, { color: scoreColor, fontWeight: '700' }]}>{Math.round(score)}</Text>
      )}
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function CuerpoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || '';

  const [showModal, setShowModal] = useState(false);
  const [field, setField] = useState<MeasurementField>('peso');
  const [inputVal, setInputVal] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Dashboard trae todo: composicion, scores, deltas, historial
  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => analyticsService.getDashboard(userId),
    select: (res) => res.data,
    enabled: !!userId,
  });

  // Historial de mediciones con todos los campos (deltas, scores)
  const { data: measurements, isLoading: loadingHistory } = useQuery({
    queryKey: ['measurements', userId],
    queryFn: () => userService.getMeasurements(userId, 200),
    select: (res: any) => {
      const raw = res?.data?.measurements ?? res?.measurements ?? [];
      return raw as any[];
    },
    enabled: !!userId && showHistory,
  });

  const addMutation = useMutation({
    mutationFn: (body: any) => userService.addMeasurement(userId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowModal(false);
      setInputVal('');
    },
  });

  const openModal = (f: MeasurementField) => {
    setField(f);
    setInputVal('');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!inputVal) return;
    addMutation.mutate({
      [field]: parseFloat(inputVal),
      fecha: new Date().toISOString().split('T')[0],
    });
  };

  const comp  = dash?.composicion_corporal;
  const scores = dash?.scores;
  const cats  = dash?.categorias;
  const deltas = dash?.deltas;
  const hasData = !!comp && !!scores;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.content}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Mi Cuerpo</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              style={[s.addBtn, { backgroundColor: '#8b5cf620', borderWidth: 1, borderColor: '#8b5cf650' }]}
              onPress={() => router.push('/(patient)/goals' as any)}
            >
              <Target size={16} color="#8b5cf6" />
              <Text style={[s.addBtnText, { color: '#8b5cf6' }]}>Objetivo</Text>
            </Pressable>
            <Pressable style={s.addBtn} onPress={() => openModal('peso')}>
              <Plus size={18} color={Colors.white} />
              <Text style={s.addBtnText}>Registrar</Text>
            </Pressable>
          </View>
        </View>

        {isLoading && (
          <View style={s.loading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={s.loadingText}>Cargando datos...</Text>
          </View>
        )}

        {!isLoading && !hasData && (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>Sin mediciones todavía</Text>
            <Text style={s.emptyText}>
              Registrá tu peso, abdomen, cintura y cadera para ver tu composición corporal y scores.
            </Text>
            <Pressable style={s.emptyBtn} onPress={() => openModal('peso')}>
              <Plus size={18} color={Colors.white} />
              <Text style={s.addBtnText}>Registrar primera medición</Text>
            </Pressable>
          </View>
        )}

        {hasData && (
          <>
            {/* Score principal */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Score de composición</Text>
              <View style={s.scoreRow}>
                <ScoreRing
                  score={scores!.score_total}
                  label="Total"
                  sub={scoreLabel(scores!.score_total)}
                />
                <View style={s.subScores}>
                  <SubScore
                    label="Grasa corporal"
                    score={scores!.score_bf}
                    category={scores!.categoria_bf}
                  />
                  <SubScore
                    label="Masa muscular"
                    score={scores!.score_ffmi}
                    category={scores!.categoria_ffmi}
                  />
                </View>
              </View>
              {cats?.tipo_corporal && (
                <View style={s.tipoBadge}>
                  <Info size={14} color={Colors.primary} />
                  <Text style={s.tipoText}>Tipo corporal: <Text style={s.tipoBold}>{cats.tipo_corporal}</Text></Text>
                </View>
              )}
            </View>

            {/* Métricas actuales */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Estado actual</Text>

              <MetricRow
                label="Peso"
                value={comp!.peso?.toFixed(1) ?? '--'}
                unit="kg"
                delta={deltas?.deltapeso_g !== undefined ? deltas.deltapeso_g / 1000 : undefined}
                deltaUnit="kg"
              />
              <MetricRow
                label="Grasa corporal"
                value={comp!.bf_percent?.toFixed(1) ?? '--'}
                unit="%"
                delta={deltas?.deltabf_pct}
                deltaUnit="%"
              />
              <MetricRow
                label="Masa muscular (FFMI)"
                value={comp!.ffmi?.toFixed(2) ?? '--'}
                unit=""
                delta={deltas?.deltaffmi_pct}
                deltaUnit="%"
              />
              <MetricRow
                label="Peso magro"
                value={comp!.peso_magro?.toFixed(1) ?? '--'}
                unit="kg"
                delta={deltas?.deltapm_g !== undefined ? deltas.deltapm_g / 1000 : undefined}
                deltaUnit="kg"
              />
              <MetricRow
                label="Peso graso"
                value={comp!.peso_graso?.toFixed(1) ?? '--'}
                unit="kg"
                delta={deltas?.deltapg_g !== undefined ? deltas.deltapg_g / 1000 : undefined}
                deltaUnit="kg"
              />
              <MetricRow
                label="IMC"
                value={comp!.imc?.toFixed(1) ?? '--'}
                unit=""
                delta={deltas?.deltaimc_pct}
                deltaUnit="%"
              />
              {comp!.abdomen > 0 && (
                <MetricRow
                  label="Abdomen"
                  value={comp!.abdomen?.toFixed(0) ?? '--'}
                  unit="cm"
                />
              )}
            </View>

            {/* Registrar mediciones */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Registrar medición</Text>
              <View style={s.measureBtns}>
                {(Object.keys(FIELD_META) as MeasurementField[]).map((f) => (
                  <Pressable key={f} style={s.measureBtn} onPress={() => openModal(f)}>
                    <Plus size={14} color={Colors.primary} />
                    <Text style={s.measureBtnText}>{FIELD_META[f].label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Agua recomendada */}
            {dash?.agua_recomendada_litros > 0 && (
              <View style={[s.card, s.waterCard]}>
                <Text style={s.waterEmoji}>💧</Text>
                <View>
                  <Text style={s.waterValue}>{dash.agua_recomendada_litros.toFixed(1)} L</Text>
                  <Text style={s.waterLabel}>agua recomendada por día</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Historial de registros */}
        <View style={s.card}>
          <Pressable style={s.histHeader} onPress={() => setShowHistory(v => !v)}>
            <View>
              <Text style={s.cardTitle}>Historial de registros</Text>
              {dash?.metadata?.total_registros != null && (
                <Text style={s.histSubtitle}>{dash.metadata.total_registros} registros en total</Text>
              )}
            </View>
            <Text style={s.histToggle}>{showHistory ? '▲ Ocultar' : '▼ Ver'}</Text>
          </Pressable>

          {showHistory && (
            <>
              {/* Cabecera de tabla */}
              <View style={[hist.row, hist.header]}>
                <Text style={hist.headCell}>Fecha</Text>
                <Text style={hist.headCell}>Peso</Text>
                <Text style={hist.headCell}>BF%</Text>
                <Text style={hist.headCell}>Δ Peso</Text>
                <Text style={hist.headCell}>Score</Text>
              </View>

              {loadingHistory && (
                <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
              )}

              {!loadingHistory && (!measurements || measurements.length === 0) && (
                <Text style={s.emptyText}>Sin registros disponibles</Text>
              )}

              {!loadingHistory && measurements && measurements.map((item: any, i: number) => (
                <HistoryRow key={item.id ?? i} item={item} index={i} />
              ))}

              {!loadingHistory && measurements && measurements.length > 0 && (
                <Text style={hist.footer}>
                  Mostrando {measurements.length} de {dash?.metadata?.total_registros ?? measurements.length} registros
                </Text>
              )}
            </>
          )}
        </View>

      </ScrollView>

      {/* Modal registrar */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Registrar {FIELD_META[field].label}</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <X size={24} color={Colors.gray500} />
              </Pressable>
            </View>
            <View style={s.modalBody}>
              <View style={s.inputRow}>
                <TextInput
                  style={s.input}
                  value={inputVal}
                  onChangeText={setInputVal}
                  keyboardType="decimal-pad"
                  placeholder={FIELD_META[field].placeholder}
                  placeholderTextColor={Colors.gray400}
                  autoFocus
                />
                <Text style={s.inputUnit}>{FIELD_META[field].unit}</Text>
              </View>
              <Text style={s.inputDate}>Fecha: hoy</Text>
            </View>
            <View style={s.modalFooter}>
              <Pressable style={s.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={s.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[s.saveBtn, (!inputVal || addMutation.isPending) && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!inputVal || addMutation.isPending}
              >
                {addMutation.isPending
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={s.saveText}>Guardar</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  content:      { padding: Spacing.lg, paddingBottom: 100 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title:        { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  addBtn:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  addBtnText:   { color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' },
  loading:      { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  loadingText:  { color: Colors.gray400, fontSize: FontSize.sm },
  empty:        { alignItems: 'center', paddingVertical: 60, paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyTitle:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText:    { fontSize: FontSize.sm, color: Colors.gray500, textAlign: 'center', lineHeight: 20 },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.primary, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, marginTop: Spacing.sm },
  card:         { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardTitle:    { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.lg },
  // Score ring
  scoreRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  subScores:    { flex: 1, gap: Spacing.sm },
  tipoBadge:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.lg, backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  tipoText:     { fontSize: FontSize.sm, color: Colors.textSecondary },
  tipoBold:     { fontWeight: '700', color: Colors.text },
  // Metric rows
  measureBtns:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  measureBtn:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  measureBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  // Water
  waterCard:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, backgroundColor: Colors.primary + '08' },
  waterEmoji:   { fontSize: 36 },
  waterValue:   { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.primary },
  waterLabel:   { fontSize: FontSize.sm, color: Colors.textSecondary },
  // Historial
  histHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  histSubtitle: { fontSize: FontSize.xs, color: Colors.gray400, marginTop: 2 },
  histToggle:   { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '600' },
  // Modal
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalBody:    { padding: Spacing.lg },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  input:        { flex: 1, fontSize: 32, fontWeight: '700', color: Colors.text, padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.gray200 },
  inputUnit:    { fontSize: FontSize.lg, color: Colors.gray500, width: 40 },
  inputDate:    { fontSize: FontSize.sm, color: Colors.gray400, textAlign: 'center', marginTop: Spacing.md },
  modalFooter:  { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg },
  cancelBtn:    { flex: 1, borderWidth: 1, borderColor: Colors.gray200, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  cancelText:   { fontSize: FontSize.md, color: Colors.text, fontWeight: '600' },
  saveBtn:      { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText:     { fontSize: FontSize.md, color: Colors.white, fontWeight: '600' },
});

// Sub-component styles
const ring = StyleSheet.create({
  wrap:   { alignItems: 'center' },
  circle: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, justifyContent: 'center', alignItems: 'center' },
  value:  { fontSize: 28, fontWeight: '700' },
  max:    { fontSize: FontSize.xs, color: Colors.gray400 },
  label:  { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginTop: Spacing.sm },
  sub:    { fontSize: FontSize.xs, fontWeight: '500', marginTop: 2 },
});

const sub = StyleSheet.create({
  card:   { borderLeftWidth: 3, paddingLeft: Spacing.sm, paddingVertical: Spacing.xs },
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:  { fontSize: FontSize.sm, color: Colors.textSecondary },
  value:  { fontSize: FontSize.lg, fontWeight: '700' },
  cat:    { fontSize: FontSize.xs, marginTop: 2 },
  bar:    { height: 4, backgroundColor: Colors.gray100, borderRadius: 2, marginTop: Spacing.xs },
  fill:   { height: 4, borderRadius: 2 },
});

const metric = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  label:  { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  right:  { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  delta:  { fontSize: FontSize.xs, fontWeight: '500' },
  value:  { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  unit:   { fontSize: FontSize.xs, color: Colors.gray400 },
});

const hist = StyleSheet.create({
  row:      { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4 },
  header:   { borderBottomWidth: 1, borderBottomColor: Colors.gray200, marginBottom: 2 },
  headCell: { flex: 1, fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  date:     { flex: 1.4, fontSize: FontSize.xs, color: Colors.text },
  cell:     { flex: 1, fontSize: FontSize.xs, color: Colors.text, textAlign: 'center' },
  footer:   { fontSize: FontSize.xs, color: Colors.gray400, textAlign: 'center', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray100 },
});

