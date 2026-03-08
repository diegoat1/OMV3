// Doctor Layout - Tab navigator for doctor screens

import { Tabs, Redirect } from 'expo-router';
import { Home, Calendar, Users, ClipboardList, User } from 'lucide-react-native';
import { Colors, FontSize } from '../../src/constants/theme';
import { RoleHeader } from '../../src/components/RoleHeader';
import { useRole } from '../../src/contexts/RoleContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DoctorLayout() {
  const { activeRole } = useRole();
  const { isAuthenticated, permissions } = useAuth();

  // Route protection: must be authenticated with a professional role
  if (!isAuthenticated) return <Redirect href="/(public)" />;
  const allowedRoles = ['doctor', 'nutritionist', 'trainer'] as const;
  if (!activeRole || !allowedRoles.includes(activeRole as any) || !permissions.canBeDoctor && !permissions.canBeNutritionist && !permissions.canBeTrainer) {
    return <Redirect href="/role-selector" />;
  }

  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <>
      <RoleHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.secondary,
          tabBarInactiveTintColor: Colors.gray400,
          tabBarStyle: {
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
            paddingTop: 8,
            paddingBottom: bottomInset,
            height: 57 + bottomInset,
          },
          tabBarLabelStyle: {
            fontSize: FontSize.xs,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Turnos',
            tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Pacientes',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: 'Registros',
            tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        {/* Hidden screens */}
        <Tabs.Screen
          name="templates"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="reports"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="create-patient"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="patient-measures"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="patient-goals"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="patient-analytics"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="patient-nutrition"
          options={{ href: null }}
        />
      </Tabs>
    </>
  );
}
