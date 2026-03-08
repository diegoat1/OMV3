// Doctor Home - Main dashboard for medical professionals

import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Users, FileText, ClipboardList, ChevronRight, Clock } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../src/constants/theme';
import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '../../src/services/api';
import { BuildBanner } from '../../src/components/ui';

export default function DoctorHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Real API: my patients count
  const { data: myPatients } = useQuery({
    queryKey: ['myPatients'],
    queryFn: () => assignmentService.getMyPatients(),
    select: (res) => {
      const patients = res.data?.patients ?? res.data;
      return Array.isArray(patients) ? patients : [];
    },
  });

  const patientsCount = myPatients?.length || 0;

  const quickActions = [
    {
      id: 'appointments',
      icon: <Calendar size={24} color={Colors.secondary} />,
      title: 'Turnos',
      subtitle: '0 hoy', // TODO FASE 3: appointments API
      route: '/(doctor)/appointments',
      color: Colors.secondary,
    },
    {
      id: 'patients',
      icon: <Users size={24} color={Colors.primary} />,
      title: 'Pacientes',
      subtitle: `${patientsCount} activos`,
      route: '/(doctor)/patients',
      color: Colors.primary,
    },
    {
      id: 'records',
      icon: <ClipboardList size={24} color={Colors.success} />,
      title: 'Registros',
      subtitle: 'Evolución y estudios',
      route: '/(doctor)/records',
      color: Colors.success,
    },
    {
      id: 'reports',
      icon: <FileText size={24} color={Colors.warning} />,
      title: 'Informes',
      subtitle: 'Generar PDF',
      route: '/(doctor)/reports',
      color: Colors.warning,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Build Banner - Siempre visible arriba */}
      <BuildBanner />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Bienvenido, {((user as any)?.nombre_apellido || 'Doctor').split(' ')[0]}</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <Pressable
            key={action.id}
            style={styles.actionCard}
            onPress={() => router.push(action.route as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
              {action.icon}
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </Pressable>
        ))}
      </View>

      {/* Today's Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Turnos de hoy</Text>
          <Pressable onPress={() => router.push('/(doctor)/appointments' as any)}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </Pressable>
        </View>

        {/* TODO FASE 3: Show real appointments when API exists */}
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No hay turnos programados para hoy</Text>
        </View>
      </View>

      {/* Recent Patients */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pacientes recientes</Text>
          <Pressable onPress={() => router.push('/(doctor)/patients' as any)}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </Pressable>
        </View>

        <View style={styles.patientsRow}>
          {(myPatients || []).slice(0, 4).map((patient: any) => (
            <Pressable
              key={patient.patient_id || patient.id}
              style={styles.patientCard}
              onPress={() => router.push({
                pathname: '/(doctor)/patient-analytics',
                params: {
                  patientId: patient.patient_id || patient.id,
                  patientName: patient.patient_name,
                  patientDni: patient.patient_dni,
                },
              } as any)}
            >
              <View style={styles.patientAvatar}>
                <Text style={styles.patientAvatarText}>
                  {(patient.patient_name || 'P').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.patientName} numberOfLines={1}>
                {patient.patient_name || 'Paciente'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center' as const,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginRight: Spacing.md,
  },
  appointmentTimeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.secondary,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentPatient: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  appointmentReason: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  appointmentStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  appointmentStatusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  patientsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  patientCard: {
    alignItems: 'center',
    flex: 1,
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  patientAvatarText: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.white,
  },
  patientName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    textAlign: 'center',
  },
});
