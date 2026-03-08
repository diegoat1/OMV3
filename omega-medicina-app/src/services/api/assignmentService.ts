// Assignment Service - Specialist-patient assignments

import { apiClient } from './apiClient';
import { API_CONFIG } from './config';

const { ENDPOINTS } = API_CONFIG;

export interface Assignment {
  id: number;
  specialist_id: number;
  patient_id: number;
  specialist_name?: string;
  patient_name?: string;
  specialist_role?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export const assignmentService = {
  async requestAssignment(patientDni: string) {
    return apiClient.post<Assignment>(ENDPOINTS.ASSIGNMENT_REQUEST, { patient_dni: patientDni });
  },

  async getMyRequests() {
    return apiClient.get<Assignment[]>(ENDPOINTS.ASSIGNMENT_MY_REQUESTS);
  },

  async getPendingForPatient() {
    return apiClient.get<Assignment[]>(ENDPOINTS.ASSIGNMENT_PENDING);
  },

  async acceptAssignment(assignmentId: number) {
    return apiClient.post<Assignment>(ENDPOINTS.ASSIGNMENT_ACCEPT, {}, { id: String(assignmentId) });
  },

  async rejectAssignment(assignmentId: number) {
    return apiClient.post<Assignment>(ENDPOINTS.ASSIGNMENT_REJECT, {}, { id: String(assignmentId) });
  },

  async cancelAssignment(assignmentId: number) {
    return apiClient.post<Assignment>(ENDPOINTS.ASSIGNMENT_CANCEL, {}, { id: String(assignmentId) });
  },

  async getMySpecialists() {
    return apiClient.get<Assignment[]>(ENDPOINTS.ASSIGNMENT_MY_SPECIALISTS);
  },

  async getMyPatients() {
    return apiClient.get<Assignment[]>(ENDPOINTS.ASSIGNMENT_MY_PATIENTS);
  },

  async unassignPatient(patientId: number) {
    return apiClient.post(ENDPOINTS.ASSIGNMENT_UNASSIGN_PATIENT, {}, { id: String(patientId) });
  },
};
