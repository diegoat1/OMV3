// Reminder Card Component - Displays screening/control reminders

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Stethoscope,
  TestTube,
  Ruler,
  Syringe,
  Pill,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius, getCategoryColor } from '../../constants/theme';
import { Reminder, ReminderCategory } from '../../models';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReminderCardProps {
  reminder: Reminder;
  onMarkComplete?: (id: string) => void;
  onPress?: () => void;
}

const categoryIcons: Record<ReminderCategory, React.ComponentType<any>> = {
  screening: Stethoscope,
  laboratory: TestTube,
  anthropometric: Ruler,
  consultation: Calendar,
  vaccination: Syringe,
  medication: Pill,
  custom: Clock,
};

const categoryLabels: Record<ReminderCategory, string> = {
  screening: 'Screening',
  laboratory: 'Laboratorio',
  anthropometric: 'Medición',
  consultation: 'Consulta',
  vaccination: 'Vacunación',
  medication: 'Medicación',
  custom: 'Otro',
};

export function ReminderCard({ reminder, onMarkComplete, onPress }: ReminderCardProps) {
  const Icon = categoryIcons[reminder.category] || Clock;
  const color = getCategoryColor(reminder.category);
  const dueDate = parseISO(reminder.dueDate);
  const daysUntil = differenceInDays(dueDate, new Date());
  
  const getStatusInfo = () => {
    if (reminder.status === 'completed') {
      return { label: 'Completado', color: Colors.success, icon: CheckCircle };
    }
    if (daysUntil < 0) {
      return { label: 'Vencido', color: Colors.error, icon: AlertCircle };
    }
    if (daysUntil <= 7) {
      return { label: `En ${daysUntil} días`, color: Colors.warning, icon: Clock };
    }
    return { label: format(dueDate, 'd MMM', { locale: es }), color: Colors.gray500, icon: Calendar };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <Pressable 
      style={[styles.container, reminder.status === 'completed' && styles.containerCompleted]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.category, { color }]}>
            {categoryLabels[reminder.category]}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
            <StatusIcon size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
        
        <Text style={styles.title}>{reminder.title}</Text>
        
        {reminder.description && (
          <Text style={styles.description} numberOfLines={2}>
            {reminder.description}
          </Text>
        )}
      </View>
      
      {reminder.status !== 'completed' && onMarkComplete && (
        <Pressable
          style={styles.completeButton}
          onPress={() => onMarkComplete(reminder.id)}
        >
          <CheckCircle size={24} color={Colors.success} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  containerCompleted: {
    opacity: 0.7,
    backgroundColor: Colors.gray50,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    lineHeight: 18,
  },
  completeButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
});
