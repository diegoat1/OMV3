// Admin Users - Full user management with search, filters, role editing

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Switch, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useScale } from '../../src/hooks/useScale';
import { adminService } from '../../src/services/api';
import type { AdminUser } from '../../src/services/api/adminService';

export default function AdminUsersScreen() {
  const { s } = useScale();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await adminService.getAuthUsers();
      const d = (res as any)?.data || res;
      const list = d?.data?.users || d?.users || [];
      setUsers(list);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const userRoles = (r: string) => (r || 'user').split(',').map(x => x.trim()).filter(Boolean);
  const allRoles = ['user', 'doctor', 'admin', 'nutricionista', 'entrenador'];
  const roleLabel = (r: string) => {
    switch (r) { case 'admin': return 'Admin'; case 'doctor': return 'Médico'; case 'nutricionista': return 'Nutricionista'; case 'entrenador': return 'Entrenador'; default: return 'Paciente'; }
  };
  const roleColor = (r: string) => {
    switch (r) { case 'admin': return '#f59e0b'; case 'doctor': return '#8b5cf6'; case 'nutricionista': return '#16a34a'; case 'entrenador': return '#ea580c'; default: return '#0891b2'; }
  };

  const filtered = useMemo(() => {
    let list = users;
    if (filterRole) list = list.filter(u => userRoles(u.role).includes(filterRole));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.display_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.patient_dni.includes(q));
    }
    return list;
  }, [users, search, filterRole]);

  const handleRoleToggle = async (userId: number, role: string) => {
    setActionLoading(userId);
    try { await adminService.updateRole(userId, role); } catch {}
    await loadUsers(); setActionLoading(null);
  };
  const handleToggleActive = async (userId: number) => {
    setActionLoading(userId);
    try { await adminService.toggleActive(userId); } catch {}
    await loadUsers(); setActionLoading(null);
  };
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id; setDeleteConfirm(null); setActionLoading(id);
    try { await adminService.deleteUser(id); } catch {}
    await loadUsers(); setActionLoading(null);
  };

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    scroll: { padding: 20 * s, paddingBottom: 40 * s } as const,
    title: { fontSize: 22 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 4 * s },
    subtitle: { fontSize: 13 * s, color: '#64748b', marginBottom: 16 * s },
    searchInput: { backgroundColor: '#111', borderRadius: 12 * s, paddingHorizontal: 16 * s, paddingVertical: 12 * s, fontSize: 14 * s, color: '#fff', borderWidth: 1, borderColor: '#1a1a1a', marginBottom: 10 * s },
    filterRow: { flexDirection: 'row' as const, gap: 6 * s, marginBottom: 14 * s, flexWrap: 'wrap' as const },
    filterBtn: { paddingHorizontal: 12 * s, paddingVertical: 6 * s, borderRadius: 16 * s, borderWidth: 1, borderColor: '#333' },
    filterBtnActive: { borderColor: '#d65151', backgroundColor: '#d6515120' },
    filterText: { fontSize: 11 * s, color: '#94a3b8' },
    filterTextActive: { color: '#d65151', fontWeight: '700' as const },
    card: { backgroundColor: '#111', borderRadius: 14 * s, padding: 14 * s, marginBottom: 8 * s, borderWidth: 1, borderColor: '#1a1a1a' },
    row: { flexDirection: 'row' as const, alignItems: 'flex-start' as const },
    avatar: { width: 36 * s, height: 36 * s, borderRadius: 18 * s, justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 10 * s, marginTop: 2 * s },
    avatarText: { fontSize: 14 * s, fontWeight: '700' as const, color: '#fff' },
    info: { flex: 1, marginRight: 8 * s },
    name: { fontSize: 14 * s, fontWeight: '600' as const, color: '#fff' },
    email: { fontSize: 11 * s, color: '#94a3b8' },
    dni: { fontSize: 10 * s, color: '#64748b' },
    badges: { flexDirection: 'row' as const, gap: 4 * s, flexWrap: 'wrap' as const, marginTop: 4 * s },
    badge: { paddingHorizontal: 7 * s, paddingVertical: 2 * s, borderRadius: 5 * s, borderWidth: 1 },
    badgeText: { fontSize: 9 * s, fontWeight: '600' as const },
    switchCol: { alignItems: 'center' as const },
    switchLabel: { fontSize: 9 * s, color: '#64748b', marginBottom: 2 },
    roleBtns: { flexDirection: 'row' as const, gap: 5 * s, marginTop: 8 * s, flexWrap: 'wrap' as const },
    roleBtn: { paddingHorizontal: 9 * s, paddingVertical: 5 * s, borderRadius: 7 * s, borderWidth: 1, borderColor: '#333' },
    roleBtnActive: { borderColor: '#d65151', backgroundColor: '#d6515120' },
    roleBtnText: { fontSize: 10 * s, color: '#94a3b8' },
    roleBtnTextActive: { color: '#d65151', fontWeight: '700' as const },
    deleteBtn: { marginTop: 8 * s, paddingVertical: 7 * s, borderRadius: 7 * s, borderWidth: 1, borderColor: '#dc262640', alignItems: 'center' as const },
    deleteBtnText: { fontSize: 11 * s, color: '#dc2626', fontWeight: '600' as const },
    emptyText: { fontSize: 14 * s, color: '#64748b', textAlign: 'center' as const, paddingVertical: 20 * s },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center' as const, alignItems: 'center' as const, padding: 24 * s },
    modalBox: { backgroundColor: '#111', borderRadius: 18 * s, padding: 24 * s, width: '100%' as const, maxWidth: 380 * s, borderWidth: 1, borderColor: '#1a1a1a', alignItems: 'center' as const },
    modalEmoji: { fontSize: 40 * s, marginBottom: 12 * s },
    modalTitle: { fontSize: 18 * s, fontWeight: '700' as const, color: '#fff', marginBottom: 8 * s },
    modalDesc: { fontSize: 14 * s, color: '#94a3b8', textAlign: 'center' as const, marginBottom: 20 * s },
    modalBtns: { flexDirection: 'row' as const, gap: 12 * s, width: '100%' as const },
    modalCancel: { flex: 1, paddingVertical: 12 * s, borderRadius: 10 * s, borderWidth: 1, borderColor: '#333', alignItems: 'center' as const },
    modalCancelText: { fontSize: 14 * s, color: '#94a3b8', fontWeight: '600' as const },
    modalConfirm: { flex: 1, paddingVertical: 12 * s, borderRadius: 10 * s, backgroundColor: '#dc2626', alignItems: 'center' as const },
    modalConfirmText: { fontSize: 14 * s, color: '#fff', fontWeight: '700' as const },
  }), [s]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#d65151" /></View>;

  return (
    <>
    <ScrollView style={$.container} contentContainerStyle={$.scroll}>
      <Text style={$.title}>Gestión de Usuarios</Text>
      <Text style={$.subtitle}>{users.length} usuarios registrados</Text>

      <TextInput style={$.searchInput} placeholder="Buscar por nombre, email o DNI..." placeholderTextColor="#555" value={search} onChangeText={setSearch} />

      <View style={$.filterRow}>
        <Pressable style={[$.filterBtn, !filterRole && $.filterBtnActive]} onPress={() => setFilterRole(null)}>
          <Text style={[$.filterText, !filterRole && $.filterTextActive]}>Todos</Text>
        </Pressable>
        {allRoles.map(r => (
          <Pressable key={r} style={[$.filterBtn, filterRole === r && $.filterBtnActive]} onPress={() => setFilterRole(filterRole === r ? null : r)}>
            <Text style={[$.filterText, filterRole === r && $.filterTextActive]}>{roleLabel(r)}</Text>
          </Pressable>
        ))}
      </View>

      {filtered.map(u => {
        const roles = userRoles(u.role);
        const isInactive = !u.is_active;
        return (
          <View key={u.id} style={$.card}>
            <View style={$.row}>
              <View style={[$.avatar, { backgroundColor: roleColor(roles.find(r => r !== 'user') || 'user') }]}>
                <Text style={$.avatarText}>{(u.display_name || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={$.info}>
                <Text style={$.name}>{u.display_name || 'Sin nombre'}</Text>
                <Text style={$.email}>{u.email}</Text>
                {u.patient_dni ? <Text style={$.dni}>DNI: {u.patient_dni}</Text> : null}
                <View style={$.badges}>
                  {roles.map(r => (
                    <View key={r} style={[$.badge, { borderColor: roleColor(r), backgroundColor: roleColor(r) + '20' }]}>
                      <Text style={[$.badgeText, { color: roleColor(r) }]}>{roleLabel(r)}</Text>
                    </View>
                  ))}
                  <View style={[$.badge, { borderColor: isInactive ? '#dc2626' : '#16a34a', backgroundColor: (isInactive ? '#dc2626' : '#16a34a') + '20' }]}>
                    <Text style={[$.badgeText, { color: isInactive ? '#dc2626' : '#16a34a' }]}>{isInactive ? '🔴 Inactivo' : '✅ Activo'}</Text>
                  </View>
                </View>
              </View>
              <View style={$.switchCol}>
                <Text style={$.switchLabel}>{u.is_active ? 'Activo' : 'Inact.'}</Text>
                <Switch value={u.is_active} onValueChange={() => handleToggleActive(u.id)} trackColor={{ false: '#2a2a2a', true: '#16a34a50' }} thumbColor={u.is_active ? '#16a34a' : '#555'} disabled={actionLoading === u.id} />
              </View>
            </View>
            <View style={$.roleBtns}>
              {allRoles.map(r => {
                const has = roles.includes(r);
                return (
                  <Pressable key={r} style={[$.roleBtn, has && $.roleBtnActive]} onPress={() => handleRoleToggle(u.id, r)} disabled={actionLoading === u.id}>
                    <Text style={[$.roleBtnText, has && $.roleBtnTextActive]}>{roleLabel(r)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={$.deleteBtn} onPress={() => setDeleteConfirm({ id: u.id, name: u.display_name || u.email })} disabled={actionLoading === u.id}>
              <Text style={$.deleteBtnText}>🗑 Eliminar</Text>
            </Pressable>
          </View>
        );
      })}
      {filtered.length === 0 && <Text style={$.emptyText}>No se encontraron usuarios</Text>}
    </ScrollView>

    <Modal visible={!!deleteConfirm} transparent animationType="fade" onRequestClose={() => setDeleteConfirm(null)}>
      <Pressable style={$.modalOverlay} onPress={() => setDeleteConfirm(null)}>
        <View style={$.modalBox}>
          <Text style={$.modalEmoji}>⚠️</Text>
          <Text style={$.modalTitle}>Eliminar usuario</Text>
          <Text style={$.modalDesc}>¿Eliminar a {deleteConfirm?.name}? No se puede deshacer.</Text>
          <View style={$.modalBtns}>
            <Pressable style={$.modalCancel} onPress={() => setDeleteConfirm(null)}><Text style={$.modalCancelText}>Cancelar</Text></Pressable>
            <Pressable style={$.modalConfirm} onPress={handleDelete}><Text style={$.modalConfirmText}>Eliminar</Text></Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
    </>
  );
}
