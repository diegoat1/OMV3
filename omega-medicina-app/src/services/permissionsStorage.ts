// Permissions Storage Service - Local storage for patient permissions
// Prepared for backend integration

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PatientProfessionalPermission, ProfessionalRole, ModulePermission } from '../models';

const PERMISSIONS_KEY = '@omega_patient_permissions';

// Default permissions data
const defaultPermissions: PatientProfessionalPermission[] = [
  {
    patientId: 'patient-001',
    professionalId: 'doctor-001',
    professionalRole: 'doctor',
    professionalName: 'Dr. Diego Toffaletti',
    modules: { medical: true, nutrition: true, training: false },
    assignedAt: '2025-01-15T10:00:00Z',
    assignedBy: 'admin-001',
  },
  {
    patientId: 'patient-001',
    professionalId: 'nutritionist-001',
    professionalRole: 'nutritionist',
    professionalName: 'Lic. Ana Nutrición',
    modules: { medical: false, nutrition: true, training: false },
    assignedAt: '2025-01-20T10:00:00Z',
    assignedBy: 'admin-001',
  },
  {
    patientId: 'patient-002',
    professionalId: 'doctor-001',
    professionalRole: 'doctor',
    professionalName: 'Dr. Diego Toffaletti',
    modules: { medical: true, nutrition: true, training: true },
    assignedAt: '2025-01-10T10:00:00Z',
    assignedBy: 'admin-001',
  },
];

class PermissionsStorageService {
  private permissions: PatientProfessionalPermission[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(PERMISSIONS_KEY);
      if (stored) {
        this.permissions = JSON.parse(stored);
      } else {
        // Initialize with defaults
        this.permissions = defaultPermissions;
        await this.save();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error loading permissions:', error);
      this.permissions = defaultPermissions;
      this.initialized = true;
    }
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSIONS_KEY, JSON.stringify(this.permissions));
    } catch (error) {
      console.error('Error saving permissions:', error);
    }
  }

  // Get all permissions for a patient
  async getPatientPermissions(patientId: string): Promise<PatientProfessionalPermission[]> {
    await this.init();
    return this.permissions.filter(p => p.patientId === patientId);
  }

  // Get all permissions for a professional
  async getProfessionalPermissions(professionalId: string): Promise<PatientProfessionalPermission[]> {
    await this.init();
    return this.permissions.filter(p => p.professionalId === professionalId);
  }

  // Check if professional can edit a specific module for a patient
  async canEdit(
    professionalId: string, 
    patientId: string, 
    module: ModulePermission
  ): Promise<boolean> {
    await this.init();
    const permission = this.permissions.find(
      p => p.professionalId === professionalId && p.patientId === patientId
    );
    if (!permission) return false;
    return permission.modules[module] === true;
  }

  // Get specific permission
  async getPermission(
    professionalId: string, 
    patientId: string
  ): Promise<PatientProfessionalPermission | null> {
    await this.init();
    return this.permissions.find(
      p => p.professionalId === professionalId && p.patientId === patientId
    ) || null;
  }

  // Set or update permission
  async setPermission(permission: PatientProfessionalPermission): Promise<void> {
    await this.init();
    const index = this.permissions.findIndex(
      p => p.professionalId === permission.professionalId && p.patientId === permission.patientId
    );
    
    if (index >= 0) {
      this.permissions[index] = permission;
    } else {
      this.permissions.push(permission);
    }
    
    await this.save();
  }

  // Toggle a specific module permission
  async toggleModulePermission(
    professionalId: string,
    patientId: string,
    module: ModulePermission
  ): Promise<boolean> {
    await this.init();
    const permission = this.permissions.find(
      p => p.professionalId === professionalId && p.patientId === patientId
    );
    
    if (!permission) return false;
    
    permission.modules[module] = !permission.modules[module];
    await this.save();
    return permission.modules[module];
  }

  // Remove permission (unassign professional from patient)
  async removePermission(professionalId: string, patientId: string): Promise<void> {
    await this.init();
    this.permissions = this.permissions.filter(
      p => !(p.professionalId === professionalId && p.patientId === patientId)
    );
    await this.save();
  }

  // Get all permissions (for admin view)
  async getAllPermissions(): Promise<PatientProfessionalPermission[]> {
    await this.init();
    return [...this.permissions];
  }

  // Add new professional assignment
  async assignProfessional(
    patientId: string,
    professionalId: string,
    professionalRole: ProfessionalRole,
    professionalName: string,
    modules: { medical: boolean; nutrition: boolean; training: boolean },
    assignedBy: string
  ): Promise<void> {
    await this.init();
    
    const newPermission: PatientProfessionalPermission = {
      patientId,
      professionalId,
      professionalRole,
      professionalName,
      modules,
      assignedAt: new Date().toISOString(),
      assignedBy,
    };
    
    // Remove existing if any
    this.permissions = this.permissions.filter(
      p => !(p.professionalId === professionalId && p.patientId === patientId)
    );
    
    this.permissions.push(newPermission);
    await this.save();
  }

  // Reset to defaults (for testing)
  async reset(): Promise<void> {
    this.permissions = defaultPermissions;
    await this.save();
  }
}

export const permissionsStorage = new PermissionsStorageService();
