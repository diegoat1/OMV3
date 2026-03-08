// Admin Layout - Tab navigator with dark footer

import { Tabs, Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { RoleHeader } from '../../src/components/RoleHeader';
import { useScale } from '../../src/hooks/useScale';
import { useRole } from '../../src/contexts/RoleContext';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminLayout() {
  const { s } = useScale();
  const { activeRole } = useRole();
  const { isAuthenticated, permissions } = useAuth();

  // Route protection: must be authenticated with admin role
  if (!isAuthenticated) return <Redirect href="/(public)" />;
  if (activeRole !== 'admin' || !permissions.canBeAdmin) return <Redirect href="/role-selector" />;

  return (
    <>
      <RoleHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111111',
            borderTopColor: '#1a1a1a',
            borderTopWidth: 1,
            height: 62 * s,
            paddingBottom: 8 * s,
            paddingTop: 6 * s,
          },
          tabBarActiveTintColor: '#d65151',
          tabBarInactiveTintColor: '#64748b',
          tabBarLabelStyle: {
            fontSize: 10 * s,
            fontWeight: '600',
          },
          sceneStyle: { backgroundColor: '#0a0a0a' },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Panel',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 * s, color }}>📊</Text>,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'Usuarios',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 * s, color }}>👥</Text>,
          }}
        />
        <Tabs.Screen
          name="permissions"
          options={{
            title: 'Permisos',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 * s, color }}>🔐</Text>,
          }}
        />
        <Tabs.Screen
          name="import-legacy"
          options={{
            title: 'Base Datos',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 * s, color }}>🗄️</Text>,
          }}
        />
        <Tabs.Screen
          name="audit"
          options={{
            title: 'Auditoría',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 * s, color }}>📋</Text>,
          }}
        />
        {/* Hide screens that are now merged into dashboard */}
        <Tabs.Screen name="patients" options={{ href: null }} />
      </Tabs>
    </>
  );
}
