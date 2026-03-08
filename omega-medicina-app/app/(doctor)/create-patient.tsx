// Doctor - Crear perfil de paciente (manual)

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Calendar, Ruler, Target, Send } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';
import { telemedicineService } from '../../src/services/api';

type Sex = 'male' | 'female';
type ObjectiveType = 'weight_loss' | 'muscle_gain' | 'recomposition' | 'maintenance';

const objectiveOptions: { id: ObjectiveType; label: string; emoji: string }[] = [
  { id: 'weight_loss', label: 'Pérdida de peso', emoji: '⬇️' },
  { id: 'muscle_gain', label: 'Ganancia muscular', emoji: '💪' },
  { id: 'recomposition', label: 'Recomposición', emoji: '🔄' },
  { id: 'maintenance', label: 'Mantenimiento', emoji: '⚖️' },
];

export default function CreatePatientScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [height, setHeight] = useState('');
  const [objective, setObjective] = useState<ObjectiveType>('maintenance');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPatient, setSavedPatient] = useState<{ id: string; name: string } | null>(null);

  const isFormValid = name.trim() && birthDate.trim() && height.trim();

  const handleSave = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Completa todos los campos obligatorios');
      return;
    }

    setIsSaving(true);
    
    try {
      const res = await telemedicineService.createPatient({
        paciente_nombre: name.trim(),
        fecha_nacimiento: birthDate,
        nombre: name.trim().split(' ')[0],
        apellido: name.trim().split(' ').slice(1).join(' '),
        altura_cm: parseInt(height) || undefined,
        notas: [objective, notes].filter(Boolean).join(' - '),
      });
      const data = (res as any)?.data || res;
      const created = data?.paciente || data;
      setSavedPatient({ id: String(created?.id || Date.now()), name: name.trim() });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo crear el paciente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestActivation = () => {
    Alert.alert(
      'Solicitud enviada',
      'Se ha notificado al administrador para activar este paciente.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  // Si ya se guardó, mostrar estado pendiente
  if (savedPatient) {
    return (
      <View style={styles.container}>
        <BuildBanner />
        
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Paciente Creado</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <User size={48} color={Colors.primary} />
          </View>
          
          <Text style={styles.successTitle}>{savedPatient.name}</Text>
          
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>⏳ Pendiente de activación</Text>
          </View>
          
          <Text style={styles.successText}>
            El paciente ha sido creado pero necesita ser activado por un administrador antes de poder acceder al sistema.
          </Text>

          <Pressable style={styles.requestButton} onPress={handleRequestActivation}>
            <Send size={20} color={Colors.white} />
            <Text style={styles.requestButtonText}>Solicitar activación al Admin</Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Volver a pacientes</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BuildBanner />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Crear Paciente</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <User size={16} color={Colors.textSecondary} /> Nombre completo *
          </Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor={Colors.gray400}
          />
        </View>

        {/* Fecha de nacimiento */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <Calendar size={16} color={Colors.textSecondary} /> Fecha de nacimiento *
          </Text>
          <TextInput
            style={styles.textInput}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={Colors.gray400}
          />
        </View>

        {/* Sexo */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sexo *</Text>
          <View style={styles.sexSelector}>
            <Pressable
              style={[styles.sexOption, sex === 'male' && styles.sexOptionActive]}
              onPress={() => setSex('male')}
            >
              <Text style={styles.sexEmoji}>👨</Text>
              <Text style={[styles.sexLabel, sex === 'male' && styles.sexLabelActive]}>Masculino</Text>
            </Pressable>
            <Pressable
              style={[styles.sexOption, sex === 'female' && styles.sexOptionActive]}
              onPress={() => setSex('female')}
            >
              <Text style={styles.sexEmoji}>👩</Text>
              <Text style={[styles.sexLabel, sex === 'female' && styles.sexLabelActive]}>Femenino</Text>
            </Pressable>
          </View>
        </View>

        {/* Altura */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <Ruler size={16} color={Colors.textSecondary} /> Altura (cm) *
          </Text>
          <TextInput
            style={styles.textInput}
            value={height}
            onChangeText={setHeight}
            placeholder="Ej: 175"
            placeholderTextColor={Colors.gray400}
            keyboardType="numeric"
          />
        </View>

        {/* Objetivo inicial */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            <Target size={16} color={Colors.textSecondary} /> Objetivo inicial
          </Text>
          <View style={styles.objectiveGrid}>
            {objectiveOptions.map((opt) => (
              <Pressable
                key={opt.id}
                style={[styles.objectiveOption, objective === opt.id && styles.objectiveOptionActive]}
                onPress={() => setObjective(opt.id)}
              >
                <Text style={styles.objectiveEmoji}>{opt.emoji}</Text>
                <Text style={[styles.objectiveLabel, objective === opt.id && styles.objectiveLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notas */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notas adicionales</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Observaciones, condiciones médicas, etc."
            placeholderTextColor={Colors.gray400}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            ℹ️ Al guardar, el paciente quedará en estado "Pendiente de activación". 
            Un administrador deberá activarlo para que pueda acceder al sistema.
          </Text>
        </View>

        {/* Guardar */}
        <Pressable 
          style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Guardando...' : 'Crear paciente'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { padding: Spacing.xs },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  headerSpacer: { width: 32 },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  inputGroup: { marginBottom: Spacing.lg },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.sm },
  textInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, fontSize: FontSize.md, color: Colors.text, borderWidth: 1, borderColor: Colors.gray200 },
  textArea: { height: 80, textAlignVertical: 'top' },
  // Sex Selector
  sexSelector: { flexDirection: 'row', gap: Spacing.md },
  sexOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 2, borderColor: Colors.gray200, gap: Spacing.sm },
  sexOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  sexEmoji: { fontSize: 24 },
  sexLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sexLabelActive: { color: Colors.primary, fontWeight: '600' },
  // Objective Grid
  objectiveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  objectiveOption: { width: '48%', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 2, borderColor: Colors.gray200 },
  objectiveOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  objectiveEmoji: { fontSize: 24, marginBottom: Spacing.xs },
  objectiveLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  objectiveLabelActive: { color: Colors.primary, fontWeight: '600' },
  // Info Card
  infoCard: { backgroundColor: Colors.primary + '10', borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg },
  infoText: { fontSize: FontSize.sm, color: Colors.primary, lineHeight: 20 },
  // Save Button
  saveButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: Colors.gray300 },
  saveButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  // Success State
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  successTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  pendingBadge: { backgroundColor: Colors.warning + '20', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  pendingBadgeText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.warning },
  successText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  requestButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  requestButtonText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
  secondaryButton: { paddingVertical: Spacing.md },
  secondaryButtonText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
