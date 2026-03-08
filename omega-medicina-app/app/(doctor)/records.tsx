// Doctor Records - Medical records with evolution and studies management

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, X, FileText, FlaskConical, Image, ChevronRight, Calendar, Clock, Search } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../src/constants/theme';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { assignmentService, telemedicineService } from '../../src/services/api';

type StudyType = 'laboratory' | 'imaging' | 'specialist_report';
type StudyStatus = 'requested' | 'received' | 'reviewed';

const studyTypeConfig: Record<StudyType, { label: string; icon: React.ReactNode; color: string }> = {
  laboratory: { label: 'Laboratorio', icon: <FlaskConical size={20} color={Colors.primary} />, color: Colors.primary },
  imaging: { label: 'Imagen', icon: <Image size={20} color={Colors.secondary} />, color: Colors.secondary },
  specialist_report: { label: 'Informe', icon: <FileText size={20} color={Colors.warning} />, color: Colors.warning },
};

const studyStatusConfig: Record<StudyStatus, { label: string; color: string }> = {
  requested: { label: 'Solicitado', color: Colors.warning },
  received: { label: 'Recibido', color: Colors.primary },
  reviewed: { label: 'Revisado', color: Colors.success },
};

export default function RecordsScreen() {
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [showStudyModal, setShowStudyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'evolutions' | 'studies'>('evolutions');

  // Form states for new evolution
  const [evolutionForm, setEvolutionForm] = useState({
    reason: '',
    evolution: '',
    diagnosis: '',
    plan: '',
    nextControl: '',
  });

  // Form states for new study
  const [studyForm, setStudyForm] = useState({
    type: 'laboratory' as StudyType,
    name: '',
    date: new Date().toISOString().split('T')[0],
    result: '',
    status: 'requested' as StudyStatus,
  });

  const [patientSearch, setPatientSearch] = useState('');

  // Real API: my patients from assignments (already deduplicated by backend)
  const { data: myPatients } = useQuery({
    queryKey: ['myPatientsForRecords'],
    queryFn: () => assignmentService.getMyPatients(),
    select: (res) => {
      const patients = res.data?.patients ?? res.data;
      const list = (Array.isArray(patients) ? patients : []).map((a: any) => ({
        id: String(a.patient_id),
        name: a.patient_name || `Paciente ${a.patient_id}`,
        dni: a.patient_dni || '',
      }));
      // Sort alphabetically
      list.sort((a: any, b: any) => a.name.localeCompare(b.name, 'es'));
      return list;
    },
  });

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase().trim();
    if (!q) return myPatients || [];
    return (myPatients || []).filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.dni.includes(q)
    );
  }, [myPatients, patientSearch]);

  const queryClient = useQueryClient();

  // Real API: situations (evolutions) for selected patient
  const { data: situationsData } = useQuery({
    queryKey: ['situations', selectedPatient],
    queryFn: () => telemedicineService.getSituations(selectedPatient ? { paciente: selectedPatient } : undefined),
    enabled: !!selectedPatient,
  });

  // Real API: documents (studies) for selected patient
  const { data: documentsData } = useQuery({
    queryKey: ['documents', selectedPatient],
    queryFn: () => telemedicineService.getDocuments(selectedPatient ? { paciente: selectedPatient } : undefined),
    enabled: !!selectedPatient,
  });

  const rawSituations: any[] = (situationsData as any)?.data?.situations || [];
  const rawDocuments: any[] = (documentsData as any)?.data?.documents || [];

  // Map to UI shape
  const patientEvolutions = rawSituations.map((s: any) => ({
    id: String(s.id),
    date: s.fecha_registro,
    reason: s.motivo_consulta || s.tipo_consulta || '',
    evolution: s.situacion_actual || s.historia_enfermedad_actual || '',
    diagnosis: s.diagnostico_cie10 || '',
    plan: s.tratamiento_farmacologico || '',
    nextControl: s.proximos_controles || '',
  }));

  const patientStudies = rawDocuments.map((d: any) => ({
    id: String(d.id),
    type: (d.tipo_documento === 'laboratorio' ? 'laboratory' : d.tipo_documento === 'imagen' ? 'imaging' : 'specialist_report') as StudyType,
    name: d.nombre_archivo || d.descripcion || d.tipo_documento,
    date: d.fecha_documento || d.fecha_registro,
    result: d.notas || '',
    status: 'received' as StudyStatus,
  }));

  const saveEvolutionMutation = useMutation({
    mutationFn: () => {
      const patientName = (myPatients || []).find((p: any) => p.id === selectedPatient)?.name || '';
      return telemedicineService.createSituation({
        paciente_nombre: patientName,
        paciente_dni: selectedPatient || '',
        motivo_consulta: evolutionForm.reason,
        situacion_actual: evolutionForm.evolution,
        diagnostico_cie10: evolutionForm.diagnosis,
        tratamiento_farmacologico: evolutionForm.plan,
        proximos_controles: evolutionForm.nextControl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['situations', selectedPatient] });
      setShowEvolutionModal(false);
      setEvolutionForm({ reason: '', evolution: '', diagnosis: '', plan: '', nextControl: '' });
    },
  });

  const saveStudyMutation = useMutation({
    mutationFn: () => {
      const patientName = (myPatients || []).find((p: any) => p.id === selectedPatient)?.name || '';
      return telemedicineService.createDocument({
        paciente_nombre: patientName,
        paciente_dni: selectedPatient || '',
        tipo_documento: studyForm.type === 'laboratory' ? 'laboratorio' : studyForm.type === 'imaging' ? 'imagen' : 'informe',
        nombre_archivo: studyForm.name,
        fecha_documento: studyForm.date,
        notas: studyForm.result,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', selectedPatient] });
      setShowStudyModal(false);
      setStudyForm({ type: 'laboratory', name: '', date: new Date().toISOString().split('T')[0], result: '', status: 'requested' });
    },
  });

  const handleSaveEvolution = () => saveEvolutionMutation.mutate();
  const handleSaveStudy = () => saveStudyMutation.mutate();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Registros Médicos</Text>
      </View>

      {/* Patient Search + Selector */}
      <Text style={styles.sectionTitle}>Seleccionar paciente</Text>
      <View style={styles.searchRow}>
        <Search size={16} color={Colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o DNI..."
          placeholderTextColor={Colors.gray400}
          value={patientSearch}
          onChangeText={setPatientSearch}
          autoCorrect={false}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientScroll}>
        {filteredPatients.map((patient: any) => (
          <Pressable
            key={patient.id}
            style={[
              styles.patientChip,
              selectedPatient === patient.id && styles.patientChipSelected,
            ]}
            onPress={() => setSelectedPatient(patient.id || null)}
          >
            <View style={[
              styles.patientAvatar,
              selectedPatient === patient.id && styles.patientAvatarSelected,
            ]}>
              <Text style={[
                styles.patientAvatarText,
                selectedPatient === patient.id && styles.patientAvatarTextSelected,
              ]}>
                {patient.name?.charAt(0)}
              </Text>
            </View>
            <Text style={[
              styles.patientName,
              selectedPatient === patient.id && styles.patientNameSelected,
            ]} numberOfLines={2}>
              {patient.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedPatient ? (
        <>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <Pressable
              style={[styles.tab, activeTab === 'evolutions' && styles.tabActive]}
              onPress={() => setActiveTab('evolutions')}
            >
              <Text style={[styles.tabText, activeTab === 'evolutions' && styles.tabTextActive]}>
                Evolución ({patientEvolutions.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === 'studies' && styles.tabActive]}
              onPress={() => setActiveTab('studies')}
            >
              <Text style={[styles.tabText, activeTab === 'studies' && styles.tabTextActive]}>
                Estudios ({patientStudies.length})
              </Text>
            </Pressable>
          </View>

          {/* Add Button */}
          <Pressable
            style={styles.addButton}
            onPress={() => activeTab === 'evolutions' ? setShowEvolutionModal(true) : setShowStudyModal(true)}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>
              {activeTab === 'evolutions' ? 'Nueva entrada' : 'Nuevo estudio'}
            </Text>
          </Pressable>

          {/* Content */}
          {activeTab === 'evolutions' ? (
            <View style={styles.listContainer}>
              {patientEvolutions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No hay registros de evolución</Text>
                  <Text style={styles.emptySubtext}>Agregá la primera entrada</Text>
                </View>
              ) : (
                patientEvolutions.map((evolution) => (
                  <Pressable key={evolution.id} style={styles.evolutionCard}>
                    <View style={styles.evolutionHeader}>
                      <View style={styles.evolutionDate}>
                        <Calendar size={14} color={Colors.secondary} />
                        <Text style={styles.evolutionDateText}>
                          {new Date(evolution.date).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={Colors.gray400} />
                    </View>
                    <Text style={styles.evolutionReason}>{evolution.reason}</Text>
                    <Text style={styles.evolutionText} numberOfLines={2}>{evolution.evolution}</Text>
                    {evolution.diagnosis && (
                      <View style={styles.diagnosisBadge}>
                        <Text style={styles.diagnosisText}>Dx: {evolution.diagnosis}</Text>
                      </View>
                    )}
                    {evolution.nextControl && (
                      <View style={styles.nextControlRow}>
                        <Clock size={12} color={Colors.textSecondary} />
                        <Text style={styles.nextControlText}>
                          Próximo control: {new Date(evolution.nextControl).toLocaleDateString('es')}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))
              )}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {patientStudies.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No hay estudios registrados</Text>
                  <Text style={styles.emptySubtext}>Agregá el primer estudio</Text>
                </View>
              ) : (
                patientStudies.map((study) => (
                  <Pressable key={study.id} style={styles.studyCard}>
                    <View style={[styles.studyIcon, { backgroundColor: studyTypeConfig[study.type].color + '15' }]}>
                      {studyTypeConfig[study.type].icon}
                    </View>
                    <View style={styles.studyInfo}>
                      <Text style={styles.studyName}>{study.name}</Text>
                      <Text style={styles.studyDate}>
                        {new Date(study.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </Text>
                      {study.result && (
                        <Text style={styles.studyResult} numberOfLines={1}>{study.result}</Text>
                      )}
                    </View>
                    <View style={[styles.studyStatus, { backgroundColor: studyStatusConfig[study.status].color + '20' }]}>
                      <Text style={[styles.studyStatusText, { color: studyStatusConfig[study.status].color }]}>
                        {studyStatusConfig[study.status].label}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          )}
        </>
      ) : (
        <View style={styles.noPatientCard}>
          <Text style={styles.noPatientEmoji}>👆</Text>
          <Text style={styles.noPatientText}>Seleccioná un paciente para ver sus registros</Text>
        </View>
      )}

      {/* Evolution Modal */}
      <Modal
        visible={showEvolutionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEvolutionModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva entrada de evolución</Text>
                <Pressable onPress={() => setShowEvolutionModal(false)}>
                  <X size={24} color={Colors.gray500} />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Motivo de consulta *</Text>
              <TextInput
                style={styles.textInput}
                value={evolutionForm.reason}
                onChangeText={(text) => setEvolutionForm({ ...evolutionForm, reason: text })}
                placeholder="Ej: Control mensual"
              />

              <Text style={styles.inputLabel}>Evolución / Nota clínica *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={evolutionForm.evolution}
                onChangeText={(text) => setEvolutionForm({ ...evolutionForm, evolution: text })}
                placeholder="Descripción de la consulta..."
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Diagnóstico presuntivo</Text>
              <TextInput
                style={styles.textInput}
                value={evolutionForm.diagnosis}
                onChangeText={(text) => setEvolutionForm({ ...evolutionForm, diagnosis: text })}
                placeholder="Ej: Sobrepeso grado I"
              />

              <Text style={styles.inputLabel}>Plan / Indicaciones</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={evolutionForm.plan}
                onChangeText={(text) => setEvolutionForm({ ...evolutionForm, plan: text })}
                placeholder="Indicaciones para el paciente..."
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Próximo control</Text>
              <TextInput
                style={styles.textInput}
                value={evolutionForm.nextControl}
                onChangeText={(text) => setEvolutionForm({ ...evolutionForm, nextControl: text })}
                placeholder="YYYY-MM-DD"
              />

              <Pressable style={styles.saveButton} onPress={handleSaveEvolution}>
                <Text style={styles.saveButtonText}>Guardar entrada</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Study Modal */}
      <Modal
        visible={showStudyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStudyModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nuevo estudio</Text>
                <Pressable onPress={() => setShowStudyModal(false)}>
                  <X size={24} color={Colors.gray500} />
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Tipo de estudio</Text>
              <View style={styles.typeSelector}>
                {(Object.keys(studyTypeConfig) as StudyType[]).map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeOption,
                      studyForm.type === type && { 
                        backgroundColor: studyTypeConfig[type].color + '15',
                        borderColor: studyTypeConfig[type].color,
                      },
                    ]}
                    onPress={() => setStudyForm({ ...studyForm, type })}
                  >
                    {studyTypeConfig[type].icon}
                    <Text style={styles.typeLabel}>{studyTypeConfig[type].label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Nombre del estudio *</Text>
              <TextInput
                style={styles.textInput}
                value={studyForm.name}
                onChangeText={(text) => setStudyForm({ ...studyForm, name: text })}
                placeholder="Ej: Hemograma completo"
              />

              <Text style={styles.inputLabel}>Fecha</Text>
              <TextInput
                style={styles.textInput}
                value={studyForm.date}
                onChangeText={(text) => setStudyForm({ ...studyForm, date: text })}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.inputLabel}>Estado</Text>
              <View style={styles.statusSelector}>
                {(Object.keys(studyStatusConfig) as StudyStatus[]).map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.statusOption,
                      studyForm.status === status && {
                        backgroundColor: studyStatusConfig[status].color + '20',
                        borderColor: studyStatusConfig[status].color,
                      },
                    ]}
                    onPress={() => setStudyForm({ ...studyForm, status })}
                  >
                    <Text style={[
                      styles.statusLabel,
                      studyForm.status === status && { color: studyStatusConfig[status].color },
                    ]}>
                      {studyStatusConfig[status].label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Resultado / Resumen</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={studyForm.result}
                onChangeText={(text) => setStudyForm({ ...studyForm, result: text })}
                placeholder="Resultados del estudio..."
                multiline
                numberOfLines={4}
              />

              <View style={styles.attachPlaceholder}>
                <Text style={styles.attachText}>📎 Adjuntar archivo (próximamente)</Text>
              </View>

              <Pressable style={styles.saveButton} onPress={handleSaveStudy}>
                <Text style={styles.saveButtonText}>Guardar estudio</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  patientScroll: {
    marginBottom: Spacing.xl,
  },
  patientChip: {
    alignItems: 'center',
    marginRight: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  patientChipSelected: {
    backgroundColor: Colors.secondary,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  patientAvatarSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  patientAvatarText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.gray600,
  },
  patientAvatarTextSelected: {
    color: Colors.secondary,
  },
  patientName: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  patientNameSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.gray200,
  },
  tabText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  listContainer: {
    gap: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  evolutionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  evolutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  evolutionDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  evolutionDateText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: '500',
  },
  evolutionReason: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  evolutionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  diagnosisBadge: {
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  diagnosisText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '500',
  },
  nextControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  nextControlText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  studyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  studyIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  studyInfo: {
    flex: 1,
  },
  studyName: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  studyDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  studyResult: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  studyStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  studyStatusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  noPatientCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noPatientEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  noPatientText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScroll: {
    flex: 1,
    marginTop: 60,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    minHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  textInput: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  typeLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  statusSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statusOption: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusLabel: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  attachPlaceholder: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  attachText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxxl,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
