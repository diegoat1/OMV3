// Patient Layout - Tab navigator for patient screens

import { Tabs, Redirect } from 'expo-router';
import { Home, ClipboardCheck, Dumbbell, Apple, User, Activity } from 'lucide-react-native';
import { Colors, FontSize } from '../../src/constants/theme';
import { RoleHeader } from '../../src/components/RoleHeader';
import { useRole } from '../../src/contexts/RoleContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PatientLayout() {
  const { activeRole } = useRole();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  // Route protection: must be authenticated with patient role
  if (!isAuthenticated) return <Redirect href="/(public)" />;
  if (activeRole !== 'patient') return <Redirect href="/role-selector" />;

  return (
    <>
      <RoleHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.gray400,
          tabBarStyle: {
            backgroundColor: '#111111',
            borderTopColor: '#1a1a1a',
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
          name="today"
          options={{
            title: 'Hoy',
            tabBarIcon: ({ color, size }) => <ClipboardCheck size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: 'Cuerpo',
            tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="training"
          options={{
            title: 'Entreno',
            tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Nutrición',
            tabBarIcon: ({ color, size }) => <Apple size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
        {/* Hidden screens - accessible but not in tab bar */}
        <Tabs.Screen
          name="dashboard"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="plan"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="reminders"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen name="situation" options={{ href: null }} />
        <Tabs.Screen name="my-foods" options={{ href: null }} />
        <Tabs.Screen name="my-recipes" options={{ href: null }} />
        <Tabs.Screen name="score-detail" options={{ href: null }} />
        <Tabs.Screen name="goals" options={{ href: null }} />
      </Tabs>
    </>
  );
}
