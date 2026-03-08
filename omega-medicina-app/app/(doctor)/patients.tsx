// Doctor Patients Screen - Real patient assignment via DNI

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useScale } from '../../src/hooks/useScale';
import { assignmentService } from '../../src/services/api';

interface PatientAssignment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_dni: string;
  patient_email?: string;
  patient_active?: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function PatientsScreen() {
  const router = useRouter();
  const { s } = useScale();
  const [patients, setPatients] = useState<PatientAssignment[]>([]);
  const [requests, setRequests] = useState<PatientAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dniInput, setDniInput] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ id: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [unassignConfirm, setUnassignConfirm] = useState<{ patientId: number; name: string } | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        assignmentService.getMyPatients(),
        assignmentService.getMyRequests(),
      ]);
      const pData = (pRes as any)?.data || pRes;
      const rData = (rRes as any)?.data || rRes;
      setPatients(pData?.patients || (Array.isArray(pData) ? pData : []));
      const allRequests = rData?.requests || (Array.isArray(rData) ? rData : []);
      setRequests(allRequests.filter((r: PatientAssignment) => r.status === 'pending_patient'));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async () => {
    const dni = dniInput.trim();
    if (!dni) return;
    setRequesting(true);
    setResultMsg(null);
    try {
      const res = await assignmentService.requestAssignment(dni);
      const data = (res as any)?.data || res;
      setResultMsg({ text: (data as any)?.message || 'Solicitud enviada', ok: true });
      setDniInput('');
      await load();
    } catch { setResultMsg({ text: 'Error de conexión', ok: false }); }
    finally { setRequesting(false); }
  };

  const handleCancel = async () => {
    if (!cancelConfirm) return;
    const id = cancelConfirm.id;
    setCancelConfirm(null);
    try { await assignmentService.cancelAssignment(id); } catch {}
    await load();
  };

  const handleUnassign = async () => {
    if (!unassignConfirm) return;
    setUnassigning(true);
    try {
      await assignmentService.unassignPatient(unassignConfirm.patientId);
    } catch {}
    setUnassignConfirm(null);
    setUnassigning(false);
    await load();
  };

  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter(p =>
      (p.patient_name || '').toLowerCase().includes(q) ||
      (p.patient_dni || '').includes(q)
    );
  }, [patients, searchQuery]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return requests;
    return requests.filter(r =>
      (r.patient_name || '').toLowerCase().includes(q) ||
      (r.patient_dni || '').includes(q)
    );
  }, [requests, searchQuery]);

  const statusLabel = (s: string) => {
    switch (s) {
      case 'pending_patient': return '⏳ Pendiente';
      case 'accepted': return '✅ Aceptado';
      case 'rejected': return '❌ Rechazado';
      case 'cancelled': return '🚫 Cancelado';
      default: return s;
    }
  };
  const statusColor = (s: string) => {
    switch (s) {
      case 'pending_patient': return '#f59e0b';
      case 'accepted': return '#16a34a';
      case 'rejected': return '#dc2626';
      case 'cancelled': return '#64748b';
      default: return '#94a3b8';
    }
  };

  const $ = useMemo(() => ({
    container: { flex: 1, backgroundColor: '#0a0a0a' } as const,
    scroll: { padding: 20 * s, paddingBottom: 40 * s } as const,
    title: { fontSize: 22 * s, fontWeight: '800' as const, color: '#fff', marginBottom: 4 * s },
    subtitle: { fontSize: 13 * s, color: '#64748b', marginBottom: 12 * s },
    searchRow: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      backgroundColor: '#111', borderRadius: 10 * s, paddingHorizontal: 12 * s,
      borderWidth: 1, borderColor: '#252525', marginBottom: 16 * s,
    },
    searchInput: {
      flex: 1, fontSize: 14 * s, color: '#fff', paddingVertical: 10 * s, marginLeft: 8 * s,
    },
    addBtn: {
      backgroundColor: '#8b5cf6', borderRadius: 10 * s, paddingHorizontal: 14 * s,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    addBtnText: { fontSize: 13 * s, fontWeight: '700' as const, color: '#fff' },
    inputRow: { flexDirection: 'row' as const, gap: 8 * s },
    dniInput: {
      flex: 1, backgroundColor: '#0a0a0a', borderRadius: 10 * s, paddingHorizontal: 14 * s,
      paddingVertical: 10 * s, fontSize: 14 * s, color: '#fff', borderWidth: 1, borderColor: '#252525',
    },
    sendBtn: {
      backgroundColor: '#8b5cf6', borderRadius: 10 * s, paddingHorizontal: 18 * s,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    sendBtnDisabled: { opacity: 0.5 },
    sendBtnText: { fontSize: 13 * s, fontWeight: '700' as const, color: '#fff' },
    resultMsg: { marginTop: 8 * s, fontSize: 12 * s },
    // Sections
    sectionTitle: { fontSize: 16 * s, fontWeight: '700' as const, color: '#e2e8f0', marginBottom: 10 * s, marginTop: 6 * s },
    // Patient card
    card: {
      backgroundColor: '#111', borderRadius: 12 * s, padding: 14 * s, marginBottom: 8 * s,
      borderWidth: 1, borderColor: '#1a1a1a', flexDirection: 'row' as const, alignItems: 'center' as const,
    },
    avatar: {
      width: 38 * s, height: 38 * s, borderRadius: 19 * s, backgroundColor: '#8b5cf6',
      justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: 12 * s,
    },
    avatarText: { fontSize: 15 * s, fontWeight: '700' as const, color: '#fff' },
    cardInfo: { flex: 1 },
    cardName: { fontSize: 14 * s, fontWeight: '600' as const, color: '#fff' },
    cardEmail: { fontSize: 11 * s, color: '#94a3b8' },
    cardDni: { fontSize: 10 * s, color: '#64748b' },
    statusBadge: { paddingHorizontal: 8 * s, paddingVertical: 3 * s, borderRadius: 6 * s, borderWidth: 1 },
    statusText: { fontSize: 10 * s, fontWeight: '600' as const },
    // Pending request card
    pendingCard: {
      backgroundColor: '#111', borderRadius: 12 * s, padding: 14 * s, marginBottom: 8 * s,
      borderWidth: 1, borderColor: '#f59e0b30',
    },
    pendingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    pendingInfo: { flex: 1 },
    pendingName: { fontSize: 14 * s, fontWeight: '600' as const, color: '#fff' },
    pendingDni: { fontSize: 11 * s, color: '#f59e0b' },
    pendingDate: { fontSize: 10 * s, color: '#64748b', marginTop: 2 * s },
    cancelBtn: {
      paddingHorizontal: 12 * s, paddingVertical: 6 * s, borderRadius: 8 * s,
      borderWidth: 1, borderColor: '#dc262640',
    },
    cancelBtnText: { fontSize: 11 * s, color: '#dc2626', fontWeight: '600' as const },
    emptyText: { fontSize: 13 * s, color: '#64748b', textAlign: 'center' as const, paddingVertical: 16 * s },
    // Modal
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

  return (
    <>
    <ScrollView style={$.container} contentContainerStyle={$.scroll}>
      <Text style={$.title}>Mis Pacientes</Text>
      <Text style={$.subtitle}>{patients.length} paciente{patients.length !== 1 ? 's' : ''} asignado{patients.length !== 1 ? 's' : ''}</Text>

      {/* Top row: Search + Add button */}
      <View style={{ flexDirection: 'row', gap: 8 * s, marginBottom: 16 * s }}>
        <View style={[$.searchRow, { flex: 1, marginBottom: 0 }]}>
          <Search size={16 * s} color="#64748b" />
          <TextInput
            style={$.searchInput}
            placeholder="Buscar por nombre o DNI..."
            placeholderTextColor="#555"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>
        <Pressable
          style={$.addBtn}
          onPress={() => { setShowRequestModal(true); setResultMsg(null); setDniInput(''); }}
        >
          <Text style={$.addBtnText}>+ Nuevo</Text>
        </Pressable>
      </View>

      {/* Pending requests */}
      {filteredRequests.length > 0 && (
        <>
          <Text style={$.sectionTitle}>⏳ Solicitudes pendientes</Text>
          {filteredRequests.map(r => (
            <View key={r.id} style={$.pendingCard}>
              <View style={$.pendingRow}>
                <View style={$.pendingInfo}>
                  <Text style={$.pendingName}>{r.patient_name || 'Sin nombre'}</Text>
                  <Text style={$.pendingDni}>DNI: {r.patient_dni}</Text>
                  <Text style={$.pendingDate}>
                    Enviada: {r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—'}
                  </Text>
                </View>
                <Pressable style={$.cancelBtn} onPress={() => setCancelConfirm({ id: r.id, name: r.patient_name })}>
                  <Text style={$.cancelBtnText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Assigned patients */}
      <Text style={$.sectionTitle}>👥 Pacientes asignados ({filteredPatients.length})</Text>
      {filteredPatients.length === 0 ? (
        <Text style={$.emptyText}>{searchQuery ? 'Sin resultados para la búsqueda' : 'Aún no tenés pacientes asignados'}</Text>
      ) : (
        filteredPatients.map(p => (
          <View key={p.id} style={[$.card, { flexDirection: 'column' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[$.avatar]}>
                <Text style={$.avatarText}>{(p.patient_name || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={$.cardInfo}>
                <Text style={$.cardName}>{p.patient_name || 'Sin nombre'}</Text>
                {p.patient_email ? <Text style={$.cardEmail}>{p.patient_email}</Text> : null}
                <Text style={$.cardDni}>DNI: {p.patient_dni}</Text>
              </View>
              <Pressable
                style={[$.statusBadge, { borderColor: statusColor(p.status), backgroundColor: statusColor(p.status) + '20' }]}
                onPress={p.status === 'accepted' ? () => setUnassignConfirm({ patientId: p.patient_id, name: p.patient_name }) : undefined}
              >
                <Text style={[$.statusText, { color: statusColor(p.status) }]}>{statusLabel(p.status)}</Text>
              </Pressable>
            </View>
            {p.status === 'accepted' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 * s, marginTop: 10 * s }}>
                {([
                  { icon: '📏', label: 'Medidas', path: '/(doctor)/patient-measures', bg: '#0a0a0a', border: '#252525', color: '#94a3b8' },
                  { icon: '📊', label: 'Analíticas', path: '/(doctor)/patient-analytics', bg: '#3b82f615', border: '#3b82f640', color: '#3b82f6' },
                  { icon: '🎯', label: 'Objetivos', path: '/(doctor)/patient-goals', bg: '#8b5cf615', border: '#8b5cf640', color: '#8b5cf6' },
                  { icon: '🥗', label: 'Plan', path: '/(doctor)/patient-nutrition', bg: '#16a34a15', border: '#16a34a40', color: '#16a34a' },
                ] as const).map(btn => (
                  <Pressable
                    key={btn.label}
                    style={{
                      flex: 1, minWidth: '22%', paddingVertical: 7 * s, borderRadius: 8 * s,
                      backgroundColor: btn.bg, borderWidth: 1, borderColor: btn.border,
                      alignItems: 'center',
                    }}
                    onPress={() => router.push({
                      pathname: btn.path,
                      params: {
                        patientId: String(p.patient_id),
                        patientName: p.patient_name,
                        patientDni: p.patient_dni,
                      },
                    } as any)}
                  >
                    <Text style={{ fontSize: 11 * s, color: btn.color, fontWeight: '700' }}>
                      {btn.icon} {btn.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>

    {/* Request assignment modal */}
    <Modal visible={showRequestModal} transparent animationType="fade" onRequestClose={() => setShowRequestModal(false)}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={$.modalOverlay} onPress={() => setShowRequestModal(false)}>
        <View style={$.modalBox} onStartShouldSetResponder={() => true}>
          <Text style={$.modalEmoji}>👤</Text>
          <Text style={$.modalTitle}>Nuevo paciente</Text>
          <Text style={$.modalDesc}>
            Ingresá el DNI del paciente.{'\n'}Deberá aceptar la solicitud desde su app.
          </Text>
          <View style={[$.inputRow, { width: '100%' }]}>
            <TextInput
              style={[$.dniInput, { flex: 1 }]}
              placeholder="DNI del paciente..."
              placeholderTextColor="#555"
              value={dniInput}
              onChangeText={setDniInput}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          {resultMsg && (
            <Text style={[$.resultMsg, { color: resultMsg.ok ? '#16a34a' : '#dc2626', alignSelf: 'flex-start' }]}>
              {resultMsg.text}
            </Text>
          )}
          <View style={[$.modalBtns, { marginTop: 16 * s }]}>
            <Pressable style={$.modalCancel} onPress={() => setShowRequestModal(false)}>
              <Text style={$.modalCancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[$.modalConfirm, { backgroundColor: '#8b5cf6' }, (!dniInput.trim() || requesting) && $.sendBtnDisabled]}
              onPress={async () => {
                await handleRequest();
              }}
              disabled={!dniInput.trim() || requesting}
            >
              {requesting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={$.modalConfirmText}>Solicitar</Text>
              }
            </Pressable>
          </View>
        </View>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>

    {/* Cancel pending request modal */}
    <Modal visible={!!cancelConfirm} transparent animationType="fade" onRequestClose={() => setCancelConfirm(null)}>
      <Pressable style={$.modalOverlay} onPress={() => setCancelConfirm(null)}>
        <View style={$.modalBox}>
          <Text style={$.modalEmoji}>🚫</Text>
          <Text style={$.modalTitle}>Cancelar solicitud</Text>
          <Text style={$.modalDesc}>¿Cancelar la solicitud para {cancelConfirm?.name}?</Text>
          <View style={$.modalBtns}>
            <Pressable style={$.modalCancel} onPress={() => setCancelConfirm(null)}><Text style={$.modalCancelText}>Volver</Text></Pressable>
            <Pressable style={$.modalConfirm} onPress={handleCancel}><Text style={$.modalConfirmText}>Cancelar solicitud</Text></Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>

    {/* Unassign patient modal */}
    <Modal visible={!!unassignConfirm} transparent animationType="fade" onRequestClose={() => setUnassignConfirm(null)}>
      <Pressable style={$.modalOverlay} onPress={() => setUnassignConfirm(null)}>
        <View style={$.modalBox}>
          <Text style={$.modalEmoji}>🔓</Text>
          <Text style={$.modalTitle}>Desasignar paciente</Text>
          <Text style={$.modalDesc}>
            ¿Desasignar a {unassignConfirm?.name}?{'\n'}El paciente quedará libre de este profesional.
          </Text>
          <View style={$.modalBtns}>
            <Pressable style={$.modalCancel} onPress={() => setUnassignConfirm(null)}>
              <Text style={$.modalCancelText}>Volver</Text>
            </Pressable>
            <Pressable
              style={[$.modalConfirm, { backgroundColor: '#f59e0b' }]}
              onPress={handleUnassign}
              disabled={unassigning}
            >
              {unassigning
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={$.modalConfirmText}>Desasignar</Text>
              }
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
    </>
  );
}
