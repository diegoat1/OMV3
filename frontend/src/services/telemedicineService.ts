import { api } from './apiClient'
import type {
  Appointment,
  AppointmentStatus,
  AppointmentsResponse,
  ClinicalSituation,
  CreateAppointmentPayload,
  CreateMedicalRecordPayload,
  MedicalDocumentsResponse,
  MedicalRecord,
  MedicalRecordsResponse,
  SituationsResponse,
  VitalsResponse,
  CreateMobilityPayload,
  MobilityListResponse,
} from '../types/api'

/** Build a query string from a filter object, skipping undefined/empty values. */
function qs(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === null) continue
    usp.set(k, String(v))
  }
  const s = usp.toString()
  return s ? `?${s}` : ''
}

export const telemedicineService = {
  /* ──────────── Appointments ──────────── */
  listAppointments(opts: {
    status?: AppointmentStatus
    from_date?: string
    to_date?: string
    limit?: number
  } = {}): Promise<AppointmentsResponse> {
    return api.get<AppointmentsResponse>(`/telemedicine/appointments${qs(opts)}`)
  },
  getAppointment(appointmentId: number): Promise<Appointment> {
    return api.get<Appointment>(`/telemedicine/appointments/${appointmentId}`)
  },
  createAppointment(payload: CreateAppointmentPayload): Promise<{ id: number; message: string }> {
    return api.post<{ id: number; message: string }>('/telemedicine/appointments', payload)
  },
  /** PATCH /appointments/<id>/status — body { estado }. */
  updateAppointmentStatus(appointmentId: number, estado: AppointmentStatus): Promise<{ message: string }> {
    return api.patch<{ message: string }>(`/telemedicine/appointments/${appointmentId}/status`, { estado })
  },

  /* ──────────── Medical records / history ──────────── */
  listRecords(opts: { tipo?: string; limit?: number } = {}): Promise<MedicalRecordsResponse> {
    return api.get<MedicalRecordsResponse>(`/telemedicine/records${qs(opts)}`)
  },
  createRecord(payload: CreateMedicalRecordPayload): Promise<MedicalRecord> {
    return api.post<MedicalRecord>('/telemedicine/records', payload)
  },

  /* ──────────── Clinical situations ──────────── */
  listSituations(opts: { activa?: number; limit?: number } = {}): Promise<SituationsResponse> {
    return api.get<SituationsResponse>(`/telemedicine/situations${qs(opts)}`)
  },
  saveSituation(payload: Partial<ClinicalSituation>): Promise<ClinicalSituation> {
    return api.post<ClinicalSituation>('/telemedicine/situations', payload)
  },
  deleteSituation(situacionId: number): Promise<{ id: number }> {
    return api.delete<{ id: number }>(`/telemedicine/situations/${situacionId}`)
  },

  /* ──────────── Documents ──────────── */
  listDocuments(opts: { tipo?: string; limit?: number } = {}): Promise<MedicalDocumentsResponse> {
    return api.get<MedicalDocumentsResponse>(`/telemedicine/documents${qs(opts)}`)
  },

  /* ──────────── Vitals ──────────── */
  listVitals(opts: { limit?: number } = {}): Promise<VitalsResponse> {
    return api.get<VitalsResponse>(`/telemedicine/vitals${qs(opts)}`)
  },
  createVital(payload: Partial<VitalsResponse['vitals'][number]>) {
    return api.post<{ id: number }>('/telemedicine/vitals', payload)
  },

  /* ──────────── Telemed patients ──────────── */
  /** GET /telemedicine/patients — listado clínico independiente del de auth. */
  listTelemedPatients(): Promise<{ patients: Array<Record<string, unknown>>; total: number }> {
    return api.get('/telemedicine/patients')
  },
  getTelemedPatient(patientId: number) {
    return api.get(`/telemedicine/patients/${patientId}`)
  },
  saveTelemedPatient(payload: Record<string, unknown>) {
    return api.post<{ id: number }>('/telemedicine/patients', payload)
  },

  /* ──────────── Documents (POST / PUT / DELETE) ──────────── */
  createDocument(payload: Record<string, unknown>) {
    return api.post<{ id: number }>('/telemedicine/documents', payload)
  },
  updateDocument(documentId: number, payload: Record<string, unknown>) {
    return api.put<{ id: number }>(`/telemedicine/documents/${documentId}`, payload)
  },
  deleteDocument(documentId: number) {
    return api.delete<{ id: number }>(`/telemedicine/documents/${documentId}`)
  },

  /* ──────────── Prevention ──────────── */
  listPrevention(): Promise<{ programs: Array<Record<string, unknown>>; total: number }> {
    return api.get('/telemedicine/prevention')
  },
  createPrevention(payload: Record<string, unknown>) {
    return api.post<{ id: number }>('/telemedicine/prevention', payload)
  },

  /* ──────────── Body measurements ──────────── */
  listBodyMeasurements(opts: { limit?: number } = {}) {
    return api.get(`/telemedicine/body-measurements${qs(opts)}`)
  },
  createBodyMeasurement(payload: Record<string, unknown>) {
    return api.post<{ id: number }>('/telemedicine/body-measurements', payload)
  },

  /* ──────────── Performance ─ speed / flexibility / mobility / endurance ──────────── */
  listSpeed() { return api.get('/telemedicine/performance/speed') },
  createSpeed(payload: Record<string, unknown>) { return api.post('/telemedicine/performance/speed', payload) },
  listFlexibility() { return api.get('/telemedicine/performance/flexibility') },
  createFlexibility(payload: Record<string, unknown>) { return api.post('/telemedicine/performance/flexibility', payload) },
  /** GET mobility tests. `user` (nombre/id del paciente) solo lo usa el profesional. */
  listMobility(user?: string): Promise<MobilityListResponse> {
    return api.get<MobilityListResponse>(`/telemedicine/performance/mobility${qs({ user })}`)
  },
  createMobility(payload: CreateMobilityPayload): Promise<{ id: number; message: string }> {
    return api.post<{ id: number; message: string }>('/telemedicine/performance/mobility', payload)
  },
  listEndurance() { return api.get('/telemedicine/performance/endurance') },
  createEndurance(payload: Record<string, unknown>) { return api.post('/telemedicine/performance/endurance', payload) },

  /* ──────────── Templates (record templates) ──────────── */
  listTemplates() { return api.get('/telemedicine/templates') },
  createTemplate(payload: Record<string, unknown>) { return api.post<{ id: number }>('/telemedicine/templates', payload) },
  updateTemplate(templateId: number, payload: Record<string, unknown>) { return api.put<{ id: number }>(`/telemedicine/templates/${templateId}`, payload) },
  deleteTemplate(templateId: number) { return api.delete<{ id: number }>(`/telemedicine/templates/${templateId}`) },
}
