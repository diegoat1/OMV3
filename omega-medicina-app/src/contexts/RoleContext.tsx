// Role Context - Manages active role state and role switching

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActiveRole, UserPermissions } from '../models';

const ACTIVE_ROLE_KEY = 'omega_active_role';
const REMEMBER_ROLE_KEY = 'omega_remember_role';

interface RoleContextType {
  activeRole: ActiveRole | null;
  permissions: UserPermissions;
  rememberChoice: boolean;
  setActiveRole: (role: ActiveRole) => Promise<void>;
  setRememberChoice: (remember: boolean) => Promise<void>;
  clearActiveRole: () => Promise<void>;
  canAssumeRole: (role: ActiveRole) => boolean;
  isRoleSelected: boolean;
}

const defaultPermissions: UserPermissions = {
  canBePatient: true,
  canBeDoctor: false,
  canBeAdmin: false,
  canBeNutritionist: false,
  canBeTrainer: false,
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: React.ReactNode;
  userPermissions?: UserPermissions;
}

export function RoleProvider({ children, userPermissions = defaultPermissions }: RoleProviderProps) {
  const [activeRole, setActiveRoleState] = useState<ActiveRole | null>(null);
  const [rememberChoice, setRememberChoiceState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>(userPermissions);

  // Update permissions when userPermissions prop changes
  useEffect(() => {
    setPermissions(userPermissions);
  }, [userPermissions]);

  // Load saved role on mount
  useEffect(() => {
    const loadSavedRole = async () => {
      try {
        const [savedRole, savedRemember] = await Promise.all([
          AsyncStorage.getItem(ACTIVE_ROLE_KEY),
          AsyncStorage.getItem(REMEMBER_ROLE_KEY),
        ]);

        const shouldRemember = savedRemember === 'true';
        setRememberChoiceState(shouldRemember);

        if (shouldRemember && savedRole) {
          const role = savedRole as ActiveRole;
          // Verify user still has permission for this role
          if (canAssumeRoleCheck(role, userPermissions)) {
            setActiveRoleState(role);
          }
        }
      } catch (error) {
        console.error('Error loading saved role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedRole();
  }, [userPermissions]);

  const canAssumeRoleCheck = (role: ActiveRole, perms: UserPermissions): boolean => {
    switch (role) {
      case 'patient':
        return perms.canBePatient;
      case 'doctor':
        return perms.canBeDoctor;
      case 'admin':
        return perms.canBeAdmin;
      case 'nutritionist':
        return perms.canBeNutritionist;
      case 'trainer':
        return perms.canBeTrainer;
      default:
        return false;
    }
  };

  const canAssumeRole = useCallback((role: ActiveRole): boolean => {
    return canAssumeRoleCheck(role, permissions);
  }, [permissions]);

  const setActiveRole = useCallback(async (role: ActiveRole) => {
    if (!canAssumeRoleCheck(role, permissions)) {
      console.warn(`User does not have permission to assume role: ${role}`);
      return;
    }

    setActiveRoleState(role);
    
    try {
      await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
    } catch (error) {
      console.error('Error saving active role:', error);
    }
  }, [permissions]);

  const setRememberChoice = useCallback(async (remember: boolean) => {
    setRememberChoiceState(remember);
    
    try {
      await AsyncStorage.setItem(REMEMBER_ROLE_KEY, remember.toString());
      
      // If not remembering, clear the saved role
      if (!remember) {
        await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
      }
    } catch (error) {
      console.error('Error saving remember choice:', error);
    }
  }, []);

  const clearActiveRole = useCallback(async () => {
    setActiveRoleState(null);
    
    try {
      await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
    } catch (error) {
      console.error('Error clearing active role:', error);
    }
  }, []);

  const value: RoleContextType = {
    activeRole,
    permissions,
    rememberChoice,
    setActiveRole,
    setRememberChoice,
    clearActiveRole,
    canAssumeRole,
    isRoleSelected: activeRole !== null,
  };

  if (isLoading) {
    return null; // Or a loading component
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

// Helper to get role display name
export function getRoleDisplayName(role: ActiveRole): string {
  switch (role) {
    case 'patient':
      return 'Paciente';
    case 'doctor':
      return 'Médico';
    case 'nutritionist':
      return 'Nutricionista';
    case 'trainer':
      return 'Entrenador';
    case 'admin':
      return 'Administrador';
    default:
      return role;
  }
}

// Helper to get role icon
export function getRoleIcon(role: ActiveRole): string {
  switch (role) {
    case 'patient':
      return '👤';
    case 'doctor':
      return '👨‍⚕️';
    case 'nutritionist':
      return '🥗';
    case 'trainer':
      return '🏋️';
    case 'admin':
      return '⚙️';
    default:
      return '👤';
  }
}
