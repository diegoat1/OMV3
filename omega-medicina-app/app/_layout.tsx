// Root Layout - Main app entry point with providers

import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { RoleProvider } from '../src/contexts/RoleContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

function RootLayoutNav() {
  const { permissions } = useAuth();
  
  return (
    <RoleProvider userPermissions={permissions}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f9fafb' },
        }}
      >
        <Stack.Screen name="(public)" />
        <Stack.Screen name="role-selector" />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(doctor)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </RoleProvider>
  );
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
}
