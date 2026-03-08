// Today - Daily health check-in + Health Index + trend

import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Switch, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart, Moon, Brain, Droplets, Apple, Cigarette, Wine,
  Activity, ChevronDown, ChevronUp, ChevronRight, Send,
  Stethoscope, Thermometer, Eye, Bone, Zap,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { checkinService } from '../../src/services/api';
import type { DailyCheckin, HealthIndexResult, SystemaType } from '../../src/services/api/checkinService';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../src/constants/theme';
import { BuildBanner, Card, MiniChart } from '../../src/components/ui';

// ============================================
// HELPERS
// ============================================

const getScoreColor = (s: number) => s >= 70 ? Colors.success : s >= 45 ? Colors.warning : Colors.error;

const ALCOHOL_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'No', value: 'no' },
  { label: 'Poco', value: 'poco' },
  { label: 'Moderado', value: 'moderado' },
  { label: 'Mucho', value: 'mucho' },
];

const BRISTOL_LABELS = ['', '1-Duro', '2-Grumoso', '3-Salchicha c/grietas', '4-Normal', '5-Blando', '6-Pastoso', '7-Liquido'];

const SYSTEMS: Array<{ id: SystemaType; label: string; icon: any; trigger: string }> = [
  { id: 'respiratorio', label: 'Respiratorio', icon: Stethoscope, trigger: 'Tos, falta de aire o dolor al respirar' },
  { id: 'orl', label: 'ORL', icon: Stethoscope, trigger: 'Dolor garganta, congestion o rinorrea' },
  { id: 'cardiologico', label: 'Cardiologico', icon: Heart, trigger: 'Palpitaciones, dolor opresivo o mareos' },
  { id: 'genitourinario', label: 'Genitourinario', icon: Droplets, trigger: 'Ardor al orinar, urgencia o dolor lumbar' },
  { id: 'musculoesqueletico', label: 'Musculoesqueletico', icon: Bone, trigger: 'Dolor musculoesqueletico' },
  { id: 'neurologico', label: 'Neurologico', icon: Brain, trigger: 'Cefalea fuerte, hormigueos o debilidad' },
  { id: 'piel', label: 'Piel', icon: Eye, trigger: 'Sarpullido, picazon, heridas o lesiones nuevas' },
  { id: 'temperatura', label: 'Temperatura', icon: Thermometer, trigger: 'Fiebre o escalofrios' },
];

// ============================================
// SLIDER COMPONENT (0-10)
// ============================================

function SliderRow({ label, value, onChange, icon }: { label: string; value: number; onChange: (v: number) => void; icon?: React.ReactNode }) {
  const color = value <= 3 ? Colors.success : value <= 6 ? Colors.warning : Colors.error;
  return (
    <View style={s.sliderRow}>
      <View style={s.sliderHeader}>
        {icon}
        <Text style={s.sliderLabel}>{label}</Text>
        <Text style={[s.sliderValue, { color }]}>{value}</Text>
      </View>
      <View style={s.sliderTrack}>
        {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
          <Pressable key={v} onPress={() => onChange(v)}
            style={[s.sliderDot, v <= value && { backgroundColor: color }]} />
        ))}
      </View>
    </View>
  );
}

function SliderRowInverse({ label, value, onChange, icon }: { label: string; value: number; onChange: (v: number) => void; icon?: React.ReactNode }) {
  const color = value >= 7 ? Colors.success : value >= 4 ? Colors.warning : Colors.error;
  return (
    <View style={s.sliderRow}>
      <View style={s.sliderHeader}>
        {icon}
        <Text style={s.sliderLabel}>{label}</Text>
        <Text style={[s.sliderValue, { color }]}>{value}</Text>
      </View>
      <View style={s.sliderTrack}>
        {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
          <Pressable key={v} onPress={() => onChange(v)}
            style={[s.sliderDot, v <= value && { backgroundColor: color }]} />
        ))}
      </View>
    </View>
  );
}

// ============================================
// TOGGLE ROW
// ============================================

function ToggleRow({ label, value, onChange, icon }: { label: string; value: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }) {
  return (
    <View style={s.toggleRow}>
      {icon}
      <Text style={s.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: Colors.gray300, true: Colors.primary + '60' }} thumbColor={value ? Colors.primary : Colors.gray400} />
    </View>
  );
}

// ============================================
// PILL SELECTOR
// ============================================

function PillSelector({ options, value, onChange }: { options: Array<{ label: string; value: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <View style={s.pillRow}>
      {options.map(o => (
        <Pressable key={o.value} onPress={() => onChange(o.value)}
          style={[s.pill, value === o.value && s.pillActive]}>
          <Text style={[s.pillText, value === o.value && s.pillTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ============================================
// COLLAPSIBLE SECTION
// ============================================

function Section({ title, icon, children, defaultOpen = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={s.section}>
      <Pressable style={s.sectionHeader} onPress={() => setOpen(!open)}>
        {icon}
        <Text style={s.sectionTitle}>{title}</Text>
        {open ? <ChevronUp size={20} color={Colors.gray400} /> : <ChevronDown size={20} color={Colors.gray400} />}
      </Pressable>
      {open && <View style={s.sectionBody}>{children}</View>}
    </View>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function TodayScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Health Index
  const [healthIndex, setHealthIndex] = useState<HealthIndexResult | null>(null);
  const [trendData, setTrendData] = useState<Array<{ date: string; value: number }>>([]);
  const [stats, setStats] = useState<any>(null);

  // Check-in form state
  const [fumo, setFumo] = useState(false);
  const [alcohol, setAlcohol] = useState('no');
  const [actividadFisica, setActividadFisica] = useState(false);
  const [actividadTipo, setActividadTipo] = useState('');
  const [actividadMinutos, setActividadMinutos] = useState('');
  const [horasSueno, setHorasSueno] = useState('');
  const [calidadSueno, setCalidadSueno] = useState(5);
  const [estres, setEstres] = useState(5);
  const [energia, setEnergia] = useState(5);
  const [animo, setAnimo] = useState(5);
  const [deposicion, setDeposicion] = useState(false);
  const [deposicionVeces, setDeposicionVeces] = useState('');
  const [bristol, setBristol] = useState(4);
  const [dolorAbdominal, setDolorAbdominal] = useState(false);
  const [sangreMoco, setSangreMoco] = useState(false);
  const [hidratacion, setHidratacion] = useState('');
  const [hambreAnsiedad, setHambreAnsiedad] = useState(3);
  const [tomoMedicacion, setTomoMedicacion] = useState(false);
  const [medicacionDetalle, setMedicacionDetalle] = useState('');

  // Symptoms section
  const [symptomsOpen, setSymptomsOpen] = useState(false);
  const [activeSystem, setActiveSystem] = useState<SystemaType | null>(null);
  const [symptomDesc, setSymptomDesc] = useState('');
  const [symptomIntensity, setSymptomIntensity] = useState(5);
  const [submittingSymptom, setSubmittingSymptom] = useState(false);

  // Already filled today?
  const [alreadyFilled, setAlreadyFilled] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load all in parallel
      const [todayRes, hiRes, trendRes, statsRes] = await Promise.all([
        checkinService.getToday(),
        checkinService.getHealthIndex(),
        checkinService.getHealthIndexTrend(14),
        checkinService.getStats(),
      ]);

      // Health index
      if (hiRes.data) setHealthIndex(hiRes.data as HealthIndexResult);

      // Trend for chart
      const trendArr = (trendRes.data as any)?.trend || [];
      setTrendData(trendArr.map((t: any) => ({ date: t.fecha, value: t.score })));

      // Stats
      if (statsRes.data) setStats(statsRes.data);

      // Pre-fill form if today exists
      const today = todayRes.data as DailyCheckin | null;
      if (today) {
        setAlreadyFilled(true);
        setFumo(!!today.fumo);
        setAlcohol(today.alcohol || 'no');
        setActividadFisica(!!today.actividad_fisica);
        setActividadTipo(today.actividad_tipo || '');
        setActividadMinutos(today.actividad_minutos ? String(today.actividad_minutos) : '');
        setHorasSueno(today.horas_sueno ? String(today.horas_sueno) : '');
        setCalidadSueno(today.calidad_sueno ?? 5);
        setEstres(today.estres ?? 5);
        setEnergia(today.energia ?? 5);
        setAnimo(today.animo ?? 5);
        setDeposicion(!!today.deposicion);
        setDeposicionVeces(today.deposicion_veces ? String(today.deposicion_veces) : '');
        setBristol(today.bristol ?? 4);
        setDolorAbdominal(!!today.dolor_abdominal);
        setSangreMoco(!!today.sangre_moco);
        setHidratacion(today.hidratacion_litros ? String(today.hidratacion_litros) : '');
        setHambreAnsiedad(today.hambre_ansiedad ?? 3);
        setTomoMedicacion(!!today.tomo_medicacion);
        setMedicacionDetalle(today.medicacion_detalle || '');
      }
    } catch (e) {
      console.error('Error loading checkin data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await checkinService.submitToday({
        fumo,
        alcohol: alcohol as any,
        actividad_fisica: actividadFisica,
        actividad_tipo: actividadTipo || undefined,
        actividad_minutos: actividadMinutos ? parseInt(actividadMinutos) : undefined,
        horas_sueno: horasSueno ? parseFloat(horasSueno) : undefined,
        calidad_sueno: calidadSueno,
        estres,
        energia,
        animo,
        deposicion,
        deposicion_veces: deposicionVeces ? parseInt(deposicionVeces) : undefined,
        bristol,
        dolor_abdominal: dolorAbdominal,
        sangre_moco: sangreMoco,
        hidratacion_litros: hidratacion ? parseFloat(hidratacion) : undefined,
        hambre_ansiedad: hambreAnsiedad,
        tomo_medicacion: tomoMedicacion,
        medicacion_detalle: medicacionDetalle || undefined,
        completado: true,
      } as any);

      if (res.data) {
        const hi = (res.data as any).health_index;
        if (hi) setHealthIndex(hi);
        setAlreadyFilled(true);
      }
    } catch (e) {
      console.error('Error saving checkin:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitSymptom = async () => {
    if (!activeSystem) return;
    setSubmittingSymptom(true);
    try {
      await checkinService.submitSymptom({
        sistema: activeSystem,
        descripcion: symptomDesc || undefined,
        intensidad: symptomIntensity,
      });
      setActiveSystem(null);
      setSymptomDesc('');
      setSymptomIntensity(5);
    } catch (e) {
      console.error('Error submitting symptom:', e);
    } finally {
      setSubmittingSymptom(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const hiScore = healthIndex?.score ?? 0;
  const hiColor = getScoreColor(hiScore);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <BuildBanner />
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        {/* ======= HEALTH INDEX CARD ======= */}
        <Card style={s.hiCard} variant="elevated">
          <Text style={s.hiLabel}>Health Index</Text>
          <View style={s.hiScoreRow}>
            <Text style={[s.hiScore, { color: hiColor }]}>{Math.round(hiScore)}</Text>
            <Text style={s.hiMax}>/100</Text>
          </View>

          {/* Breakdown bars */}
          <View style={s.hiBreakdown}>
            {healthIndex && [
              { label: 'Corporal', value: healthIndex.comp_corporal, weight: '35%' },
              { label: 'Cintura', value: healthIndex.comp_cintura, weight: '20%' },
              { label: 'Actividad', value: healthIndex.comp_actividad, weight: '15%' },
              { label: 'Sueno', value: healthIndex.comp_sueno, weight: '10%' },
              { label: 'Recuperacion', value: healthIndex.comp_recuperacion, weight: '10%' },
              { label: 'Digestivo', value: healthIndex.comp_digestivo, weight: '5%' },
              { label: 'Habitos', value: healthIndex.comp_habitos, weight: '5%' },
            ].map(c => (
              <View key={c.label} style={s.hiBarRow}>
                <Text style={s.hiBarLabel}>{c.label} ({c.weight})</Text>
                <View style={s.hiBarTrack}>
                  <View style={[s.hiBarFill, { width: `${c.value}%` as any, backgroundColor: getScoreColor(c.value) }]} />
                </View>
                <Text style={s.hiBarValue}>{Math.round(c.value)}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* ======= TREND CHART ======= */}
        {trendData.length > 1 && (
          <Card style={s.trendCard}>
            <Text style={s.trendTitle}>Tendencia (14 dias)</Text>
            <MiniChart data={trendData} color={Colors.primary} unit="" />
          </Card>
        )}

        {/* ======= WEEKLY STATS ======= */}
        {stats && (
          <View style={s.statsRow}>
            <StatMini label="Sueno" value={`${stats.avg_sueno}/10`} />
            <StatMini label="Estres" value={`${stats.avg_estres}/10`} />
            <StatMini label="Energia" value={`${stats.avg_energia}/10`} />
            <StatMini label="Adherencia" value={`${stats.adherencia_pct}%`} />
          </View>
        )}

        {/* ======= LINK TO SITUATION ======= */}
        <Pressable style={s.linkRow} onPress={() => router.push('/(patient)/situation' as any)}>
          <Activity size={18} color={Colors.primary} />
          <Text style={s.linkText}>Ver situacion corporal detallada</Text>
          <ChevronRight size={18} color={Colors.gray400} />
        </Pressable>

        {/* ======= CHECK-IN FORM ======= */}
        <View style={s.formHeader}>
          <Text style={s.formTitle}>Check-in de hoy</Text>
          {alreadyFilled && <View style={s.filledBadge}><CheckCircle2 size={14} color={Colors.success} /><Text style={s.filledText}>Completado</Text></View>}
        </View>

        {/* --- Habitos / Recuperacion --- */}
        <Section title="Habitos / Recuperacion" icon={<Moon size={18} color={Colors.primary} />} defaultOpen={!alreadyFilled}>
          <ToggleRow label="Fume hoy" value={fumo} onChange={setFumo} icon={<Cigarette size={16} color={Colors.gray400} />} />

          <Text style={s.fieldLabel}>Alcohol</Text>
          <PillSelector options={ALCOHOL_OPTIONS} value={alcohol} onChange={setAlcohol} />

          <ToggleRow label="Actividad fisica" value={actividadFisica} onChange={setActividadFisica} icon={<Activity size={16} color={Colors.gray400} />} />
          {actividadFisica && (
            <View style={s.subFields}>
              <View style={s.inputRow}>
                <TextInput style={s.input} placeholder="Tipo (gym, correr...)" placeholderTextColor={Colors.gray400} value={actividadTipo} onChangeText={setActividadTipo} />
                <TextInput style={[s.input, { width: 80 }]} placeholder="Min" placeholderTextColor={Colors.gray400} value={actividadMinutos} onChangeText={setActividadMinutos} keyboardType="numeric" />
              </View>
            </View>
          )}

          <View style={s.inputRow}>
            <Text style={s.fieldLabel}>Horas de sueno</Text>
            <TextInput style={[s.input, { width: 70 }]} placeholder="7.5" placeholderTextColor={Colors.gray400} value={horasSueno} onChangeText={setHorasSueno} keyboardType="decimal-pad" />
          </View>

          <SliderRowInverse label="Calidad sueno" value={calidadSueno} onChange={setCalidadSueno} icon={<Moon size={16} color={Colors.gray400} />} />
          <SliderRow label="Estres" value={estres} onChange={setEstres} icon={<Zap size={16} color={Colors.gray400} />} />
          <SliderRowInverse label="Energia" value={energia} onChange={setEnergia} icon={<Activity size={16} color={Colors.gray400} />} />
          <SliderRowInverse label="Animo" value={animo} onChange={setAnimo} icon={<Heart size={16} color={Colors.gray400} />} />
        </Section>

        {/* --- Digestivo --- */}
        <Section title="Digestivo" icon={<Apple size={18} color={Colors.warning} />}>
          <ToggleRow label="Fui al bano hoy" value={deposicion} onChange={setDeposicion} />
          {deposicion && (
            <>
              <View style={s.inputRow}>
                <Text style={s.fieldLabel}>Cuantas veces</Text>
                <TextInput style={[s.input, { width: 60 }]} placeholder="2" placeholderTextColor={Colors.gray400} value={deposicionVeces} onChangeText={setDeposicionVeces} keyboardType="numeric" />
              </View>
              <Text style={s.fieldLabel}>Bristol (1-7)</Text>
              <View style={s.bristolRow}>
                {[1,2,3,4,5,6,7].map(v => (
                  <Pressable key={v} onPress={() => setBristol(v)}
                    style={[s.bristolBtn, bristol === v && s.bristolBtnActive]}>
                    <Text style={[s.bristolBtnText, bristol === v && s.bristolBtnTextActive]}>{v}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.bristolDesc}>{BRISTOL_LABELS[bristol]}</Text>
            </>
          )}
          <ToggleRow label="Dolor abdominal / distension" value={dolorAbdominal} onChange={setDolorAbdominal} icon={<AlertTriangle size={16} color={Colors.warning} />} />
          <ToggleRow label="Sangre o moco" value={sangreMoco} onChange={setSangreMoco} icon={<AlertTriangle size={16} color={Colors.error} />} />
        </Section>

        {/* --- Autocuidado --- */}
        <Section title="Autocuidado" icon={<Droplets size={18} color={Colors.secondary} />}>
          <View style={s.inputRow}>
            <Text style={s.fieldLabel}>Hidratacion (litros)</Text>
            <TextInput style={[s.input, { width: 70 }]} placeholder="2.0" placeholderTextColor={Colors.gray400} value={hidratacion} onChangeText={setHidratacion} keyboardType="decimal-pad" />
          </View>
          <SliderRow label="Hambre / ansiedad por comida" value={hambreAnsiedad} onChange={setHambreAnsiedad} />
          <ToggleRow label="Tome medicacion" value={tomoMedicacion} onChange={setTomoMedicacion} />
          {tomoMedicacion && (
            <TextInput style={s.inputFull} placeholder="Cual medicacion..." placeholderTextColor={Colors.gray400} value={medicacionDetalle} onChangeText={setMedicacionDetalle} />
          )}
        </Section>

        {/* ======= SAVE BUTTON ======= */}
        <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Send size={18} color={Colors.white} />}
          <Text style={s.saveBtnText}>{alreadyFilled ? 'Actualizar check-in' : 'Guardar check-in'}</Text>
        </Pressable>

        {/* ======= SYMPTOMS BY SYSTEM ======= */}
        <Pressable style={s.symptomsHeader} onPress={() => setSymptomsOpen(!symptomsOpen)}>
          <Stethoscope size={20} color={Colors.error} />
          <Text style={s.symptomsTitle}>Reportar sintomas por sistema</Text>
          {symptomsOpen ? <ChevronUp size={20} color={Colors.gray400} /> : <ChevronDown size={20} color={Colors.gray400} />}
        </Pressable>

        {symptomsOpen && (
          <View style={s.systemsList}>
            {SYSTEMS.map(sys => {
              const Icon = sys.icon;
              const isActive = activeSystem === sys.id;
              return (
                <View key={sys.id} style={s.systemItem}>
                  <Pressable style={s.systemTrigger} onPress={() => setActiveSystem(isActive ? null : sys.id)}>
                    <Icon size={16} color={isActive ? Colors.error : Colors.gray400} />
                    <Text style={[s.systemLabel, isActive && { color: Colors.error }]}>{sys.trigger}</Text>
                    {isActive ? <ChevronUp size={16} color={Colors.error} /> : <ChevronDown size={16} color={Colors.gray400} />}
                  </Pressable>
                  {isActive && (
                    <View style={s.systemForm}>
                      <TextInput style={s.inputFull} placeholder="Descripcion breve..." placeholderTextColor={Colors.gray400} value={symptomDesc} onChangeText={setSymptomDesc} />
                      <SliderRow label="Intensidad" value={symptomIntensity} onChange={setSymptomIntensity} />
                      <Pressable style={s.symptomSubmitBtn} onPress={handleSubmitSymptom} disabled={submittingSymptom}>
                        {submittingSymptom ? <ActivityIndicator size="small" color={Colors.white} /> : <Send size={14} color={Colors.white} />}
                        <Text style={s.symptomSubmitText}>Reportar {sys.label}</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// STAT MINI CARD
// ============================================

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statMini}>
      <Text style={s.statMiniValue}>{value}</Text>
      <Text style={s.statMiniLabel}>{label}</Text>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Health Index card
  hiCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  hiLabel: { fontSize: FontSize.sm, color: Colors.gray500, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 1 },
  hiScoreRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: Spacing.xs },
  hiScore: { fontSize: 56, fontWeight: FontWeight.bold },
  hiMax: { fontSize: FontSize.lg, color: Colors.gray400, marginLeft: 4 },
  hiBreakdown: { marginTop: Spacing.lg },
  hiBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  hiBarLabel: { width: 130, fontSize: FontSize.xs, color: Colors.gray500 },
  hiBarTrack: { flex: 1, height: 6, backgroundColor: Colors.gray100, borderRadius: 3, overflow: 'hidden' },
  hiBarFill: { height: 6, borderRadius: 3 },
  hiBarValue: { width: 28, textAlign: 'right', fontSize: FontSize.xs, color: Colors.gray500, fontWeight: FontWeight.semibold },

  // Trend
  trendCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  trendTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.sm },

  // Stats row
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statMini: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.gray100 },
  statMiniValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  statMiniLabel: { fontSize: FontSize.xs, color: Colors.gray500, marginTop: 2 },

  // Link row
  linkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.gray100 },
  linkText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },

  // Form
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  formTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  filledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.success + '15', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.md },
  filledText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold },

  // Sections
  section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.gray100, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  sectionTitle: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  sectionBody: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },

  // Slider
  sliderRow: { marginBottom: Spacing.md },
  sliderHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  sliderLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  sliderValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, width: 28, textAlign: 'right' },
  sliderTrack: { flexDirection: 'row', gap: 3 },
  sliderDot: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.gray200 },

  // Toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  toggleLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.text },

  // Pills
  pillRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md },
  pill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100 },
  pillActive: { backgroundColor: Colors.primary },
  pillText: { fontSize: FontSize.sm, color: Colors.gray500 },
  pillTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },

  // Inputs
  fieldLabel: { fontSize: FontSize.sm, color: Colors.gray500, marginBottom: 4, marginTop: Spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.text, borderWidth: 1, borderColor: Colors.gray200, flex: 1 },
  inputFull: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm, color: Colors.text, borderWidth: 1, borderColor: Colors.gray200, marginBottom: Spacing.sm },
  subFields: { marginLeft: Spacing.lg },

  // Bristol
  bristolRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  bristolBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100, justifyContent: 'center', alignItems: 'center' },
  bristolBtnActive: { backgroundColor: Colors.primary },
  bristolBtnText: { fontSize: FontSize.sm, color: Colors.gray500, fontWeight: FontWeight.semibold },
  bristolBtnTextActive: { color: Colors.white },
  bristolDesc: { fontSize: FontSize.xs, color: Colors.gray400, marginBottom: Spacing.sm },

  // Save button
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.lg },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },

  // Symptoms
  symptomsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.gray100 },
  symptomsTitle: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  systemsList: { marginTop: Spacing.sm },
  systemItem: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, marginBottom: Spacing.xs, borderWidth: 1, borderColor: Colors.gray100, overflow: 'hidden' },
  systemTrigger: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  systemLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  systemForm: { padding: Spacing.md, paddingTop: 0 },
  symptomSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.error, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
  symptomSubmitText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.white },
});
