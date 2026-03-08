// Index - App entry point with auth check and routing

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useRole } from '../src/contexts/RoleContext';
import { Colors } from '../src/constants/theme';

export default function IndexScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeRole, isRoleSelected, rememberChoice } = useRole();

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Ω</Text>
        </View>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Not authenticated -> go to public home (login/register)
  if (!isAuthenticated) {
    return <Redirect href="/(public)" />;
  }

  // Authenticated but no role selected:
  // If user has multiple roles -> role selector
  // If user has only one role -> auto-select handled by role-selector screen
  if (!isRoleSelected) {
    return <Redirect href="/role-selector" />;
  }

  // Authenticated with role selected -> go to appropriate home
  switch (activeRole) {
    case 'patient':
      return <Redirect href="/(patient)/home" />;
    case 'doctor':
    case 'nutritionist':
    case 'trainer':
      return <Redirect href="/(doctor)/home" />;
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    default:
      return <Redirect href="/role-selector" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.white,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
