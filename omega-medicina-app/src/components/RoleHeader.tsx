// RoleHeader - Global header with role selector visible on all authenticated screens

import { useState, useMemo } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useRole, getRoleDisplayName, getRoleIcon } from '../contexts/RoleContext';
import { useScale } from '../hooks/useScale';
import { ActiveRole } from '../models';

export function RoleHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { activeRole, setActiveRole, canAssumeRole, clearActiveRole } = useRole();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const { s } = useScale();

  // Extract user display name from nombre_apellido field
  const displayName = (user as any)?.nombre_apellido?.split(',')[0]?.trim() || 'Usuario';

  const handleRoleChange = async (role: ActiveRole) => {
    if (!canAssumeRole(role)) return;
    
    await setActiveRole(role);
    setShowRoleModal(false);
    
    switch (role) {
      case 'patient':
        router.replace('/(patient)/home' as any);
        break;
      case 'doctor':
      case 'nutritionist':
      case 'trainer':
        router.replace('/(doctor)/home' as any);
        break;
      case 'admin':
        router.replace('/(admin)/dashboard' as any);
        break;
    }
  };

  const handleLogout = async () => {
    setShowRoleModal(false);
    await clearActiveRole();
    await logout();
    router.replace('/(public)' as any);
  };

  const getRoleColor = (role: ActiveRole | null) => {
    switch (role) {
      case 'patient': return '#0891b2';
      case 'doctor': return '#8b5cf6';
      case 'nutritionist': return '#16a34a';
      case 'trainer': return '#ea580c';
      case 'admin': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const allRoleOptions: { role: ActiveRole; emoji: string; label: string }[] = [
    { role: 'patient', emoji: '💪', label: 'Paciente' },
    { role: 'doctor', emoji: '🩺', label: 'Médico' },
    { role: 'nutritionist', emoji: '🥗', label: 'Nutricionista' },
    { role: 'trainer', emoji: '🏋️', label: 'Entrenador' },
    { role: 'admin', emoji: '⚙️', label: 'Admin' },
  ];
  const roleOptions = allRoleOptions.filter(opt => canAssumeRole(opt.role));

  const roleColor = getRoleColor(activeRole);

  const $ = useMemo(() => ({
    header: {
      flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
      paddingHorizontal: 20 * s, paddingTop: 50, paddingBottom: 14 * s,
      backgroundColor: '#111111', borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    },
    userInfo: { flexDirection: 'row' as const, alignItems: 'center' as const, flex: 1 },
    avatar: {
      width: 38 * s, height: 38 * s, borderRadius: 19 * s,
      justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 12 * s,
    },
    avatarText: { fontSize: 16 * s, fontWeight: '700' as const, color: '#fff' },
    userName: { fontSize: 16 * s, fontWeight: '600' as const, color: '#e2e8f0', flex: 1 },
    roleChip: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      paddingHorizontal: 14 * s, paddingVertical: 8 * s, borderRadius: 22 * s,
      gap: 7 * s, borderWidth: 1,
    },
    roleIcon: { fontSize: 15 * s },
    roleText: { fontSize: 14 * s, fontWeight: '600' as const },
    chevron: { fontSize: 13 * s },
    // Modal
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 * s,
    },
    modalContent: {
      backgroundColor: '#111111', borderRadius: 20 * s, width: '100%' as const,
      maxWidth: 400 * s, borderWidth: 1, borderColor: '#1a1a1a',
    },
    modalHeader: {
      flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
      padding: 20 * s, borderBottomWidth: 1, borderBottomColor: '#1a1a1a',
    },
    modalTitle: { fontSize: 20 * s, fontWeight: '700' as const, color: '#fff' },
    closeBtn: { fontSize: 22 * s, color: '#64748b' },
    roleOptions: { padding: 14 * s, gap: 10 * s },
    roleOption: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      padding: 16 * s, borderRadius: 14 * s, gap: 14 * s, borderWidth: 1, borderColor: '#1a1a1a',
    },
    roleOptionDisabled: { opacity: 0.4 },
    roleEmoji: { fontSize: 22 * s },
    roleOptionText: { flex: 1, fontSize: 16 * s, color: '#e2e8f0' },
    activeIndicator: {
      width: 26 * s, height: 26 * s, borderRadius: 13 * s,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    activeIndicatorText: { color: '#fff', fontSize: 13 * s, fontWeight: '700' as const },
    disabledText: { fontSize: 12 * s, color: '#555' },
    modalDivider: { height: 1, backgroundColor: '#1a1a1a', marginHorizontal: 14 * s },
    logoutButton: {
      flexDirection: 'row' as const, alignItems: 'center' as const, padding: 20 * s, gap: 14 * s,
    },
    logoutEmoji: { fontSize: 20 * s },
    logoutText: { fontSize: 16 * s, color: '#f87171', fontWeight: '600' as const },
  }), [s]);

  return (
    <>
      <View style={$.header}>
        <View style={$.userInfo}>
          <View style={[$.avatar, { backgroundColor: roleColor }]}>
            <Text style={$.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={$.userName} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <Pressable 
          style={[$.roleChip, { backgroundColor: roleColor + '25', borderColor: roleColor + '50' }]}
          onPress={() => setShowRoleModal(true)}
        >
          <Text style={$.roleIcon}>{getRoleIcon(activeRole!)}</Text>
          <Text style={[$.roleText, { color: roleColor }]}>
            {getRoleDisplayName(activeRole!)}
          </Text>
          <Text style={[$.chevron, { color: roleColor }]}>▼</Text>
        </Pressable>
      </View>

      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <Pressable 
          style={$.modalOverlay}
          onPress={() => setShowRoleModal(false)}
        >
          <View style={$.modalContent}>
            <View style={$.modalHeader}>
              <Text style={$.modalTitle}>Cambiar rol</Text>
              <Pressable onPress={() => setShowRoleModal(false)}>
                <Text style={$.closeBtn}>✕</Text>
              </Pressable>
            </View>

            <View style={$.roleOptions}>
              {roleOptions.map((option) => {
                const isActive = activeRole === option.role;
                const optColor = getRoleColor(option.role);
                
                return (
                  <Pressable
                    key={option.role}
                    style={[
                      $.roleOption,
                      isActive && { backgroundColor: optColor + '20', borderColor: optColor },
                    ]}
                    onPress={() => handleRoleChange(option.role)}
                  >
                    <Text style={$.roleEmoji}>{option.emoji}</Text>
                    <Text style={[
                      $.roleOptionText,
                      isActive && { color: optColor, fontWeight: '700' as const },
                    ]}>
                      {option.label}
                    </Text>
                    {isActive && (
                      <View style={[$.activeIndicator, { backgroundColor: optColor }]}>
                        <Text style={$.activeIndicatorText}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={$.modalDivider} />

            <Pressable style={$.logoutButton} onPress={handleLogout}>
              <Text style={$.logoutEmoji}>🚪</Text>
              <Text style={$.logoutText}>Cerrar sesión</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
