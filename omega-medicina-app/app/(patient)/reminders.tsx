// Patient Reminders Screen - Screenings and controls management

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Calendar, Bell } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card, Button, Input, ReminderCard } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { ReminderCategory, ReminderFrequency } from '../../src/models';
import { engagementService } from '../../src/services/api';

const CATEGORIES: { value: ReminderCategory; label: string }[] = [
  { value: 'screening', label: 'Screening' },
  { value: 'laboratory', label: 'Laboratorio' },
  { value: 'anthropometric', label: 'Medición' },
  { value: 'consultation', label: 'Consulta' },
  { value: 'vaccination', label: 'Vacunación' },
  { value: 'medication', label: 'Medicación' },
  { value: 'custom', label: 'Otro' },
];

const FREQUENCIES: { value: ReminderFrequency; label: string }[] = [
  { value: 'once', label: 'Una vez' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'biannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export default function RemindersScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const patientId = user?.id || '';

  // Reminders from engagement API
  const { data: remindersRaw } = useQuery({
    queryKey: ['reminders', filter === 'all' ? undefined : filter],
    queryFn: () => engagementService.getReminders(filter === 'all' ? undefined : filter),
    select: (res: any) => {
      const raw = res?.data?.reminders || res?.reminders || [];
      return raw.map((r: any) => ({
        id: String(r.id),
        patientId: patientId,
        title: r.titulo || '',
        description: r.descripcion || '',
        category: r.tipo || 'custom',
        dueDate: r.fecha_vencimiento || new Date().toISOString(),
        frequency: 'once',
        status: r.completado ? 'completed' : 'pending',
        createdBy: patientId,
        createdAt: r.fecha_creacion || new Date().toISOString(),
      }));
    },
  });
  const reminders: any[] = remindersRaw || [];

  const markCompleteMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      return engagementService.completeReminder(Number(reminderId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const addReminderMutation = useMutation({
    mutationFn: async (reminder: any) => {
      return engagementService.createReminder({
        titulo: reminder.title,
        descripcion: reminder.description,
        tipo: reminder.category || 'general',
        prioridad: 'normal',
        fecha_vencimiento: reminder.dueDate,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowAddModal(false);
    },
  });

  const filteredReminders = reminders?.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'completed') return r.status === 'completed';
    return true;
  }) || [];

  const pendingCount = reminders?.filter(r => r.status === 'pending').length || 0;
  const completedCount = reminders?.filter(r => r.status === 'completed').length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Controles</Text>
          <Text style={styles.subtitle}>Screenings y recordatorios</Text>
        </View>
        <Button
          title="Agregar"
          size="sm"
          icon={<Plus size={16} color={Colors.white} />}
          onPress={() => setShowAddModal(true)}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statValue, { color: Colors.success }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completados</Text>
        </Card>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <FilterTab label="Pendientes" active={filter === 'pending'} onPress={() => setFilter('pending')} />
        <FilterTab label="Completados" active={filter === 'completed'} onPress={() => setFilter('completed')} />
        <FilterTab label="Todos" active={filter === 'all'} onPress={() => setFilter('all')} />
      </View>

      {/* Reminders List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredReminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No hay recordatorios</Text>
            <Text style={styles.emptyText}>
              {filter === 'pending' 
                ? 'No tienes controles pendientes' 
                : filter === 'completed'
                  ? 'No has completado ningún control'
                  : 'Agrega tu primer recordatorio'}
            </Text>
          </View>
        ) : (
          filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onMarkComplete={(id) => markCompleteMutation.mutate(id)}
            />
          ))
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>🚗 Como el service del auto</Text>
          <Text style={styles.infoText}>
            Mantener tus controles al día es como hacerle el service a tu auto. 
            Prevenir siempre es mejor que curar. ¡No te olvides de tus chequeos!
          </Text>
        </Card>
      </ScrollView>

      {/* Add Reminder Modal */}
      <AddReminderModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => addReminderMutation.mutate(data)}
        isLoading={addReminderMutation.isPending}
      />
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

function AddReminderModal({ visible, onClose, onSubmit, isLoading }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'custom' as ReminderCategory,
      frequency: 'once' as ReminderFrequency,
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory>('custom');
  const [selectedFrequency, setSelectedFrequency] = useState<ReminderFrequency>('once');

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      category: selectedCategory,
      frequency: selectedFrequency,
      createdBy: 'patient',
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo recordatorio</Text>
            <Pressable onPress={onClose}>
              <X size={24} color={Colors.gray500} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            <Controller
              control={control}
              name="title"
              rules={{ required: 'Título requerido' }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Título"
                  placeholder="Ej: Laboratorio completo"
                  value={value}
                  onChangeText={onChange}
                  error={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Descripción (opcional)"
                  placeholder="Detalles adicionales..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                />
              )}
            />

            <Text style={styles.inputLabel}>Categoría</Text>
            <View style={styles.optionsGrid}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  style={[
                    styles.optionButton,
                    selectedCategory === cat.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(cat.value)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedCategory === cat.value && styles.optionTextActive,
                  ]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.inputLabel}>Frecuencia</Text>
            <View style={styles.optionsGrid}>
              {FREQUENCIES.map((freq) => (
                <Pressable
                  key={freq.value}
                  style={[
                    styles.optionButton,
                    selectedFrequency === freq.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedFrequency(freq.value)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedFrequency === freq.value && styles.optionTextActive,
                  ]}>
                    {freq.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Controller
              control={control}
              name="dueDate"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Fecha objetivo"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  leftIcon={<Calendar size={20} color={Colors.gray400} />}
                />
              )}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title="Guardar"
              onPress={handleSubmit(handleFormSubmit)}
              loading={isLoading}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
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
    color: Colors.warning,
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
    backgroundColor: Colors.primary,
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
    textAlign: 'center',
  },
  infoCard: {
    padding: Spacing.lg,
    backgroundColor: `${Colors.primary}08`,
    marginTop: Spacing.xl,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.gray700,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  optionButtonActive: {
    backgroundColor: `${Colors.primary}15`,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
});
