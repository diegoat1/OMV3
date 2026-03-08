// Patient Home - Intent selector screen (What do you want to do?)

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, Dumbbell, Apple, TrendingUp, ChevronRight, CalendarDays } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '../../src/constants/theme';
import { useHealthScore } from '../../src/hooks';
import { BuildBanner } from '../../src/components/ui';
import { assignmentService } from '../../src/services/api';

interface PendingAssignment {
  id: number;
  specialist_id: number;
  specialist_name: string;
  specialist_role: string;
  created_at: string;
}

interface IntentCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  route: string;
  color: string;
  bgColor: string;
}

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { score: coreHealthScore, semaphoreColor, hasData } = useHealthScore();
  const [pendingRequests, setPendingRequests] = useState<PendingAssignment[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadPending = useCallback(async () => {
    try {
      const res = await assignmentService.getPendingForPatient();
      const data = (res as any)?.data || res;
      const pending = data?.pending || data || [];
      setPendingRequests(Array.isArray(pending) ? pending : []);
    } catch {}
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleAccept = async (id: number) => {
    setActionLoading(id);
    try { await assignmentService.acceptAssignment(id); } catch {}
    await loadPending();
    setActionLoading(null);
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try { await assignmentService.rejectAssignment(id); } catch {}
    await loadPending();
    setActionLoading(null);
  };

  const roleLabel = (r: string) => {
    switch (r) { case 'doctor': return 'Médico'; case 'nutricionista': return 'Nutricionista'; case 'entrenador': return 'Entrenador'; default: return r; }
  };
  const roleEmoji = (r: string) => {
    switch (r) { case 'doctor': return '👨‍⚕️'; case 'nutricionista': return '🥗'; case 'entrenador': return '💪'; default: return '👤'; }
  };

  const intentCards: IntentCard[] = [
    {
      id: 'situation',
      icon: <Activity size={32} color={Colors.primary} />,
      title: 'Ver mi situación actual',
      subtitle: 'Resumen de salud, métricas y recomendaciones',
      route: '/(patient)/situation',
      color: Colors.primary,
      bgColor: '#0c4a6e',
    },
    {
      id: 'training',
      icon: <Dumbbell size={32} color={Colors.secondary} />,
      title: 'Quiero entrenar',
      subtitle: 'Tracker, rutinas y análisis de calidad',
      route: '/(patient)/training',
      color: Colors.secondary,
      bgColor: '#3b0764',
    },
    {
      id: 'nutrition',
      icon: <Apple size={32} color={Colors.success} />,
      title: 'Quiero nutrición',
      subtitle: 'Tracker, plan alimentario y calidad de dieta',
      route: '/(patient)/nutrition',
      color: Colors.success,
      bgColor: '#064e3b',
    },
    {
      id: 'appointment',
      icon: <CalendarDays size={32} color={Colors.warning} />,
      title: 'Programar turno',
      subtitle: 'Agendar una visita con tu m\u00e9dico',
      route: '/(patient)/reminders',
      color: Colors.warning,
      bgColor: '#78350f',
    },
  ];

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {/* Build Banner - Siempre visible arriba */}
      <BuildBanner />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hola, {(user?.nombre_apellido?.includes(',') ? user.nombre_apellido.split(',')[1]?.trim().split(' ')[0] : user?.nombre_apellido?.split(' ')[0]) || 'Usuario'} 👋
        </Text>
        <Text style={styles.question}>¿Qué querés hacer hoy?</Text>
      </View>

      {/* Pending specialist requests */}
      {pendingRequests.length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingSectionTitle}>📩 Solicitudes de profesionales</Text>
          {pendingRequests.map(req => (
            <View key={req.id} style={styles.pendingCard}>
              <View style={styles.pendingCardHeader}>
                <Text style={styles.pendingEmoji}>{roleEmoji(req.specialist_role)}</Text>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingName}>{req.specialist_name}</Text>
                  <Text style={styles.pendingRole}>{roleLabel(req.specialist_role)}</Text>
                </View>
              </View>
              <Text style={styles.pendingDesc}>
                Quiere ser tu {roleLabel(req.specialist_role).toLowerCase()} asignado
              </Text>
              <View style={styles.pendingBtns}>
                <Pressable
                  style={styles.rejectBtn}
                  onPress={() => handleReject(req.id)}
                  disabled={actionLoading === req.id}
                >
                  <Text style={styles.rejectBtnText}>Rechazar</Text>
                </Pressable>
                <Pressable
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(req.id)}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.acceptBtnText}>Aceptar</Text>
                  }
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Health Score */}
      <Pressable 
        style={styles.healthScoreCard}
        onPress={() => handleNavigate('/(patient)/situation')}
      >
        <View style={styles.healthScoreLeft}>
          <Text style={styles.healthScoreLabel}>Tu Health Score</Text>
          {hasData ? (
            <View style={styles.healthScoreRow}>
              <Text style={styles.healthScoreValue}>{coreHealthScore.score}</Text>
              <View style={[
                styles.trendBadge,
                { backgroundColor: coreHealthScore.status === 'optimal' ? Colors.successLight + '30' : Colors.warningLight + '30' }
              ]}>
                <TrendingUp 
                  size={14} 
                  color={coreHealthScore.status === 'optimal' ? Colors.success : Colors.warning}
                />
                <Text style={[
                  styles.trendText,
                  { color: coreHealthScore.status === 'optimal' ? Colors.success : Colors.warning }
                ]}>
                  {coreHealthScore.category}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 4 }}>
              En desarrollo - Registra datos para ver tu score
            </Text>
          )}
        </View>
        <ChevronRight size={24} color={Colors.gray400} />
      </Pressable>

      {/* Intent Cards */}
      <View style={styles.intentContainer}>
        {intentCards.map((card) => (
          <Pressable
            key={card.id}
            style={styles.intentCard}
            onPress={() => handleNavigate(card.route)}
          >
            <View style={[styles.intentIconContainer, { backgroundColor: card.bgColor }]}>
              {card.icon}
            </View>
            <View style={styles.intentInfo}>
              <Text style={styles.intentTitle}>{card.title}</Text>
              <Text style={styles.intentSubtitle}>{card.subtitle}</Text>
            </View>
            <ChevronRight size={24} color={Colors.gray400} />
          </Pressable>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.quickActionsRow}>
          <Pressable 
            style={styles.quickActionButton}
            onPress={() => handleNavigate('/(patient)/health')}
          >
            <Text style={styles.quickActionEmoji}>⚖️</Text>
            <Text style={styles.quickActionText}>Registrar peso</Text>
          </Pressable>
          <Pressable 
            style={styles.quickActionButton}
            onPress={() => handleNavigate('/(patient)/training')}
          >
            <Text style={styles.quickActionEmoji}>💪</Text>
            <Text style={styles.quickActionText}>Log entreno</Text>
          </Pressable>
          <Pressable 
            style={styles.quickActionButton}
            onPress={() => handleNavigate('/(patient)/nutrition')}
          >
            <Text style={styles.quickActionEmoji}>🥗</Text>
            <Text style={styles.quickActionText}>Log comida</Text>
          </Pressable>
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
    padding: Spacing.xl,
    paddingTop: 20,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  greeting: {
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  question: {
    fontSize: FontSize.display,
    fontWeight: '700',
    color: Colors.text,
  },
  healthScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  healthScoreLeft: {
    flex: 1,
  },
  healthScoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  healthScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  healthScoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  trendText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  intentContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  intentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  intentInfo: {
    flex: 1,
  },
  intentTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  intentSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  quickActionsSection: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Pending specialist requests
  pendingSection: {
    marginBottom: Spacing.xl,
  },
  pendingSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  pendingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pendingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pendingEmoji: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  pendingRole: {
    fontSize: FontSize.sm,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  pendingDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  pendingBtns: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: FontSize.sm,
    color: '#fff',
    fontWeight: '700',
  },
});
