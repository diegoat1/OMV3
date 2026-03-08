// Task Item Component - Checkbox task for daily checklist

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Check, Circle, Dumbbell, Scale, Droplets, Apple, Pill, Activity } from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { DailyTask, TaskType } from '../../models';

interface TaskItemProps {
  task: DailyTask;
  onToggle: (taskId: string, completed: boolean) => void;
}

const taskIcons: Record<TaskType, React.ComponentType<any>> = {
  weight: Scale,
  measurement: Activity,
  exercise: Dumbbell,
  mobility: Activity,
  water: Droplets,
  medication: Pill,
  nutrition: Apple,
  custom: Circle,
};

const taskColors: Record<TaskType, string> = {
  weight: Colors.primary,
  measurement: Colors.secondary,
  exercise: Colors.success,
  mobility: Colors.warning,
  water: '#3b82f6',
  medication: Colors.error,
  nutrition: '#10b981',
  custom: Colors.gray500,
};

export function TaskItem({ task, onToggle }: TaskItemProps) {
  const Icon = taskIcons[task.type] || Circle;
  const color = taskColors[task.type] || Colors.gray500;

  return (
    <Pressable
      style={[styles.container, task.completed && styles.containerCompleted]}
      onPress={() => onToggle(task.id, !task.completed)}
    >
      <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
        {task.completed && <Check size={14} color={Colors.white} strokeWidth={3} />}
      </View>
      
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={18} color={color} />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, task.completed && styles.titleCompleted]}>
          {task.title}
        </Text>
        {task.description && (
          <Text style={styles.description}>{task.description}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  containerCompleted: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.text,
  },
  titleCompleted: {
    color: Colors.gray400,
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
});
