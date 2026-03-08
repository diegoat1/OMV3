// Doctor Templates Screen - Manage plan and reminder templates

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Apple, 
  Dumbbell, 
  Bell, 
  FileText, 
  Plus, 
  ChevronRight,
  Copy,
  Trash2,
  X,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card, Button } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { telemedicineService } from '../../src/services/api';
import type { Template } from '../../src/services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const templateIcons: Record<string, React.ComponentType<any>> = {
  nutrition: Apple,
  training: Dumbbell,
  reminder: Bell,
  consultation: FileText,
};

const templateColors: Record<string, string> = {
  nutrition: Colors.success,
  training: Colors.primary,
  reminder: Colors.warning,
  consultation: Colors.secondary,
};

const templateLabels: Record<string, string> = {
  nutrition: 'Nutrición',
  training: 'Entrenamiento',
  reminder: 'Recordatorios',
  consultation: 'Consulta',
};

export default function TemplatesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('nutrition');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const res = await telemedicineService.getTemplates();
      const d = (res as any)?.data || res;
      return d?.templates || [];
    },
  });

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await telemedicineService.createTemplate({ name: newName.trim(), type: newType, description: newDesc });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } catch { Alert.alert('Error', 'No se pudo crear la plantilla'); }
    setSaving(false);
  }, [newName, newType, newDesc, queryClient]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await telemedicineService.deleteTemplate(id);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    } catch {}
  }, [queryClient]);

  const groupedTemplates = (templates as Template[]).reduce((acc: Record<string, Template[]>, template) => {
    if (!acc[template.type]) acc[template.type] = [];
    acc[template.type].push(template);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Plantillas</Text>
          <Text style={styles.subtitle}>Planes y recordatorios predefinidos</Text>
        </View>
        <Button
          title="Nueva"
          size="sm"
          icon={<Plus size={16} color={Colors.white} />}
          onPress={() => setShowCreate(true)}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionCard
            icon={<Apple size={24} color={Colors.success} />}
            label="Plan nutricional"
            color={Colors.success}
            onPress={() => { setNewType('nutrition'); setShowCreate(true); }}
          />
          <QuickActionCard
            icon={<Dumbbell size={24} color={Colors.primary} />}
            label="Plan de entreno"
            color={Colors.primary}
            onPress={() => { setNewType('training'); setShowCreate(true); }}
          />
          <QuickActionCard
            icon={<Bell size={24} color={Colors.warning} />}
            label="Recordatorios"
            color={Colors.warning}
            onPress={() => { setNewType('reminder'); setShowCreate(true); }}
          />
        </View>

        {isLoading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />}

        {/* Templates by Type */}
        {Object.entries(groupedTemplates).map(([type, typeTemplates]) => (
          <View key={type} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                {(() => {
                  const Icon = templateIcons[type] || FileText;
                  return <Icon size={20} color={templateColors[type] || Colors.gray500} />;
                })()}
                <Text style={styles.sectionTitle}>{templateLabels[type] || type}</Text>
              </View>
              <Text style={styles.sectionCount}>{typeTemplates.length}</Text>
            </View>

            {typeTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} onDelete={handleDelete} />
            ))}
          </View>
        ))}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Usa plantillas para ahorrar tiempo</Text>
          <Text style={styles.infoText}>
            Crea plantillas de planes nutricionales, rutinas de entrenamiento y 
            recordatorios preventivos. Luego asígnalas rápidamente a tus pacientes.
          </Text>
        </Card>

        {/* Create Modal */}
        <Modal visible={showCreate} transparent animationType="slide">
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nueva Plantilla</Text>
                <Pressable onPress={() => setShowCreate(false)}><X size={24} color={Colors.gray500} /></Pressable>
              </View>
              <Text style={styles.modalLabel}>Nombre</Text>
              <TextInput style={styles.modalInput} value={newName} onChangeText={setNewName} placeholder="Nombre de la plantilla" />
              <Text style={styles.modalLabel}>Tipo</Text>
              <View style={styles.typeRow}>
                {(['nutrition', 'training', 'reminder', 'consultation'] as const).map(t => (
                  <Pressable key={t} style={[styles.typeBtn, newType === t && styles.typeBtnActive]} onPress={() => setNewType(t)}>
                    <Text style={[styles.typeBtnText, newType === t && styles.typeBtnTextActive]}>{templateLabels[t]}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.modalLabel}>Descripción</Text>
              <TextInput style={[styles.modalInput, { height: 60 }]} value={newDesc} onChangeText={setNewDesc} placeholder="Descripción opcional" multiline />
              <Button title={saving ? 'Guardando...' : 'Crear'} onPress={handleCreate} fullWidth disabled={saving || !newName.trim()} />
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionCard({ icon, label, color, onPress }: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
      <Plus size={16} color={Colors.gray400} />
    </Pressable>
  );
}

function TemplateCard({ template, onDelete }: { template: Template; onDelete: (id: number) => void }) {
  const Icon = templateIcons[template.type] || FileText;
  const color = templateColors[template.type] || Colors.gray500;

  return (
    <Card style={styles.templateCard}>
      <View style={styles.templateRow}>
        <View style={[styles.templateIcon, { backgroundColor: `${color}15` }]}>
          <Icon size={20} color={color} />
        </View>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateDate}>
            {template.updated_at
              ? `Actualizado: ${format(new Date(template.updated_at), "d MMM yyyy", { locale: es })}`
              : template.description || ''}
          </Text>
        </View>
        <View style={styles.templateActions}>
          <Pressable style={styles.copyButton} onPress={() => onDelete(template.id)}>
            <Trash2 size={18} color={Colors.error} />
          </Pressable>
          <ChevronRight size={20} color={Colors.gray400} />
        </View>
      </View>
    </Card>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.xxxl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  templateCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  templateDate: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  copyButton: {
    padding: Spacing.sm,
  },
  infoCard: {
    padding: Spacing.lg,
    backgroundColor: `${Colors.secondary}08`,
    marginTop: Spacing.md,
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
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  modalLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  typeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  typeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  typeBtnText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  typeBtnTextActive: {
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },
});
