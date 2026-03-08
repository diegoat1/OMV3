// Admin Audit - Full audit log with filters

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useScale } from '../../src/hooks/useScale';
import { adminService } from '../../src/services/api';
import type { AuditEntry } from '../../src/services/api/adminService';

export default function AdminAuditScreen() {
  const { s } = useScale();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await adminService.getAuditLog(100);
      const d = (res as any)?.data || res;
      const list = d?.data?.entries || d?.entries || [];
      setEntries(list);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const emoji = (a: string) => {
    if (a.includes('approved')) return '✅';
    if (a.includes('rejected')) return '❌';
    if (a.includes('activated')) return '🟢';
    if (a.includes('deactivated')) return '🔴';
    if (a.includes('role')) return '🔄';
    if (a.includes('login')) return '🔓';
    if (a.includes('deleted')) return '🗑';
    if (a.includes('registered')) return '📋';
    return '📝';
  };

  const actionTypes = useMemo(() => {
    const set = new Set(entries.map(e => e.action));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    if (!filter) return entries;
    return entries.filter(e => e.action === filter);
  }, [entries, filter]);

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    scroll: { padding: 20 * s, paddingBottom: 40 * s } as const,
    title: { fontSize: 22 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 4 * s },
    subtitle: { fontSize: 13 * s, color: '#64748b', marginBottom: 16 * s },
    filterRow: { flexDirection: 'row' as const, gap: 6 * s, marginBottom: 14 * s, flexWrap: 'wrap' as const },
    filterBtn: { paddingHorizontal: 10 * s, paddingVertical: 5 * s, borderRadius: 14 * s, borderWidth: 1, borderColor: '#333' },
    filterBtnActive: { borderColor: '#d65151', backgroundColor: '#d6515120' },
    filterText: { fontSize: 10 * s, color: '#94a3b8' },
    filterTextActive: { color: '#d65151', fontWeight: '700' as const },
    card: {
      backgroundColor: '#111', borderRadius: 12 * s, padding: 14 * s, marginBottom: 8 * s,
      borderWidth: 1, borderColor: '#1a1a1a', flexDirection: 'row' as const, alignItems: 'flex-start' as const,
    },
    cardEmoji: { fontSize: 20 * s, marginRight: 12 * s, marginTop: 2 * s },
    cardInfo: { flex: 1 },
    cardUser: { fontSize: 13 * s, fontWeight: '600' as const, color: '#e2e8f0' },
    cardAction: { fontSize: 10 * s, color: '#d65151', marginTop: 2 * s },
    cardDetails: { fontSize: 12 * s, color: '#94a3b8', marginTop: 3 * s },
    cardMeta: { flexDirection: 'row' as const, gap: 12 * s, marginTop: 5 * s },
    cardTime: { fontSize: 10 * s, color: '#64748b' },
    cardIp: { fontSize: 10 * s, color: '#475569' },
    emptyText: { fontSize: 14 * s, color: '#64748b', textAlign: 'center' as const, paddingVertical: 20 * s },
    refreshBtn: { alignSelf: 'center' as const, paddingHorizontal: 20 * s, paddingVertical: 10 * s, borderRadius: 10 * s, borderWidth: 1, borderColor: '#333', marginBottom: 16 * s },
    refreshText: { fontSize: 12 * s, color: '#94a3b8' },
  }), [s]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#d65151" /></View>;

  return (
    <ScrollView style={$.container} contentContainerStyle={$.scroll}>
      <Text style={$.title}>Registro de Auditoría</Text>
      <Text style={$.subtitle}>{entries.length} eventos registrados</Text>

      <Pressable style={$.refreshBtn} onPress={() => { setLoading(true); load(); }}>
        <Text style={$.refreshText}>🔄 Actualizar</Text>
      </Pressable>

      <View style={$.filterRow}>
        <Pressable style={[$.filterBtn, !filter && $.filterBtnActive]} onPress={() => setFilter(null)}>
          <Text style={[$.filterText, !filter && $.filterTextActive]}>Todos</Text>
        </Pressable>
        {actionTypes.map(a => (
          <Pressable key={a} style={[$.filterBtn, filter === a && $.filterBtnActive]} onPress={() => setFilter(filter === a ? null : a)}>
            <Text style={[$.filterText, filter === a && $.filterTextActive]}>{emoji(a)} {a}</Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text style={$.emptyText}>Sin registros de auditoría</Text>
      ) : (
        filtered.map(e => (
          <View key={e.id} style={$.card}>
            <Text style={$.cardEmoji}>{emoji(e.action)}</Text>
            <View style={$.cardInfo}>
              <Text style={$.cardUser}>{e.user_name || 'Sistema'}</Text>
              <Text style={$.cardAction}>{e.action}</Text>
              <Text style={$.cardDetails}>{e.details}</Text>
              <View style={$.cardMeta}>
                <Text style={$.cardTime}>
                  {e.created_at ? new Date(e.created_at).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </Text>
                {e.ip_address ? <Text style={$.cardIp}>IP: {e.ip_address}</Text> : null}
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
