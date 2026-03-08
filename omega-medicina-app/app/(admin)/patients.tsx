// Admin - Gestión de pacientes pendientes y asignación a médicos

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Check, X, UserPlus, Clock, Shield, ChevronDown } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../src/constants/theme';
import { BuildBanner } from '../../src/components/ui';

type PatientStatus = 'pending' | 'active' | 'inactive';

interface PendingPatient {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  sex: 'male' | 'female';
  height: number;
  objective: string;
  status: PatientStatus;
  createdAt: string;
  doctorId?: string;
  doctorName?: string;
}

// Mock de pacientes
const initialPatients: PendingPatient[] = [
  { id: 'p1', name: 'Juan Pérez', email: 'juan@email.com', birthDate: '1990-05-15', sex: 'male', height: 175, objective: 'Pérdida de peso', status: 'pending', createdAt: '2025-01-28T10:00:00Z' },
  { id: 'p2', name: 'María García', email: 'maria@email.com', birthDate: '1985-08-22', sex: 'female', height: 162, objective: 'Recomposición', status: 'pending', createdAt: '2025-01-27T15:30:00Z' },
  { id: 'p3', name: 'Carlos López', email: 'carlos@email.com', birthDate: '1992-03-10', sex: 'male', height: 180, objective: 'Ganancia muscular', status: 'active', createdAt: '2025-01-20T09:00:00Z', doctorId: 'd1', doctorName: 'Dr. Toffaletti' },
  { id: 'p4', name: 'Ana Martínez', email: 'ana@email.com', birthDate: '1988-11-30', sex: 'female', height: 168, objective: 'Mantenimiento', status: 'inactive', createdAt: '2025-01-15T14:00:00Z' },
];

// Mock de médicos disponibles
const availableDoctors = [
  { id: 'd1', name: 'Dr. Diego Toffaletti' },
  { id: 'd2', name: 'Dra. Laura Fernández' },
  { id: 'd3', name: 'Dr. Martín Rodríguez' },
];

export default function AdminPatientsScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState(initialPatients);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('pending');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PendingPatient | null>(null);

  const filteredPatients = patients.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const pendingCount = patients.filter(p => p.status === 'pending').length;
  const activeCount = patients.filter(p => p.status === 'active').length;

  const activatePatient = (patientId: string) => {
    setPatients(patients.map(p => 
      p.id === patientId ? { ...p, status: 'active' as PatientStatus } : p
    ));
    Alert.alert('Paciente activado', 'El paciente ahora puede acceder al sistema.');
  };

  const deactivatePatient = (patientId: string) => {
    setPatients(patients.map(p => 
      p.id === patientId ? { ...p, status: 'inactive' as PatientStatus } : p
    ));
    Alert.alert('Paciente desactivado', 'El paciente ya no puede acceder al sistema.');
  };

  const openAssignModal = (patient: PendingPatient) => {
    setSelectedPatient(patient);
    setShowAssignModal(true);
  };

  const assignDoctor = (doctorId: string, doctorName: string) => {
    if (selectedPatient) {
      setPatients(patients.map(p => 
        p.id === selectedPatient.id ? { ...p, doctorId, doctorName, status: 'active' as PatientStatus } : p
      ));
      setShowAssignModal(false);
      setSelectedPatient(null);
      Alert.alert('Asignación exitosa', `${selectedPatient.name} ha sido asignado a ${doctorName} y activado.`);
    }
  };

  const getStatusBadge = (status: PatientStatus) => {
    switch (status) {
      case 'pending':
        return { color: Colors.warning, text: '⏳ Pendiente', bg: Colors.warning + '20' };
      case 'active':
        return { color: Colors.success, text: '✓ Activo', bg: Colors.success + '20' };
      case 'inactive':
        return { color: Colors.gray500, text: '✗ Inactivo', bg: Colors.gray100 };
    }
  };

  return (
    <View style={styles.container}>
      <BuildBanner />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Pacientes</Text>
        <Text style={styles.subtitle}>{pendingCount} pendientes • {activeCount} activos</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {(['pending', 'active', 'inactive', 'all'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'pending' ? `Pendientes (${pendingCount})` : 
               f === 'active' ? 'Activos' : 
               f === 'inactive' ? 'Inactivos' : 'Todos'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {filteredPatients.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color={Colors.gray300} />
            <Text style={styles.emptyText}>No hay pacientes en esta categoría</Text>
          </View>
        ) : (
          filteredPatients.map((patient) => {
            const badge = getStatusBadge(patient.status);
            return (
              <View key={patient.id} style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientInitial}>{patient.name[0]}</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientEmail}>{patient.email}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                </View>

                <View style={styles.patientDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Objetivo</Text>
                    <Text style={styles.detailValue}>{patient.objective}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Altura</Text>
                    <Text style={styles.detailValue}>{patient.height} cm</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Sexo</Text>
                    <Text style={styles.detailValue}>{patient.sex === 'male' ? '👨 M' : '👩 F'}</Text>
                  </View>
                </View>

                {patient.doctorName && (
                  <View style={styles.doctorAssigned}>
                    <Shield size={14} color={Colors.primary} />
                    <Text style={styles.doctorAssignedText}>Asignado a: {patient.doctorName}</Text>
                  </View>
                )}

                {/* Acciones */}
                <View style={styles.actionsRow}>
                  {patient.status === 'pending' && (
                    <>
                      <Pressable 
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        onPress={() => openAssignModal(patient)}
                      >
                        <UserPlus size={16} color={Colors.white} />
                        <Text style={styles.actionButtonTextWhite}>Asignar y Activar</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.actionButton, styles.actionButtonSuccess]}
                        onPress={() => activatePatient(patient.id)}
                      >
                        <Check size={16} color={Colors.white} />
                        <Text style={styles.actionButtonTextWhite}>Activar</Text>
                      </Pressable>
                    </>
                  )}
                  {patient.status === 'active' && (
                    <>
                      <Pressable 
                        style={[styles.actionButton, styles.actionButtonOutline]}
                        onPress={() => openAssignModal(patient)}
                      >
                        <UserPlus size={16} color={Colors.primary} />
                        <Text style={styles.actionButtonTextPrimary}>Reasignar</Text>
                      </Pressable>
                      <Pressable 
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={() => deactivatePatient(patient.id)}
                      >
                        <X size={16} color={Colors.white} />
                        <Text style={styles.actionButtonTextWhite}>Desactivar</Text>
                      </Pressable>
                    </>
                  )}
                  {patient.status === 'inactive' && (
                    <Pressable 
                      style={[styles.actionButton, styles.actionButtonSuccess]}
                      onPress={() => activatePatient(patient.id)}
                    >
                      <Check size={16} color={Colors.white} />
                      <Text style={styles.actionButtonTextWhite}>Reactivar</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Asignar Médico */}
      <Modal visible={showAssignModal} transparent animationType="fade" onRequestClose={() => setShowAssignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Asignar médico</Text>
              <Pressable onPress={() => setShowAssignModal(false)}>
                <X size={24} color={Colors.gray500} />
              </Pressable>
            </View>

            {selectedPatient && (
              <Text style={styles.modalSubtitle}>Paciente: {selectedPatient.name}</Text>
            )}

            <Text style={styles.modalLabel}>Selecciona un médico:</Text>
            {availableDoctors.map((doctor) => (
              <Pressable
                key={doctor.id}
                style={styles.doctorOption}
                onPress={() => assignDoctor(doctor.id, doctor.name)}
              >
                <View style={styles.doctorAvatar}>
                  <Shield size={20} color={Colors.primary} />
                </View>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <ChevronDown size={20} color={Colors.gray400} style={{ transform: [{ rotate: '-90deg' }] }} />
              </Pressable>
            ))}

            <Pressable style={styles.cancelButton} onPress={() => setShowAssignModal(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  // Filters
  filterRow: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.white },
  filterButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100 },
  filterButtonActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '600' },
  // Content
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md },
  // Patient Card
  patientCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  patientHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  patientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  patientInitial: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  patientInfo: { flex: 1 },
  patientName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  patientEmail: { fontSize: FontSize.xs, color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  // Details
  patientDetails: { flexDirection: 'row', marginBottom: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.gray100 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  detailValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  // Doctor Assigned
  doctorAssigned: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md, backgroundColor: Colors.primary + '10', padding: Spacing.sm, borderRadius: BorderRadius.sm },
  doctorAssignedText: { fontSize: FontSize.xs, color: Colors.primary },
  // Actions
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, gap: Spacing.xs },
  actionButtonPrimary: { backgroundColor: Colors.primary },
  actionButtonSuccess: { backgroundColor: Colors.success },
  actionButtonDanger: { backgroundColor: Colors.error },
  actionButtonOutline: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.primary },
  actionButtonTextWhite: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.white },
  actionButtonTextPrimary: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.lg, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },
  modalLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: Spacing.md },
  doctorOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: BorderRadius.md, marginBottom: Spacing.sm },
  doctorAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  doctorName: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  cancelButton: { marginTop: Spacing.md, padding: Spacing.md, alignItems: 'center' },
  cancelButtonText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
