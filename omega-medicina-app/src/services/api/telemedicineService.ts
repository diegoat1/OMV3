// Telemedicine Service - Appointments, records, vitals, documents

import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

const { ENDPOINTS } = API_CONFIG;

export interface Template {
  id: number;
  user_id: string;
  type: string;
  name: string;
  description?: string;
  content?: any;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  user_id: string;
  fecha_creacion: string;
  fecha_cita: string;
  tipo_cita: string;
  especialidad?: string;
  medico_nombre?: string;
  medico_especialidad?: string;
  institucion?: string;
  direccion?: string;
  telefono?: string;
  modalidad: string;
  link_videollamada?: string;
  motivo_consulta?: string;
  estado: string;
  notas_medico?: string;
  notas_paciente?: string;
}

export interface MedicalRecord {
  id: number;
  user_id: string;
  fecha_registro: string;
  tipo_registro: string;
  categoria?: string;
  descripcion: string;
  fecha_evento?: string;
  medico_tratante?: string;
  institucion?: string;
  estado: string;
  importancia: string;
  notas?: string;
}

export interface TelemedPatient {
  id: number;
  user_id: string;
  fecha_registro: string;
  paciente_nombre: string;
  paciente_dni?: string;
  documento?: string;
  documento_tipo?: string;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  edad?: number;
  edad_calculada?: number;
  altura_cm?: number;
  peso_kg?: number;
  alergias?: string;
  patologias_previas?: string;
  antecedentes?: string;
  telefono?: string;
  es_fumador?: boolean;
  activo_sexualmente?: boolean;
  embarazo?: boolean;
  notas?: string;
}

export interface ClinicalSituation {
  id: number;
  paciente_nombre: string;
  paciente_dni?: string;
  tipo_consulta?: string;
  tipo_consulta_personalizada?: string;
  motivo_consulta?: string;
  historia_enfermedad_actual?: string;
  antecedentes_personales?: string;
  laboratorios?: string;
  estudios_complementarios?: string;
  interconsultas?: string;
  situacion_actual?: string;
  tratamiento_farmacologico?: string;
  medidas_estilo_vida?: string;
  signos_alarma?: string;
  proximos_controles?: string;
  diagnostico_cie10?: Array<{ code: string; name: string; principal: boolean }>;
  informe_dimision?: string;
  indicaciones?: string;
  resumen_clinico?: string;
  etiquetas?: string[];
  fecha_registro: string;
}

export interface VitalSign {
  id: number;
  user_id: string;
  fecha_registro: string;
  presion_sistolica?: number;
  presion_diastolica?: number;
  frecuencia_cardiaca?: number;
  temperatura?: number;
  saturacion_oxigeno?: number;
  glucosa_sangre?: number;
  peso?: number;
  nivel_dolor?: number;
  nivel_fatiga?: number;
  nivel_estres?: number;
  calidad_sueno?: number;
  horas_sueno?: number;
  estado_animo?: string;
  notas?: string;
}

export interface TelemedDocument {
  id: number;
  user_id: string;
  fecha_registro: string;
  paciente_nombre: string;
  paciente_dni?: string;
  tipo_documento: string;
  descripcion?: string;
  fecha_documento?: string;
  drive_url?: string;
  nombre_archivo?: string;
  mime_type?: string;
  tamano_archivo?: number;
  drive_file_id?: string;
  carpeta_id?: string;
  etiquetas?: string[];
  notas?: string;
}

export interface PerformanceRecord {
  id: number;
  user_id: string;
  fecha_registro: string;
  [key: string]: any;
}

export const telemedicineService = {
  // --- Appointments ---
  async getAppointments(params?: { status?: string; from_date?: string; to_date?: string; limit?: number }) {
    let endpoint = ENDPOINTS.TELEMED_APPOINTMENTS;
    const qp: string[] = [];
    if (params?.status) qp.push(`status=${params.status}`);
    if (params?.from_date) qp.push(`from_date=${params.from_date}`);
    if (params?.to_date) qp.push(`to_date=${params.to_date}`);
    if (params?.limit) qp.push(`limit=${params.limit}`);
    if (qp.length) endpoint += `?${qp.join('&')}`;
    return apiClient.get<{ appointments: Appointment[]; total: number }>(endpoint);
  },

  async getAppointment(id: number) {
    return apiClient.get<Appointment>(ENDPOINTS.TELEMED_APPOINTMENT_DETAIL, { id: String(id) });
  },

  async createAppointment(data: Partial<Appointment>) {
    return apiClient.post<{ id: number; message: string }>(ENDPOINTS.TELEMED_APPOINTMENTS, data);
  },

  async updateAppointmentStatus(id: number, estado: string) {
    return apiClient.patch<{ message: string }>(
      ENDPOINTS.TELEMED_APPOINTMENT_STATUS,
      { estado },
      { id: String(id) }
    );
  },

  // --- Medical Records ---
  async getRecords(tipo?: string) {
    let endpoint = ENDPOINTS.TELEMED_RECORDS;
    if (tipo) endpoint += `?tipo=${tipo}`;
    return apiClient.get<{ records: MedicalRecord[]; total: number }>(endpoint);
  },

  async createRecord(data: Partial<MedicalRecord>) {
    return apiClient.post<{ id: number; message: string }>(ENDPOINTS.TELEMED_RECORDS, data);
  },

  // --- Telemed Patients (full CRUD) ---
  async getPatients(paciente?: string) {
    let endpoint = ENDPOINTS.TELEMED_PATIENTS;
    if (paciente) endpoint += `?paciente=${encodeURIComponent(paciente)}`;
    return apiClient.get<{ patients: TelemedPatient[]; total: number }>(endpoint);
  },

  async getPatient(id: number) {
    return apiClient.get<TelemedPatient>(ENDPOINTS.TELEMED_PATIENT_DETAIL, { id: String(id) });
  },

  async createPatient(data: Partial<TelemedPatient>) {
    return apiClient.post<{ paciente: TelemedPatient; created: boolean }>(ENDPOINTS.TELEMED_PATIENTS, data);
  },

  async updatePatient(id: number, data: Partial<TelemedPatient>) {
    return apiClient.post<{ paciente: TelemedPatient; updated: boolean }>(ENDPOINTS.TELEMED_PATIENTS, { ...data, id });
  },

  // --- Clinical Situations (full CRUD with filters) ---
  async getSituations(params?: { paciente?: string; fecha_desde?: string; fecha_hasta?: string; cie10?: string }) {
    let endpoint = ENDPOINTS.TELEMED_SITUATIONS;
    const qp: string[] = [];
    if (params?.paciente) qp.push(`paciente=${encodeURIComponent(params.paciente)}`);
    if (params?.fecha_desde) qp.push(`fecha_desde=${params.fecha_desde}`);
    if (params?.fecha_hasta) qp.push(`fecha_hasta=${params.fecha_hasta}`);
    if (params?.cie10) qp.push(`cie10=${encodeURIComponent(params.cie10)}`);
    if (qp.length) endpoint += `?${qp.join('&')}`;
    return apiClient.get<{ situations: ClinicalSituation[]; total: number }>(endpoint);
  },

  async createSituation(data: Record<string, any>) {
    return apiClient.post<{ id: number; created: boolean }>(ENDPOINTS.TELEMED_SITUATIONS, data);
  },

  async updateSituation(id: number, data: Record<string, any>) {
    return apiClient.post<{ updated: boolean }>(ENDPOINTS.TELEMED_SITUATIONS, { ...data, id });
  },

  async deleteSituation(id: number) {
    return apiClient.delete<{ deleted: boolean }>(ENDPOINTS.TELEMED_SITUATION_DELETE, { id: String(id) });
  },

  // --- Vital Signs ---
  async getVitals(limit?: number) {
    let endpoint = ENDPOINTS.TELEMED_VITALS;
    if (limit) endpoint += `?limit=${limit}`;
    return apiClient.get<{ vitals: VitalSign[]; total: number }>(endpoint);
  },

  async createVitalSign(data: Partial<VitalSign>) {
    return apiClient.post<{ id: number; message: string }>(ENDPOINTS.TELEMED_VITALS, data);
  },

  // --- Documents (full CRUD with search) ---
  async getDocuments(params?: { paciente?: string; tipo?: string; fecha_desde?: string; fecha_hasta?: string; q?: string }) {
    let endpoint = ENDPOINTS.TELEMED_DOCUMENTS;
    const qp: string[] = [];
    if (params?.paciente) qp.push(`paciente=${encodeURIComponent(params.paciente)}`);
    if (params?.tipo) qp.push(`tipo=${encodeURIComponent(params.tipo)}`);
    if (params?.fecha_desde) qp.push(`fecha_desde=${params.fecha_desde}`);
    if (params?.fecha_hasta) qp.push(`fecha_hasta=${params.fecha_hasta}`);
    if (params?.q) qp.push(`q=${encodeURIComponent(params.q)}`);
    if (qp.length) endpoint += `?${qp.join('&')}`;
    return apiClient.get<{ documents: TelemedDocument[]; total: number }>(endpoint);
  },

  async createDocument(data: Partial<TelemedDocument>) {
    return apiClient.post<{ documento: TelemedDocument; created: boolean }>(ENDPOINTS.TELEMED_DOCUMENTS, data);
  },

  async updateDocument(id: number, data: Partial<TelemedDocument>) {
    return apiClient.put<{ documento: TelemedDocument }>(ENDPOINTS.TELEMED_DOCUMENT_DETAIL, data, { id: String(id) });
  },

  async deleteDocument(id: number) {
    return apiClient.delete<{ deleted: boolean }>(ENDPOINTS.TELEMED_DOCUMENT_DETAIL, { id: String(id) });
  },

  // --- Prevention Programs ---
  async getPreventionPrograms() {
    return apiClient.get<{ programs: any[]; total: number }>(ENDPOINTS.TELEMED_PREVENTION);
  },

  async createPreventionProgram(data: Record<string, any>) {
    return apiClient.post<{ id: number; message: string }>(ENDPOINTS.TELEMED_PREVENTION, data);
  },

  // --- Body Measurements ---
  async getBodyMeasurements() {
    return apiClient.get<{ registros: PerformanceRecord[]; total: number }>(ENDPOINTS.TELEMED_BODY_MEASUREMENTS);
  },

  async createBodyMeasurement(data: Record<string, any>) {
    return apiClient.post<{ id: number; message: string }>(ENDPOINTS.TELEMED_BODY_MEASUREMENTS, data);
  },

  // --- Performance Tests ---
  async getPerformanceTests(type: 'speed' | 'flexibility' | 'mobility' | 'endurance') {
    const endpointMap = {
      speed: ENDPOINTS.TELEMED_PERF_SPEED,
      flexibility: ENDPOINTS.TELEMED_PERF_FLEXIBILITY,
      mobility: ENDPOINTS.TELEMED_PERF_MOBILITY,
      endurance: ENDPOINTS.TELEMED_PERF_ENDURANCE,
    };
    return apiClient.get<{ registros: PerformanceRecord[]; total: number }>(endpointMap[type]);
  },

  async createPerformanceTest(type: 'speed' | 'flexibility' | 'mobility' | 'endurance', data: Record<string, any>) {
    const endpointMap = {
      speed: ENDPOINTS.TELEMED_PERF_SPEED,
      flexibility: ENDPOINTS.TELEMED_PERF_FLEXIBILITY,
      mobility: ENDPOINTS.TELEMED_PERF_MOBILITY,
      endurance: ENDPOINTS.TELEMED_PERF_ENDURANCE,
    };
    return apiClient.post<{ id: number; message: string }>(endpointMap[type], data);
  },

  // --- Templates ---
  async getTemplates(type?: string) {
    const endpoint = type
      ? `${ENDPOINTS.TELEMED_TEMPLATES}?type=${type}`
      : ENDPOINTS.TELEMED_TEMPLATES;
    return apiClient.get<{ templates: Template[]; total: number }>(endpoint);
  },

  async createTemplate(data: { name: string; type: string; description?: string; content?: any }) {
    return apiClient.post<{ id: number; message: string }>(ENDPOINTS.TELEMED_TEMPLATES, data);
  },

  async updateTemplate(id: number, data: Partial<{ name: string; type: string; description: string; content: any; is_active: boolean }>) {
    return apiClient.put<{ message: string }>(ENDPOINTS.TELEMED_TEMPLATE_DETAIL, data, { id: String(id) });
  },

  async deleteTemplate(id: number) {
    return apiClient.delete<{ message: string }>(ENDPOINTS.TELEMED_TEMPLATE_DETAIL, { id: String(id) });
  },
};
