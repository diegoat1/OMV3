// Admin Dashboard - Real data from auth.db, dark theme

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useScale } from '../../src/hooks/useScale';
import { adminService } from '../../src/services/api';
import type { DashboardStats, AdminUser, AuditEntry } from '../../src/services/api/adminService';

export default function AdminDashboardScreen() {
  const { s, isWide } = useScale();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, usersRes, pendingRes, auditRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAuthUsers(),
        adminService.getPendingUsers(),
        adminService.getAuditLog(10),
      ]);
      const s1 = (statsRes as any)?.data || statsRes;
      const u1 = (usersRes as any)?.data || usersRes;
      const p1 = (pendingRes as any)?.data || pendingRes;
      const a1 = (auditRes as any)?.data || auditRes;
      if (s1.success !== false) setStats(s1.data || s1);
      if (u1.success !== false) setUsers(u1.data?.users || u1.users || []);
      if (p1.success !== false) setPendingUsers(p1.data?.users || p1.users || []);
      if (a1.success !== false) setAudit(a1.data?.entries || a1.entries || []);
    } catch (e) {
      console.error('Admin load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try { await adminService.approveUser(userId); } catch {}
    await loadData();
    setActionLoading(null);
  };

  const handleReject = async (userId: number) => {
    setActionLoading(userId);
    try { await adminService.rejectUser(userId); } catch {}
    await loadData();
    setActionLoading(null);
  };

  const handleToggleActive = async (userId: number) => {
    setActionLoading(userId);
    try { await adminService.toggleActive(userId); } catch {}
    await loadData();
    setActionLoading(null);
  };

  const handleRoleToggle = async (userId: number, role: string) => {
    setActionLoading(userId);
    try { await adminService.updateRole(userId, role); } catch {}
    await loadData();
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const userId = deleteConfirm.id;
    setDeleteConfirm(null);
    setActionLoading(userId);
    try { await adminService.deleteUser(userId); } catch {}
    await loadData();
    setActionLoading(null);
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.display_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.patient_dni.includes(q)
    );
  }, [users, search]);

  const userRoles = (roleStr: string) => (roleStr || 'user').split(',').map(r => r.trim()).filter(Boolean);

  const roleLabel = (r: string) => {
    switch (r) {
      case 'admin': return '⚙️ Admin';
      case 'doctor': return '🩺 Médico';
      case 'nutricionista': return '🥗 Nutricionista';
      case 'entrenador': return '🏋️ Entrenador';
      default: return '👤 Paciente';
    }
  };
  const roleColor = (r: string) => {
    switch (r) {
      case 'admin': return '#f59e0b';
      case 'doctor': return '#8b5cf6';
      case 'nutricionista': return '#16a34a';
      case 'entrenador': return '#ea580c';
      default: return '#0891b2';
    }
  };
  const getStatusInfo = (user: AdminUser) => {
    if (!user.is_active) return { label: '🔴 Inactivo', color: '#dc2626' };
    if (user.status === 'pending_verification') return { label: '⏳ Pendiente', color: '#f59e0b' };
    if (user.status === 'rejected') return { label: '❌ Rechazado', color: '#dc2626' };
    return { label: '✅ Activo', color: '#16a34a' };
  };

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    scroll: { padding: 20 * s, paddingBottom: 40 * s } as const,
    center: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
    loadingText: { color: '#94a3b8', fontSize: 14 * s, marginTop: 12 * s },
    header: { marginBottom: 24 * s },
    title: { fontSize: 24 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 4 * s },
    subtitle: { fontSize: 14 * s, color: '#64748b' },

    // KPI row
    kpiRow: { flexDirection: 'row' as const, gap: 10 * s, marginBottom: 24 * s, flexWrap: 'wrap' as const },
    kpiCard: {
      flex: 1, minWidth: 100 * s, backgroundColor: '#111111', borderRadius: 14 * s, padding: 14 * s,
      alignItems: 'center' as const, borderWidth: 1, borderColor: '#1a1a1a',
    },
    kpiEmoji: { fontSize: 22 * s, marginBottom: 4 * s },
    kpiValue: { fontSize: 26 * s, fontWeight: '800' as const, color: '#fff' },
    kpiLabel: { fontSize: 11 * s, color: '#64748b', marginTop: 2 * s },

    // Section
    section: { marginBottom: 24 * s },
    sectionTitle: { fontSize: 18 * s, fontWeight: '700' as const, color: '#fff', marginBottom: 12 * s },
    sectionCount: { fontSize: 14 * s, color: '#d65151', fontWeight: '600' as const },

    // Pending card
    pendingCard: {
      backgroundColor: '#111111', borderRadius: 14 * s, padding: 16 * s, marginBottom: 10 * s,
      borderWidth: 1, borderColor: '#f59e0b30',
    },
    pendingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 10 * s },
    pendingAvatar: {
      width: 40 * s, height: 40 * s, borderRadius: 20 * s, backgroundColor: '#f59e0b',
      justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 12 * s,
    },
    pendingAvatarText: { fontSize: 16 * s, fontWeight: '700' as const, color: '#fff' },
    pendingInfo: { flex: 1 },
    pendingName: { fontSize: 15 * s, fontWeight: '600' as const, color: '#fff' },
    pendingEmail: { fontSize: 12 * s, color: '#94a3b8' },
    pendingMeta: { fontSize: 12 * s, color: '#64748b', marginTop: 2 * s },
    pendingActions: { flexDirection: 'row' as const, gap: 10 * s },
    approveBtn: {
      flex: 1, backgroundColor: '#16a34a', borderRadius: 10 * s, paddingVertical: 10 * s,
      alignItems: 'center' as const,
    },
    rejectBtn: {
      flex: 1, backgroundColor: '#dc2626', borderRadius: 10 * s, paddingVertical: 10 * s,
      alignItems: 'center' as const,
    },
    actionBtnText: { color: '#fff', fontSize: 13 * s, fontWeight: '700' as const },

    // Search
    searchInput: {
      backgroundColor: '#111111', borderRadius: 12 * s, paddingHorizontal: 16 * s, paddingVertical: 12 * s,
      fontSize: 14 * s, color: '#fff', borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 12 * s,
    },

    // User card
    userCard: {
      backgroundColor: '#111111', borderRadius: 14 * s, padding: 16 * s, marginBottom: 10 * s,
      borderWidth: 1, borderColor: '#1a1a1a',
    },
    userRow: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, marginBottom: 8 * s },
    userAvatar: {
      width: 38 * s, height: 38 * s, borderRadius: 19 * s, backgroundColor: '#d65151',
      justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 12 * s, marginTop: 2 * s,
    },
    userAvatarText: { fontSize: 15 * s, fontWeight: '700' as const, color: '#fff' },
    userInfo: { flex: 1, marginRight: 10 * s },
    userName: { fontSize: 14 * s, fontWeight: '600' as const, color: '#fff' },
    userEmail: { fontSize: 12 * s, color: '#94a3b8' },
    userDni: { fontSize: 11 * s, color: '#64748b' },
    userBadges: {
      flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5 * s,
      flexWrap: 'wrap' as const, maxWidth: 180 * s, justifyContent: 'flex-end' as const,
    },
    badge: {
      paddingHorizontal: 8 * s, paddingVertical: 3 * s, borderRadius: 6 * s, borderWidth: 1,
    },
    badgeText: { fontSize: 10 * s, fontWeight: '600' as const },
    activeSwitch: { alignItems: 'center' as const, marginLeft: 8 * s },
    activeLabel: { fontSize: 10 * s, color: '#64748b', marginBottom: 2 },
    // Delete confirm modal
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 * s,
    },
    modalBox: {
      backgroundColor: '#111111', borderRadius: 18 * s, padding: 24 * s,
      width: '100%' as const, maxWidth: 380 * s, borderWidth: 1, borderColor: '#1a1a1a',
      alignItems: 'center' as const,
    },
    modalEmoji: { fontSize: 40 * s, marginBottom: 12 * s },
    modalTitle: { fontSize: 18 * s, fontWeight: '700' as const, color: '#fff', marginBottom: 8 * s },
    modalDesc: { fontSize: 14 * s, color: '#94a3b8', textAlign: 'center' as const, marginBottom: 20 * s, lineHeight: 20 * s },
    modalBtns: { flexDirection: 'row' as const, gap: 12 * s, width: '100%' as const },
    modalCancel: {
      flex: 1, paddingVertical: 12 * s, borderRadius: 10 * s,
      borderWidth: 1, borderColor: '#333', alignItems: 'center' as const,
    },
    modalCancelText: { fontSize: 14 * s, color: '#94a3b8', fontWeight: '600' as const },
    modalConfirm: {
      flex: 1, paddingVertical: 12 * s, borderRadius: 10 * s,
      backgroundColor: '#dc2626', alignItems: 'center' as const,
    },
    modalConfirmText: { fontSize: 14 * s, color: '#fff', fontWeight: '700' as const },
    roleBtns: { flexDirection: 'row' as const, gap: 6 * s, marginTop: 8 * s, flexWrap: 'wrap' as const },
    roleBtn: {
      paddingHorizontal: 10 * s, paddingVertical: 6 * s, borderRadius: 8 * s,
      borderWidth: 1, borderColor: '#333',
    },
    roleBtnActive: { borderColor: '#d65151', backgroundColor: '#d6515120' },
    roleBtnText: { fontSize: 11 * s, color: '#94a3b8' },
    roleBtnTextActive: { color: '#d65151', fontWeight: '700' as const },

    // Audit
    auditCard: {
      backgroundColor: '#111111', borderRadius: 12 * s, padding: 14 * s, marginBottom: 8 * s,
      borderWidth: 1, borderColor: '#1a1a1a', flexDirection: 'row' as const, alignItems: 'flex-start' as const,
    },
    auditEmoji: { fontSize: 20 * s, marginRight: 12 * s, marginTop: 2 * s },
    auditInfo: { flex: 1 },
    auditUser: { fontSize: 13 * s, fontWeight: '600' as const, color: '#e2e8f0' },
    auditDetails: { fontSize: 12 * s, color: '#94a3b8', marginTop: 2 * s },
    auditTime: { fontSize: 11 * s, color: '#64748b', marginTop: 4 * s },

    deleteBtn: {
      marginTop: 10 * s, paddingVertical: 8 * s, borderRadius: 8 * s,
      borderWidth: 1, borderColor: '#dc262650', alignItems: 'center' as const,
    },
    deleteBtnText: { fontSize: 12 * s, color: '#dc2626', fontWeight: '600' as const },

    emptyText: { fontSize: 14 * s, color: '#64748b', textAlign: 'center' as const, paddingVertical: 20 * s },
  }), [s, isWide]);

  if (loading) {
    return (
      <View style={$.center}>
        <ActivityIndicator size="large" color="#d65151" />
        <Text style={$.loadingText}>Cargando panel...</Text>
      </View>
    );
  }

  const auditEmoji = (action: string) => {
    if (action.includes('approved')) return '✅';
    if (action.includes('rejected')) return '❌';
    if (action.includes('activated')) return '🟢';
    if (action.includes('deactivated')) return '🔴';
    if (action.includes('role')) return '🔄';
    if (action.includes('login')) return '🔓';
    if (action.includes('deleted')) return '🗑';
    if (action.includes('registered')) return '📋';
    return '📝';
  };

  return (
    <>
    <ScrollView style={$.container} contentContainerStyle={$.scroll}>
      {/* Header */}
      <View style={$.header}>
        <Text style={$.title}>Panel de Administración</Text>
        <Text style={$.subtitle}>Datos en tiempo real desde auth.db</Text>
      </View>

      {/* KPIs */}
      {stats && (
        <View style={$.kpiRow}>
          <View style={$.kpiCard}>
            <Text style={$.kpiEmoji}>👥</Text>
            <Text style={$.kpiValue}>{stats.total_users}</Text>
            <Text style={$.kpiLabel}>Usuarios</Text>
          </View>
          <View style={$.kpiCard}>
            <Text style={$.kpiEmoji}>✅</Text>
            <Text style={$.kpiValue}>{stats.active_users}</Text>
            <Text style={$.kpiLabel}>Activos</Text>
          </View>
          <View style={$.kpiCard}>
            <Text style={$.kpiEmoji}>🩺</Text>
            <Text style={$.kpiValue}>{stats.doctors}</Text>
            <Text style={$.kpiLabel}>Médicos</Text>
          </View>
          <View style={$.kpiCard}>
            <Text style={$.kpiEmoji}>⚙️</Text>
            <Text style={$.kpiValue}>{stats.admins}</Text>
            <Text style={$.kpiLabel}>Admins</Text>
          </View>
          {stats.nutricionistas > 0 && (
            <View style={$.kpiCard}>
              <Text style={$.kpiEmoji}>🥗</Text>
              <Text style={$.kpiValue}>{stats.nutricionistas}</Text>
              <Text style={$.kpiLabel}>Nutricionistas</Text>
            </View>
          )}
          {stats.entrenadores > 0 && (
            <View style={$.kpiCard}>
              <Text style={$.kpiEmoji}>🏋️</Text>
              <Text style={$.kpiValue}>{stats.entrenadores}</Text>
              <Text style={$.kpiLabel}>Entrenadores</Text>
            </View>
          )}
          {stats.pending_verification > 0 && (
            <View style={[$.kpiCard, { borderColor: '#f59e0b40' }]}>
              <Text style={$.kpiEmoji}>⏳</Text>
              <Text style={[$.kpiValue, { color: '#f59e0b' }]}>{stats.pending_verification}</Text>
              <Text style={$.kpiLabel}>Pendientes</Text>
            </View>
          )}
        </View>
      )}

      {/* Pending Users */}
      {pendingUsers.length > 0 && (
        <View style={$.section}>
          <Text style={$.sectionTitle}>
            ⏳ Pacientes pendientes{' '}
            <Text style={$.sectionCount}>({pendingUsers.length})</Text>
          </Text>
          {pendingUsers.map(u => (
            <View key={u.id} style={$.pendingCard}>
              <View style={$.pendingRow}>
                <View style={$.pendingAvatar}>
                  <Text style={$.pendingAvatarText}>{(u.display_name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={$.pendingInfo}>
                  <Text style={$.pendingName}>{u.display_name}</Text>
                  <Text style={$.pendingEmail}>{u.email}</Text>
                  <Text style={$.pendingMeta}>
                    DNI: {u.patient_dni || '—'} · Rol deseado: {u.desired_role || 'patient'}
                    {u.telefono ? ` · Tel: ${u.telefono}` : ''}
                  </Text>
                </View>
              </View>
              <View style={$.pendingActions}>
                <Pressable
                  style={$.approveBtn}
                  onPress={() => handleApprove(u.id)}
                  disabled={actionLoading === u.id}
                >
                  {actionLoading === u.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={$.actionBtnText}>✓ Aprobar</Text>
                  )}
                </Pressable>
                <Pressable
                  style={$.rejectBtn}
                  onPress={() => handleReject(u.id)}
                  disabled={actionLoading === u.id}
                >
                  <Text style={$.actionBtnText}>✗ Rechazar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* User Management */}
      <View style={$.section}>
        <Text style={$.sectionTitle}>
          👥 Gestión de usuarios{' '}
          <Text style={$.sectionCount}>({users.length})</Text>
        </Text>

        <TextInput
          style={$.searchInput}
          placeholder="Buscar por nombre, email o DNI..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />

        {filteredUsers.map(u => {
          const si = getStatusInfo(u);
          const roles = userRoles(u.role);
          return (
            <View key={u.id} style={$.userCard}>
              <View style={$.userRow}>
                <View style={[$.userAvatar, { backgroundColor: roleColor(roles.find(r => r !== 'user') || 'user') }]}>
                  <Text style={$.userAvatarText}>{(u.display_name || '?').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={$.userInfo}>
                  <Text style={$.userName}>{u.display_name || 'Sin nombre'}</Text>
                  <Text style={$.userEmail}>{u.email}</Text>
                  {u.patient_dni ? <Text style={$.userDni}>DNI: {u.patient_dni}</Text> : null}
                </View>
                <View style={$.userBadges}>
                  {roles.map(r => (
                    <View key={r} style={[$.badge, { borderColor: roleColor(r), backgroundColor: roleColor(r) + '20' }]}>
                      <Text style={[$.badgeText, { color: roleColor(r) }]}>{roleLabel(r)}</Text>
                    </View>
                  ))}
                  <View style={[$.badge, { borderColor: si.color, backgroundColor: si.color + '20' }]}>
                    <Text style={[$.badgeText, { color: si.color }]}>{si.label}</Text>
                  </View>
                </View>
                <View style={$.activeSwitch}>
                  <Text style={$.activeLabel}>{u.is_active ? 'Activo' : 'Inactivo'}</Text>
                  <Switch
                    value={u.is_active}
                    onValueChange={() => handleToggleActive(u.id)}
                    trackColor={{ false: '#2a2a2a', true: '#16a34a50' }}
                    thumbColor={u.is_active ? '#16a34a' : '#555'}
                    disabled={actionLoading === u.id}
                  />
                </View>
              </View>

              <View style={$.roleBtns}>
                {['user', 'doctor', 'admin', 'nutricionista', 'entrenador'].map(r => {
                  const hasRole = roles.includes(r);
                  return (
                    <Pressable
                      key={r}
                      style={[$.roleBtn, hasRole && $.roleBtnActive]}
                      onPress={() => handleRoleToggle(u.id, r)}
                      disabled={actionLoading === u.id}
                    >
                      <Text style={[$.roleBtnText, hasRole && $.roleBtnTextActive]}>
                        {roleLabel(r)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={$.deleteBtn}
                onPress={() => setDeleteConfirm({ id: u.id, name: u.display_name || u.email })}
                disabled={actionLoading === u.id}
              >
                <Text style={$.deleteBtnText}>🗑 Eliminar usuario</Text>
              </Pressable>
            </View>
          );
        })}

        {filteredUsers.length === 0 && (
          <Text style={$.emptyText}>No se encontraron usuarios</Text>
        )}
      </View>

      {/* Audit Log */}
      <View style={$.section}>
        <Text style={$.sectionTitle}>📋 Auditoría reciente</Text>
        {audit.length === 0 ? (
          <Text style={$.emptyText}>Sin registros de auditoría aún</Text>
        ) : (
          audit.map(entry => (
            <View key={entry.id} style={$.auditCard}>
              <Text style={$.auditEmoji}>{auditEmoji(entry.action)}</Text>
              <View style={$.auditInfo}>
                <Text style={$.auditUser}>{entry.user_name || 'Sistema'}</Text>
                <Text style={$.auditDetails}>{entry.details}</Text>
                <Text style={$.auditTime}>
                  {entry.created_at ? new Date(entry.created_at).toLocaleString('es', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  }) : '—'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirm(null)}
      >
        <Pressable style={$.modalOverlay} onPress={() => setDeleteConfirm(null)}>
          <View style={$.modalBox}>
            <Text style={$.modalEmoji}>⚠️</Text>
            <Text style={$.modalTitle}>Eliminar usuario</Text>
            <Text style={$.modalDesc}>
              ¿Seguro que querés eliminar a {deleteConfirm?.name}?{'\n'}Esta acción no se puede deshacer.
            </Text>
            <View style={$.modalBtns}>
              <Pressable style={$.modalCancel} onPress={() => setDeleteConfirm(null)}>
                <Text style={$.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={$.modalConfirm} onPress={handleDelete}>
                <Text style={$.modalConfirmText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
