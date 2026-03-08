// RoleHeader Component Integration Tests
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RoleHeader } from '../RoleHeader';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      nombre_apellido: 'Pérez García, Juan',
      email: 'juan.perez@example.com',
    },
    logout: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('../contexts/RoleContext', () => ({
  useRole: () => ({
    activeRole: 'patient',
    setActiveRole: jest.fn().mockResolvedValue(undefined),
    canAssumeRole: jest.fn().mockReturnValue(true),
    clearActiveRole: jest.fn().mockResolvedValue(undefined),
  }),
  getRoleDisplayName: jest.fn((role) => {
    const names = {
      patient: 'Paciente',
      doctor: 'Médico',
      nutritionist: 'Nutricionista',
      trainer: 'Entrenador',
      admin: 'Administrador',
    };
    return names[role] || role;
  }),
  getRoleIcon: jest.fn((role) => {
    const icons = {
      patient: '👤',
      doctor: '👨‍⚕️',
      nutritionist: '🥗',
      trainer: '💪',
      admin: '👑',
    };
    return icons[role] || '❓';
  }),
}));

jest.mock('../hooks/useScale', () => ({
  useScale: () => ({
    s: (value: number) => value,
  }),
}));

describe('RoleHeader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with user display name', () => {
    const { getByText } = render(<RoleHeader />);

    expect(getByText('Pérez García')).toBeTruthy(); // Display name extracted from nombre_apellido
  });

  it('displays current active role', () => {
    const { getByText } = render(<RoleHeader />);

    expect(getByText('👤')).toBeTruthy(); // Patient icon
    expect(getByText('Paciente')).toBeTruthy(); // Patient display name
  });

  it('opens role selection modal when role button is pressed', () => {
    const { getByText, queryByText } = render(<RoleHeader />);

    // Modal should not be visible initially
    expect(queryByText('Seleccionar Rol')).toBeNull();

    // Press the role button
    fireEvent.press(getByText('👤'));

    // Modal should now be visible
    expect(getByText('Seleccionar Rol')).toBeTruthy();
  });

  it('shows available roles in modal', () => {
    const { getByText } = render(<RoleHeader />);

    // Open modal
    fireEvent.press(getByText('👤'));

    // Check that roles are displayed
    expect(getByText('👤 Paciente')).toBeTruthy();
    expect(getByText('👨‍⚕️ Médico')).toBeTruthy();
    expect(getByText('🥗 Nutricionista')).toBeTruthy();
    expect(getByText('💪 Entrenador')).toBeTruthy();
    expect(getByText('👑 Administrador')).toBeTruthy();
  });

  it('calls setActiveRole and navigates when role is selected', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    // Override the mock for this test
    jest.mocked(require('../contexts/RoleContext').useRole).mockReturnValue({
      activeRole: 'patient',
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(true),
      clearActiveRole: jest.fn().mockResolvedValue(undefined),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleHeader />);

    // Open modal and select doctor role
    fireEvent.press(getByText('👤')); // Open modal
    fireEvent.press(getByText('👨‍⚕️ Médico')); // Select doctor

    // Wait for async operations
    await waitFor(() => {
      expect(mockSetActiveRole).toHaveBeenCalledWith('doctor');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(doctor)/home');
    });
  });

  it('navigates to admin dashboard when admin role is selected', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../contexts/RoleContext').useRole).mockReturnValue({
      activeRole: 'patient',
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(true),
      clearActiveRole: jest.fn().mockResolvedValue(undefined),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleHeader />);

    // Open modal and select admin role
    fireEvent.press(getByText('👤'));
    fireEvent.press(getByText('👑 Administrador'));

    await waitFor(() => {
      expect(mockSetActiveRole).toHaveBeenCalledWith('admin');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(admin)/dashboard');
    });
  });

  it('navigates to patient home when patient role is selected', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../contexts/RoleContext').useRole).mockReturnValue({
      activeRole: 'doctor',
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(true),
      clearActiveRole: jest.fn().mockResolvedValue(undefined),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleHeader />);

    // Open modal and select patient role
    fireEvent.press(getByText('👨‍⚕️')); // Current role display
    fireEvent.press(getByText('👤 Paciente'));

    await waitFor(() => {
      expect(mockSetActiveRole).toHaveBeenCalledWith('patient');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(patient)/home');
    });
  });

  it('handles logout correctly', async () => {
    const mockLogout = jest.fn().mockResolvedValue(undefined);
    const mockClearActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../contexts/AuthContext').useAuth).mockReturnValue({
      user: { nombre_apellido: 'Test User' },
      logout: mockLogout,
    });

    jest.mocked(require('../contexts/RoleContext').useRole).mockReturnValue({
      activeRole: 'patient',
      setActiveRole: jest.fn(),
      canAssumeRole: jest.fn().mockReturnValue(true),
      clearActiveRole: mockClearActiveRole,
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleHeader />);

    // Open modal and press logout
    fireEvent.press(getByText('👤'));
    fireEvent.press(getByText('Cerrar Sesión'));

    await waitFor(() => {
      expect(mockClearActiveRole).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouterReplace).toHaveBeenCalledWith('/(public)');
    });
  });

  it('does not change role if canAssumeRole returns false', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../contexts/RoleContext').useRole).mockReturnValue({
      activeRole: 'patient',
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(false), // Cannot assume role
      clearActiveRole: jest.fn().mockResolvedValue(undefined),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleHeader />);

    // Try to select doctor role
    fireEvent.press(getByText('👤'));
    fireEvent.press(getByText('👨‍⚕️ Médico'));

    // Should not call setActiveRole or navigate
    await waitFor(() => {
      expect(mockSetActiveRole).not.toHaveBeenCalled();
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  it('handles user without nombre_apellido', () => {
    jest.mocked(require('../contexts/AuthContext').useAuth).mockReturnValue({
      user: { email: 'test@example.com' }, // No nombre_apellido
      logout: jest.fn(),
    });

    const { getByText } = render(<RoleHeader />);

    expect(getByText('Usuario')).toBeTruthy(); // Default display name
  });

  it('closes modal when cancel is pressed', () => {
    const { getByText, queryByText } = render(<RoleHeader />);

    // Open modal
    fireEvent.press(getByText('👤'));
    expect(getByText('Seleccionar Rol')).toBeTruthy();

    // Press cancel
    fireEvent.press(getByText('Cancelar'));

    // Modal should be closed
    expect(queryByText('Seleccionar Rol')).toBeNull();
  });
});
