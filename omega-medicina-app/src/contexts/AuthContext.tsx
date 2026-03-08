// Authentication Context - Manages user auth state across the app

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../services/storage/secureStorage';
import { apiClient } from '../services/api/apiClient';
import { API_CONFIG, buildUrl } from '../services/api/config';

const ACTIVE_ROLE_KEY = 'omega_active_role';
const REMEMBER_ROLE_KEY = 'omega_remember_role';

interface AuthUser {
  id: string;
  dni: string;
  email: string;
  nombre_apellido: string;
  sexo?: string;
  altura?: number;
  telefono?: string;
  fecha_nacimiento?: string;
  rol: string;
  is_admin: boolean;
}

interface UserPermissions {
  canBePatient: boolean;
  canBeDoctor: boolean;
  canBeAdmin: boolean;
  canBeNutritionist: boolean;
  canBeTrainer: boolean;
}

interface AuthContextType {
  user: (AuthUser & { role?: string; permissions?: UserPermissions }) | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: string | null;
  isAdmin: boolean;
  permissions: UserPermissions;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => void;
}

const defaultPermissions: UserPermissions = {
  canBePatient: true,
  canBeDoctor: false,
  canBeAdmin: false,
  canBeNutritionist: false,
  canBeTrainer: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await apiClient.getToken();
        
        if (token) {
          // Check if user has a remembered role — only restore session if so
          const rememberedRole = await AsyncStorage.getItem(REMEMBER_ROLE_KEY);
          const savedRole = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);

          if (rememberedRole !== 'true' || !savedRole) {
            // No remembered role → clear stale session, force fresh login
            await apiClient.removeToken();
            await secureStorage.removeUser();
            await AsyncStorage.multiRemove([ACTIVE_ROLE_KEY, REMEMBER_ROLE_KEY]);
          } else {
            // Has remembered role → validate token and restore session
            try {
              const res = await fetch(buildUrl(API_CONFIG.ENDPOINTS.ME), {
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (res.ok) {
                const json = await res.json();
                if (json.success && json.data?.user) {
                  const u = json.data.user;
                  // Normalize: /me may return user_id instead of id
                  if (!u.id && u.user_id) u.id = u.user_id;
                  setUser(u);
                  await secureStorage.setUser(u);
                } else {
                  await apiClient.removeToken();
                  await secureStorage.removeUser();
                  await AsyncStorage.multiRemove([ACTIVE_ROLE_KEY, REMEMBER_ROLE_KEY]);
                }
              } else {
                // Token invalid/expired - clear everything, force re-login
                await apiClient.removeToken();
                await secureStorage.removeUser();
                await AsyncStorage.multiRemove([ACTIVE_ROLE_KEY, REMEMBER_ROLE_KEY]);
              }
            } catch {
              // API unreachable - use cached user as fallback (offline mode)
              const cachedUser = await secureStorage.getUser();
              if (cachedUser) {
                setUser(cachedUser);
              }
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        try {
          await apiClient.removeToken();
          await secureStorage.removeUser();
        } catch (e) {
          // Ignore storage errors
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const res = await fetch(buildUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const { user: userData, token } = json.data;
        
        await apiClient.setToken(token);
        await secureStorage.setUser(userData);
        setUser(userData);

        return { success: true };
      }

      // Detectar cuenta pendiente de verificación
      if (json.error?.code === 'PENDING_VERIFICATION') {
        return { success: false, error: json.message, code: 'PENDING_VERIFICATION' };
      }

      return { success: false, error: json.message || 'Credenciales inválidas' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: 'Error de conexión. Verificá que el servidor esté activo.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await apiClient.removeToken();
      await secureStorage.removeUser();
      // Also clear role selection so next login starts fresh
      await AsyncStorage.multiRemove([ACTIVE_ROLE_KEY, REMEMBER_ROLE_KEY]);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((userData: Partial<AuthUser>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      secureStorage.setUser(updatedUser);
    }
  }, [user]);

  // Compute permissions from comma-separated role string (e.g. "admin,doctor,user")
  const userRoles = new Set((user?.rol || '').split(',').map(r => r.trim()).filter(Boolean));
  const computedPermissions: UserPermissions = user ? {
    canBePatient: true,
    canBeDoctor: userRoles.has('admin') || userRoles.has('doctor'),
    canBeAdmin: user.is_admin || userRoles.has('admin'),
    canBeNutritionist: userRoles.has('admin') || userRoles.has('nutricionista'),
    canBeTrainer: userRoles.has('admin') || userRoles.has('entrenador'),
  } : defaultPermissions;

  const value: AuthContextType = {
    user: user ? { ...user, role: user.rol, permissions: computedPermissions } : null,
    isAuthenticated: !!user,
    isLoading,
    role: user?.rol || null,
    isAdmin: user?.is_admin || false,
    permissions: computedPermissions,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
