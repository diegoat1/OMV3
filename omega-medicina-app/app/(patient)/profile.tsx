// Patient Profile Screen - Personal data and settings

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
  Calendar,
  Ruler,
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Card, Button } from '../../src/components/ui';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProfileScreen() {
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

  // Use real user fields from auth API (nombre_apellido, telefono, etc.)
  const u = user as any;
  const rawName = u?.nombre_apellido || u?.name || 'Usuario';
  // Convert 'Apellido, Nombre' format to 'Nombre Apellido'
  const displayName = rawName.includes(',')
    ? `${rawName.split(',')[1]?.trim()} ${rawName.split(',')[0]?.trim()}`
    : rawName;
  const telefono = u?.telefono || '--';
  const fechaNac = u?.fecha_nacimiento;
  const altura = u?.altura;
  const sexo = u?.sexo;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {u?.is_admin && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Administrador</Text>
            </View>
          )}
        </View>

        {/* Personal Info */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Información personal</Text>
          
          <InfoRow icon={<Mail size={20} color={Colors.gray500} />} label="Email" value={user?.email || '--'} />
          <InfoRow icon={<Phone size={20} color={Colors.gray500} />} label="Teléfono" value={telefono} />
          <InfoRow 
            icon={<Calendar size={20} color={Colors.gray500} />} 
            label="Fecha de nacimiento" 
            value={fechaNac ? format(new Date(fechaNac), "d 'de' MMMM, yyyy", { locale: es }) : '--'} 
          />
          <InfoRow icon={<Ruler size={20} color={Colors.gray500} />} label="Altura" value={altura ? `${altura} cm` : '--'} />
          <InfoRow icon={<User size={20} color={Colors.gray500} />} label="Sexo" value={sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Femenino' : '--'} />
        </Card>

        {/* Preferences */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          
          <MenuItem
            icon={<Bell size={20} color={Colors.primary} />}
            label="Notificaciones"
            subtitle="Recordatorios y alertas"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Settings size={20} color={Colors.primary} />}
            label="Unidades"
            subtitle="Sistema métrico"
            onPress={() => {}}
          />
        </Card>

        {/* Support */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          
          <MenuItem
            icon={<HelpCircle size={20} color={Colors.secondary} />}
            label="Ayuda"
            subtitle="Preguntas frecuentes"
            onPress={() => {}}
          />
          <MenuItem
            icon={<Shield size={20} color={Colors.secondary} />}
            label="Privacidad"
            subtitle="Política de datos (GDPR)"
            onPress={() => {}}
          />
        </Card>

        {/* Export & Logout */}
        <View style={styles.actionsSection}>
          <Button
            title="Exportar mis datos"
            variant="outline"
            fullWidth
            onPress={() => {}}
          />
          
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

function GoalItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.goalItem}>
      <Text style={styles.goalValue}>{value}</Text>
      <Text style={styles.goalLabel}>{label}</Text>
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  email: {
    fontSize: FontSize.md,
    color: Colors.gray500,
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
    borderBottomColor: Colors.gray100,
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
    backgroundColor: `${Colors.primary}10`,
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
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  goalItem: {
    width: '47%',
    padding: Spacing.md,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
  },
  goalValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  goalLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  actionsSection: {
    gap: Spacing.md,
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
    color: Colors.warning,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  roleBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.md,
  },
  roleBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.error,
  },
});
