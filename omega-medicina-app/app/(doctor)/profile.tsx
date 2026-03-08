// Doctor Profile Screen - Personal data and settings

import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  Award,
  Building,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card, Button } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Estás seguro que deseas cerrar sesión?')) {
        await logout();
        router.replace('/');
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert(
        'Cerrar sesión',
        '¿Estás seguro que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Cerrar sesión', 
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {(user?.nombre_apellido || 'D').charAt(0).toUpperCase()}
            </Text>
            <View style={styles.doctorBadge}>
              <Text style={styles.doctorBadgeText}>👨‍⚕️</Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.nombre_apellido || 'Profesional'}</Text>
          <Text style={styles.specialty}>{user?.rol || 'Profesional'}</Text>
        </View>

        {/* Professional Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información profesional</Text>
          
          <InfoRow icon={<Mail size={20} color={Colors.gray500} />} label="Email" value={user?.email || '--'} />
          <InfoRow icon={<Phone size={20} color={Colors.gray500} />} label="Teléfono" value={user?.telefono || '--'} />
          <InfoRow icon={<Award size={20} color={Colors.gray500} />} label="DNI" value={user?.dni || '--'} />
          <InfoRow icon={<Building size={20} color={Colors.gray500} />} label="Rol" value={user?.rol || '--'} />
        </Card>

        {/* Settings */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <MenuItem
            icon={<Bell size={20} color={Colors.secondary} />}
            label="Notificaciones"
            subtitle="Alertas de turnos y pacientes"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Settings size={20} color={Colors.secondary} />}
            label="Preferencias"
            subtitle="Horarios, duración de turnos"
            onPress={() => {}}
          />
        </Card>

        {/* Support */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          
          <MenuItem
            icon={<HelpCircle size={20} color={Colors.primary} />}
            label="Ayuda"
            subtitle="Guía de uso y FAQ"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Shield size={20} color={Colors.primary} />}
            label="Privacidad"
            subtitle="Política de datos (GDPR)"
            onPress={() => {}}
          />
        </Card>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            <StatItem label="Pacientes" value="5" />
            <StatItem label="Consultas" value="12" />
            <StatItem label="Informes" value="3" />
            <StatItem label="Plantillas" value="3" />
          </View>
        </Card>

        {/* Logout */}
        <View style={styles.actionsSection}>
          <Button
            title="Cerrar sesión"
            variant="ghost"
            fullWidth
            icon={<LogOut size={18} color={Colors.error} />}
            textStyle={{ color: Colors.error }}
            onPress={handleLogout}
          />
        </View>

        {/* Version */}
        <Text style={styles.version}>Omega Medicina v1.0.0</Text>
        <Text style={styles.modeText}>API v3 - Profesional</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      {icon}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuItem({ icon, label, subtitle, onPress }: { 
  icon: React.ReactNode; 
  label: string; 
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Card style={styles.menuItem} onPress={onPress} variant="outlined" padding="sm">
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemIcon}>{icon}</View>
        <View style={styles.menuItemText}>
          <Text style={styles.menuItemLabel}>{label}</Text>
          <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={20} color={Colors.gray400} />
      </View>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  doctorBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  doctorBadgeText: {
    fontSize: 14,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  specialty: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    marginTop: 2,
  },
  section: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    marginTop: 2,
  },
  menuItem: {
    marginBottom: Spacing.sm,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.secondary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  menuItemLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  menuItemSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  statsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  actionsSection: {
    marginTop: Spacing.lg,
  },
  version: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  modeText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
