// usePermissions - Hook to check professional permissions for a patient

import { useState, useEffect, useCallback } from 'react';
import { permissionsStorage } from '../services/permissionsStorage';
import { ModulePermission, PatientProfessionalPermission } from '../models';

interface UsePermissionsResult {
  canEdit: (module: ModulePermission) => boolean;
  isLoading: boolean;
  permission: PatientProfessionalPermission | null;
  refresh: () => Promise<void>;
}

export function usePermissions(
  professionalId: string | undefined,
  patientId: string | undefined
): UsePermissionsResult {
  const [permission, setPermission] = useState<PatientProfessionalPermission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPermission = useCallback(async () => {
    if (!professionalId || !patientId) {
      setPermission(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const perm = await permissionsStorage.getPermission(professionalId, patientId);
      setPermission(perm);
    } catch (error) {
      console.error('Error loading permission:', error);
      setPermission(null);
    } finally {
      setIsLoading(false);
    }
  }, [professionalId, patientId]);

  useEffect(() => {
    loadPermission();
  }, [loadPermission]);

  const canEdit = useCallback((module: ModulePermission): boolean => {
    if (!permission) return false;
    return permission.modules[module] === true;
  }, [permission]);

  return {
    canEdit,
    isLoading,
    permission,
    refresh: loadPermission,
  };
}

// Simplified hook for checking a single module
export function useCanEditModule(
  professionalId: string | undefined,
  patientId: string | undefined,
  module: ModulePermission
): { canEdit: boolean; isLoading: boolean } {
  const { canEdit, isLoading } = usePermissions(professionalId, patientId);
  
  return {
    canEdit: canEdit(module),
    isLoading,
  };
}
