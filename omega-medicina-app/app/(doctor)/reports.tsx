// Doctor Reports Screen - PDF generation and management

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { 
  FileText, 
  Plus, 
  Share2, 
  Download, 
  Calendar,
  User,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card, Button } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { assignmentService } from '../../src/services/api';
// Reports use local PDF generation with patient data from assignments API
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReportsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const doctorId = user?.id || '';

  // TODO FASE 3: Replace with real reports API
  const reports: any[] = [];

  const { data: patients } = useQuery({
    queryKey: ['myPatients'],
    queryFn: () => assignmentService.getMyPatients(),
    select: (res) => {
      const patients = res.data?.patients ?? res.data;
      return (Array.isArray(patients) ? patients : []).map((a: any) => ({
        id: String(a.patient_id),
        name: a.patient_name || `Paciente ${a.patient_id}`,
      }));
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (report: any) => {
      // TODO FASE 3: Implement reports API
      return { success: true, data: report };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const generatePdfHtml = (report: any): string => {
    // Generate HTML content for PDF
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Informe - ${report.patientName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #1f2937;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #0891b2;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #0891b2;
            }
            .subtitle {
              color: #6b7280;
              margin-top: 5px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #0891b2;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: 500;
              width: 150px;
              color: #6b7280;
            }
            .info-value {
              color: #1f2937;
            }
            .score-box {
              background: #f0fdfa;
              border: 1px solid #0891b2;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
            }
            .score-value {
              font-size: 48px;
              font-weight: bold;
              color: #0891b2;
            }
            .score-label {
              color: #6b7280;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
            }
            .signature {
              margin-top: 40px;
              text-align: right;
            }
            .signature-line {
              border-top: 1px solid #1f2937;
              width: 200px;
              margin-left: auto;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Ω Omega Medicina</div>
            <div class="subtitle">Informe de ${report.type === 'consultation' ? 'Consulta' : 'Progreso'}</div>
          </div>

          <div class="section">
            <div class="section-title">Datos del Paciente</div>
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span class="info-value">${report.content.patientInfo?.name || report.patientName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Edad:</span>
              <span class="info-value">${report.content.patientInfo?.age || '--'} años</span>
            </div>
            <div class="info-row">
              <span class="info-label">Sexo:</span>
              <span class="info-value">${report.content.patientInfo?.sex || '--'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha:</span>
              <span class="info-value">${format(new Date(report.generatedAt), "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
          </div>

          ${report.content.healthScore ? `
          <div class="section">
            <div class="section-title">Estado de Salud</div>
            <div class="score-box">
              <div class="score-value">${report.content.healthScore.score}</div>
              <div class="score-label">Health Score</div>
            </div>
          </div>
          ` : ''}

          ${report.content.consultation ? `
          <div class="section">
            <div class="section-title">Consulta</div>
            <div class="info-row">
              <span class="info-label">Motivo:</span>
              <span class="info-value">${report.content.consultation.reason || '--'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Examen:</span>
              <span class="info-value">${report.content.consultation.examination || '--'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Impresiones:</span>
              <span class="info-value">${report.content.consultation.impressions || '--'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Plan:</span>
              <span class="info-value">${report.content.consultation.plan || '--'}</span>
            </div>
          </div>
          ` : ''}

          ${report.content.reminders && report.content.reminders.length > 0 ? `
          <div class="section">
            <div class="section-title">Próximos Controles</div>
            <ul>
              ${report.content.reminders.map((r: any) => `<li>${r.title} - ${r.dueDate}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <div class="signature">
            <div class="signature-line">
              Dr. ${(user as any)?.nombre_apellido || 'Médico'}
            </div>
          </div>

          <div class="footer">
            Generado por Omega Medicina • ${format(new Date(), "dd/MM/yyyy HH:mm")}
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePdf = async (report: any) => {
    try {
      setGeneratingPdf(true);
      const html = generatePdfHtml(report);
      
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Informe - ${report.patientName}`,
        });
      } else {
        Alert.alert('PDF Generado', `Archivo guardado en: ${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el PDF');
      console.error(error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCreateReport = async (patientId: string, patientName: string) => {
    // Get patient data for the report
    // TODO FASE 3: Get real patient data from API
    const patientData = { data: { patient: { name: patientName } } };
    
    const newReport: any = {
      doctorId,
      patientId,
      patientName,
      type: 'progress',
      title: `Informe de progreso - ${format(new Date(), "d MMM yyyy", { locale: es })}`,
      generatedAt: new Date().toISOString(),
      content: {
        patientInfo: {
          name: patientName,
        },
      },
    };

    createReportMutation.mutate(newReport);
    setShowGenerateModal(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Informes</Text>
          <Text style={styles.subtitle}>{reports?.length || 0} informes generados</Text>
        </View>
        <Button
          title="Generar"
          size="sm"
          icon={<Plus size={16} color={Colors.white} />}
          onPress={() => setShowGenerateModal(true)}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {reports?.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Sin informes</Text>
            <Text style={styles.emptyText}>Genera tu primer informe PDF</Text>
            <Button
              title="Generar informe"
              icon={<Plus size={16} color={Colors.white} />}
              onPress={() => setShowGenerateModal(true)}
              style={{ marginTop: Spacing.lg }}
            />
          </View>
        ) : (
          reports?.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onShare={() => handleGeneratePdf(report)}
              isGenerating={generatingPdf}
            />
          ))
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>📄 Informes PDF</Text>
          <Text style={styles.infoText}>
            Los informes incluyen: datos del paciente, Health Score, métricas actuales, 
            plan de tratamiento y próximos controles. Puedes compartirlos directamente 
            con el paciente.
          </Text>
        </Card>
      </ScrollView>

      {/* Generate Modal */}
      <Modal
        visible={showGenerateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generar informe</Text>
              <Pressable onPress={() => setShowGenerateModal(false)}>
                <X size={24} color={Colors.gray500} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Selecciona un paciente:</Text>
              
              {patients?.map((patient) => (
                <Pressable
                  key={patient.id}
                  style={styles.patientOption}
                  onPress={() => handleCreateReport(patient.id!, patient.name!)}
                >
                  <View style={styles.patientAvatar}>
                    <User size={20} color={Colors.gray500} />
                  </View>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <ChevronRight size={20} color={Colors.gray400} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ReportCard({ report, onShare, isGenerating }: { 
  report: any; 
  onShare: () => void;
  isGenerating: boolean;
}) {
  const typeLabels: Record<string, string> = {
    consultation: 'Consulta',
    progress: 'Progreso',
    plan: 'Plan',
    summary: 'Resumen',
  };

  return (
    <Card style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIcon}>
          <FileText size={24} color={Colors.secondary} />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportMeta}>
            {report.patientName} • {typeLabels[report.type] || report.type}
          </Text>
        </View>
      </View>

      <View style={styles.reportFooter}>
        <View style={styles.reportDate}>
          <Calendar size={14} color={Colors.gray500} />
          <Text style={styles.reportDateText}>
            {format(new Date(report.generatedAt), "d MMM yyyy, HH:mm", { locale: es })}
          </Text>
        </View>
        
        <View style={styles.reportActions}>
          <Button
            title="Compartir"
            size="sm"
            variant="outline"
            icon={<Share2 size={14} color={Colors.primary} />}
            onPress={onShare}
            loading={isGenerating}
          />
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
  reportCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${Colors.secondary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  reportMeta: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  reportDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reportDateText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  reportActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoCard: {
    padding: Spacing.lg,
    backgroundColor: `${Colors.secondary}08`,
    marginTop: Spacing.lg,
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.gray600,
    marginBottom: Spacing.lg,
  },
  patientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  patientName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
});
