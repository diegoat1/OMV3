// Doctor - Cargar medidas del paciente

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, ChevronDown, ChevronRight } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';
import { userService } from '../../src/services/api';

interface PatientStatic {
  sexo: string;
  altura?: number;
  circ_cuello?: number;
  circ_muneca?: number;
  circ_tobillo?: number;
}

export default function PatientMeasuresScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId: string; patientName: string }>();
  const patientName = params.patientName || 'Paciente';

  // Patient data
  const [sexo, setSexo] = useState<string>('M');
  const [loading, setLoading] = useState(true);

  // Perfil estático
  const [showStatic, setShowStatic] = useState(false);
  const [altura, setAltura] = useState('');
  const [cuello, setCuello] = useState('');
  const [muneca, setMuneca] = useState('');
  const [tobillo, setTobillo] = useState('');

  // Medidas obligatorias
  const [peso, setPeso] = useState('');
  const [abdomen, setAbdomen] = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera, setCadera] = useState('');

  // Medidas de seguimiento
  const [showTracking, setShowTracking] = useState(false);
  const [hombro, setHombro] = useState('');
  const [pecho, setPecho] = useState('');
  const [brazo, setBrazo] = useState('');
  const [antebrazo, setAntebrazo] = useState('');
  const [muslo, setMuslo] = useState('');
  const [pantorrilla, setPantorrilla] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del paciente al montar
  useEffect(() => {
    const loadPatient = async () => {
      try {
        const res = await userService.getUser(params.patientId || '');
        const user = (res as any)?.data?.user || (res as any)?.user;
        if (user) {
          setSexo(user.sexo || 'M');
          if (user.altura) setAltura(String(user.altura));
          if (user.circ_cuello) setCuello(String(user.circ_cuello));
          if (user.circ_muneca) setMuneca(String(user.circ_muneca));
          if (user.circ_tobillo) setTobillo(String(user.circ_tobillo));
        }
      } catch {
        // Si falla, usar defaults
      } finally {
        setLoading(false);
      }
    };
    loadPatient();
  }, [params.patientId]);

  const isFemale = sexo === 'F';

  const validate = (): string | null => {
    if (!peso) return 'El peso es obligatorio';
    if (!abdomen) return 'El abdomen es obligatorio';
    if (isFemale && !cintura) return 'La cintura es obligatoria para mujeres';
    if (isFemale && !cadera) return 'La cadera es obligatoria para mujeres';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      Alert.alert('Campos incompletos', error);
      return;
    }

    setIsSaving(true);

    try {
      const measurementData: Record<string, any> = {
        peso: parseFloat(peso),
        circ_abdomen: parseFloat(abdomen),
      };

      // Campos condicionales obligatorios (F)
      if (cintura) measurementData.circ_cintura = parseFloat(cintura);
      if (cadera) measurementData.circ_cadera = parseFloat(cadera);

      // Campos estáticos (se actualizan en patients)
      if (altura) measurementData.altura = parseFloat(altura);
      if (cuello) measurementData.circ_cuello = parseFloat(cuello);
      if (muneca) measurementData.circ_muneca = parseFloat(muneca);
      if (tobillo) measurementData.circ_tobillo = parseFloat(tobillo);

      // Campos de seguimiento
      if (hombro) measurementData.circ_hombro = parseFloat(hombro);
      if (pecho) measurementData.circ_pecho = parseFloat(pecho);
      if (brazo) measurementData.circ_brazo = parseFloat(brazo);
      if (antebrazo) measurementData.circ_antebrazo = parseFloat(antebrazo);
      if (muslo) measurementData.circ_muslo = parseFloat(muslo);
      if (pantorrilla) measurementData.circ_pantorrilla = parseFloat(pantorrilla);

      await userService.addMeasurement(params.patientId || '', measurementData as any);

      Alert.alert(
        'Medicion guardada',
        'Las medidas han sido registradas exitosamente.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo guardar la medicion');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderInput = (label: string, value: string, setter: (v: string) => void, placeholder: string, required = false) => (
    <View style={styles.inputHalf}>
      <Text style={styles.inputLabel}>{label}{required ? ' *' : ''}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        placeholderTextColor={Colors.gray400}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <BuildBanner />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Medidas</Text>
          <Text style={styles.headerSubtitle}>{patientName} ({isFemale ? 'F' : 'M'})</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Seccion 1: Perfil Estatico (collapsible) */}
          <Pressable style={styles.toggleSection} onPress={() => setShowStatic(!showStatic)}>
            <Text style={styles.toggleText}>Perfil estatico</Text>
            {showStatic
              ? <ChevronDown size={18} color={Colors.textSecondary} />
              : <ChevronRight size={18} color={Colors.textSecondary} />}
          </Pressable>

          {showStatic && (
            <View style={styles.card}>
              <View style={styles.inputRow}>
                {renderInput('Altura (cm)', altura, setAltura, '170')}
                {renderInput('Cuello (cm)', cuello, setCuello, '38')}
              </View>
              <View style={styles.inputRow}>
                {renderInput('Muneca (cm)', muneca, setMuneca, '17')}
                {renderInput('Tobillo (cm)', tobillo, setTobillo, '22')}
              </View>
            </View>
          )}

          {/* Seccion 2: Medidas Principales */}
          <Text style={styles.sectionTitle}>Medidas principales</Text>
          <View style={styles.card}>
            <View style={styles.inputRow}>
              {renderInput('Peso (kg)', peso, setPeso, '70.5', true)}
              {renderInput('Abdomen (cm)', abdomen, setAbdomen, '85', true)}
            </View>

            {isFemale ? (
              <View style={styles.inputRow}>
                {renderInput('Cintura (cm)', cintura, setCintura, '70', true)}
                {renderInput('Cadera (cm)', cadera, setCadera, '95', true)}
              </View>
            ) : (
              <View style={styles.inputRow}>
                {/* Hombres: cintura y cadera van en seguimiento */}
                <View style={styles.inputHalf} />
                <View style={styles.inputHalf} />
              </View>
            )}
          </View>

          {/* Seccion 3: Medidas de Seguimiento (collapsible) */}
          <Pressable style={styles.toggleSection} onPress={() => setShowTracking(!showTracking)}>
            <Text style={styles.toggleText}>Medidas de seguimiento</Text>
            {showTracking
              ? <ChevronDown size={18} color={Colors.textSecondary} />
              : <ChevronRight size={18} color={Colors.textSecondary} />}
          </Pressable>

          {showTracking && (
            <View style={styles.card}>
              {/* En hombres: cintura y cadera como opcionales */}
              {!isFemale && (
                <View style={styles.inputRow}>
                  {renderInput('Cintura (cm)', cintura, setCintura, '70')}
                  {renderInput('Cadera (cm)', cadera, setCadera, '95')}
                </View>
              )}
              <View style={styles.inputRow}>
                {renderInput('Hombro (cm)', hombro, setHombro, '115')}
                {renderInput('Pecho (cm)', pecho, setPecho, '100')}
              </View>
              <View style={styles.inputRow}>
                {renderInput('Brazo (cm)', brazo, setBrazo, '32')}
                {renderInput('Antebrazo (cm)', antebrazo, setAntebrazo, '27')}
              </View>
              <View style={styles.inputRow}>
                {renderInput('Muslo (cm)', muslo, setMuslo, '55')}
                {renderInput('Pantorrilla (cm)', pantorrilla, setPantorrilla, '37')}
              </View>
            </View>
          )}

          {/* Guardar */}
          <Pressable
            style={[styles.saveButton, (!peso || !abdomen) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!peso || !abdomen || isSaving}
          >
            <Save size={20} color={Colors.white} />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Guardando...' : 'Guardar medicion'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: Spacing.xs },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  headerSpacer: { width: 32 },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  inputRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  inputHalf: { flex: 1 },
  inputLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  textInput: { backgroundColor: Colors.gray50, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text },
  toggleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md, marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  toggleText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.lg },
  saveButtonDisabled: { backgroundColor: Colors.gray300 },
  saveButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
});
