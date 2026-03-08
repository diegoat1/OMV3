// Role Selector Screen - Choose which role to use after login

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, Pressable, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useRole } from '../src/contexts/RoleContext';
import { ActiveRole } from '../src/models';
import { useScale } from '../src/hooks/useScale';

const logoWhite = require('../assets/logo-white.png');

interface RoleOption {
  role: ActiveRole;
  emoji: string;
  title: string;
  description: string;
  accent: string;
  borderColor: string;
}

const ALL_ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'patient',
    emoji: '💪',
    title: 'Paciente',
    description: 'Registrá métricas, seguí tu plan y revisá tu progreso',
    accent: '#0891b2',
    borderColor: '#0891b2',
  },
  {
    role: 'doctor',
    emoji: '🩺',
    title: 'Médico',
    description: 'Gestioná pacientes, turnos y registros médicos',
    accent: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  {
    role: 'nutritionist',
    emoji: '🥗',
    title: 'Nutricionista',
    description: 'Planes nutricionales, dietas y seguimiento alimentario',
    accent: '#16a34a',
    borderColor: '#16a34a',
  },
  {
    role: 'trainer',
    emoji: '🏋️',
    title: 'Entrenador',
    description: 'Rutinas de entrenamiento, ejercicios y progreso físico',
    accent: '#ea580c',
    borderColor: '#ea580c',
  },
  {
    role: 'admin',
    emoji: '⚙️',
    title: 'Administrador',
    description: 'Gestioná usuarios, permisos y configuración',
    accent: '#f59e0b',
    borderColor: '#f59e0b',
  },
];

function navigateToRole(router: any, role: ActiveRole) {
  switch (role) {
    case 'patient':
      router.replace('/(patient)/home');
      break;
    case 'doctor':
    case 'nutritionist':
    case 'trainer':
      router.replace('/(doctor)/home');
      break;
    case 'admin':
      router.replace('/(admin)/dashboard');
      break;
  }
}

export default function RoleSelectorScreen() {
  const router = useRouter();
  const { s, isWide } = useScale();
  const { user, permissions } = useAuth();
  const { setActiveRole, setRememberChoice, rememberChoice, canAssumeRole } = useRole();
  const [selectedRole, setSelectedRole] = useState<ActiveRole | null>(null);
  const [remember, setRemember] = useState(rememberChoice);
  const autoNavigated = useRef(false);

  // Filter to only show roles the user can assume
  const availableRoles = useMemo(
    () => ALL_ROLE_OPTIONS.filter(opt => canAssumeRole(opt.role)),
    [canAssumeRole]
  );

  // Auto-navigate if only 1 role is available
  useEffect(() => {
    if (autoNavigated.current) return;
    if (availableRoles.length === 1) {
      autoNavigated.current = true;
      const onlyRole = availableRoles[0].role;
      (async () => {
        await setActiveRole(onlyRole);
        navigateToRole(router, onlyRole);
      })();
    }
  }, [availableRoles, setActiveRole, router]);

  const handleSelectRole = async (role: ActiveRole) => {
    if (!canAssumeRole(role)) return;
    
    setSelectedRole(role);
    await setActiveRole(role);
    await setRememberChoice(remember);
    navigateToRole(router, role);
  };

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center' as const, alignItems: 'center' as const },
    content: {
      width: '100%' as const, paddingHorizontal: 28 * s, justifyContent: 'center' as const,
      ...(isWide ? { maxWidth: 520 * s } : {}),
    },
    header: { alignItems: 'center' as const, marginBottom: 32 * s },
    logo: {
      width: 48 * s, height: 48 * s, borderRadius: 14 * s,
      backgroundColor: '#d65151', justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 12 * s,
    },
    logoImg: { width: 34 * s, height: 34 * s },
    greeting: { fontSize: 15 * s, color: '#94a3b8', marginBottom: 4 * s },
    title: { fontSize: 22 * s, fontWeight: '800' as const, color: '#fff', textAlign: 'center' as const },
    roles: { gap: 12 * s, marginBottom: 20 * s },
    roleCard: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      backgroundColor: '#111111', borderRadius: 16 * s, padding: 16 * s,
      borderWidth: 2, borderColor: '#1a1a1a',
    },
    roleCardDisabled: { opacity: 0.4 },
    roleEmoji: { fontSize: 28 * s, marginRight: 14 * s },
    lockEmoji: { fontSize: 24 * s, marginRight: 14 * s },
    roleInfo: { flex: 1 },
    roleTitle: { fontSize: 16 * s, fontWeight: '700' as const, color: '#fff', marginBottom: 2 * s },
    roleDesc: { fontSize: 13 * s, color: '#94a3b8', lineHeight: 18 * s },
    roleTextDisabled: { color: '#444' },
    selectedBadge: {
      width: 26 * s, height: 26 * s, borderRadius: 13 * s,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    selectedBadgeText: { color: '#fff', fontSize: 14 * s, fontWeight: '700' as const },
    rememberRow: {
      flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
      backgroundColor: '#111111', borderRadius: 14 * s, padding: 16 * s,
      borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 16 * s,
    },
    rememberText: { fontSize: 14 * s, color: '#e2e8f0' },
    info: { fontSize: 12 * s, color: '#64748b', textAlign: 'center' as const },
  }), [s, isWide]);

  return (
    <View style={$.container}>
      <View style={$.content}>
        <View style={$.header}>
          <View style={$.logo}>
            <Image source={logoWhite} style={$.logoImg} resizeMode="contain" />
          </View>
          <Text style={$.greeting}>Hola, {(user as any)?.nombre_apellido?.split(',')[0]?.trim() || 'Usuario'}</Text>
          <Text style={$.title}>¿Con qué rol querés entrar?</Text>
        </View>

        <View style={$.roles}>
          {availableRoles.map((option) => {
            const isSelected = selectedRole === option.role;
            
            return (
              <Pressable
                key={option.role}
                style={[
                  $.roleCard,
                  isSelected && { borderColor: option.borderColor },
                ]}
                onPress={() => handleSelectRole(option.role)}
              >
                <Text style={$.roleEmoji}>{option.emoji}</Text>
                
                <View style={$.roleInfo}>
                  <Text style={$.roleTitle}>{option.title}</Text>
                  <Text style={$.roleDesc}>{option.description}</Text>
                </View>
                
                {isSelected && (
                  <View style={[$.selectedBadge, { backgroundColor: option.accent }]}>
                    <Text style={$.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={$.rememberRow}>
          <Text style={$.rememberText}>Recordar mi elección</Text>
          <Switch
            value={remember}
            onValueChange={setRemember}
            trackColor={{ false: '#2a2a2a', true: '#d6515180' }}
            thumbColor={remember ? '#d65151' : '#555'}
          />
        </View>

        <Text style={$.info}>
          Podés cambiar de rol en cualquier momento desde el menú superior.
        </Text>
      </View>
    </View>
  );
}
