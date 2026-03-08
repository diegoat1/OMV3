// Doctor Appointments Screen - Manage appointments and schedule

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, User, CheckCircle, XCircle, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card, Button } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { telemedicineService } from '../../src/services/api';
import type { Appointment as ApiAppointment } from '../../src/services/api';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface UIAppointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  patientName: string;
  reason: string;
  status: string;
}

type FilterType = 'today' | 'pending' | 'all';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterType>('today');
  const [refreshing, setRefreshing] = useState(false);

  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments', filter],
    queryFn: () => telemedicineService.getAppointments(
      filter === 'today' ? { from_date: new Date().toISOString().split('T')[0], to_date: new Date().toISOString().split('T')[0] } :
      filter === 'pending' ? { status: 'programada' } : { limit: 50 }
    ),
  });

  const rawAppointments: ApiAppointment[] = (appointmentsData as any)?.data?.appointments || [];

  // Map API fields to UI-compatible shape
  const appointments = rawAppointments.map(a => {
    const dt = a.fecha_cita ? new Date(a.fecha_cita) : new Date();
    const statusMap: Record<string, string> = { programada: 'scheduled', confirmada: 'confirmed', realizada: 'completed', cancelada: 'cancelled', reagendada: 'scheduled' };
    return {
      id: String(a.id),
      date: dt.toISOString(),
      time: format(dt, 'HH:mm'),
      duration: 30,
      patientName: (a as any).medico_nombre || a.tipo_cita || 'Paciente',
      reason: (a as any).motivo_consulta || a.tipo_cita || '',
      status: (statusMap[a.estado] || a.estado) as any,
    };
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const apiStatusMap: Record<string, string> = { confirmed: 'confirmada', completed: 'realizada', cancelled: 'cancelada' };
      return telemedicineService.updateAppointmentStatus(Number(id), apiStatusMap[status] || status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    setRefreshing(false);
  };

  const todayCount = appointments?.filter(a => isToday(parseISO(a.date))).length || 0;
  const pendingCount = appointments?.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Turnos</Text>
        <Text style={styles.subtitle}>
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{todayCount}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </Card>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <FilterTab label="Hoy" active={filter === 'today'} onPress={() => setFilter('today')} />
        <FilterTab label="Pendientes" active={filter === 'pending'} onPress={() => setFilter('pending')} />
        <FilterTab label="Todos" active={filter === 'all'} onPress={() => setFilter('all')} />
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {appointments?.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Sin turnos</Text>
            <Text style={styles.emptyText}>
              {filter === 'today' ? 'No tienes turnos para hoy' : 'No hay turnos pendientes'}
            </Text>
          </View>
        ) : (
          appointments?.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onConfirm={() => updateStatusMutation.mutate({ id: appointment.id, status: 'confirmed' })}
              onComplete={() => updateStatusMutation.mutate({ id: appointment.id, status: 'completed' })}
              onCancel={() => updateStatusMutation.mutate({ id: appointment.id, status: 'cancelled' })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.filterTab, active && styles.filterTabActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function AppointmentCard({ appointment, onConfirm, onComplete, onCancel }: {
  appointment: UIAppointment;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const date = parseISO(appointment.date);
  const isAppointmentToday = isToday(date);
  const isAppointmentTomorrow = isTomorrow(date);

  const getDateLabel = () => {
    if (isAppointmentToday) return 'Hoy';
    if (isAppointmentTomorrow) return 'Mañana';
    return format(date, "d 'de' MMM", { locale: es });
  };

  const getStatusColor = () => {
    switch (appointment.status) {
      case 'confirmed': return Colors.success;
      case 'scheduled': return Colors.warning;
      case 'completed': return Colors.gray400;
      case 'cancelled': return Colors.error;
      default: return Colors.gray400;
    }
  };

  const getStatusLabel = () => {
    switch (appointment.status) {
      case 'confirmed': return 'Confirmado';
      case 'scheduled': return 'Programado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return appointment.status;
    }
  };

  return (
    <Card style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{appointment.time}</Text>
          <Text style={styles.dateText}>{getDateLabel()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusLabel()}</Text>
        </View>
      </View>

      <View style={styles.patientInfo}>
        <View style={styles.patientAvatar}>
          <User size={20} color={Colors.gray500} />
        </View>
        <View style={styles.patientDetails}>
          <Text style={styles.patientName}>{appointment.patientName}</Text>
          <Text style={styles.appointmentReason}>{appointment.reason}</Text>
        </View>
        <ChevronRight size={20} color={Colors.gray400} />
      </View>

      <View style={styles.appointmentMeta}>
        <View style={styles.metaItem}>
          <Clock size={14} color={Colors.gray500} />
          <Text style={styles.metaText}>{appointment.duration} min</Text>
        </View>
      </View>

      {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
        <View style={styles.actionsRow}>
          {appointment.status === 'scheduled' && (
            <Button
              title="Confirmar"
              size="sm"
              variant="outline"
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          )}
          <Button
            title="Completar"
            size="sm"
            icon={<CheckCircle size={14} color={Colors.white} />}
            onPress={onComplete}
            style={{ flex: 1 }}
          />
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <XCircle size={20} color={Colors.error} />
          </Pressable>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.gray500,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray100,
  },
  filterTabActive: {
    backgroundColor: Colors.secondary,
  },
  filterTabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray600,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  appointmentCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  timeContainer: {},
  timeText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  appointmentReason: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  appointmentMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  cancelButton: {
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
