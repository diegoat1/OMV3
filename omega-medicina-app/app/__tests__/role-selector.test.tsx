// Role Selector Screen Integration Tests
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RoleSelector from '../role-selector';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      nombre_apellido: 'Test User',
      email: 'test@example.com',
    },
    logout: jest.fn(),
  }),
}));

jest.mock('../src/contexts/RoleContext', () => ({
  useRole: () => ({
    activeRole: null,
    setActiveRole: jest.fn().mockResolvedValue(undefined),
    canAssumeRole: jest.fn().mockReturnValue(true),
    clearActiveRole: jest.fn(),
  }),
}));

jest.mock('../src/hooks/useScale', () => ({
  useScale: () => ({
    s: (value: number) => value,
  }),
}));

// Mock Image component
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Image = ({ source, ...props }: any) => {
    return <RN.View {...props} testID="mock-image" />;
  };
  return RN;
});

describe('RoleSelector Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all role options', () => {
    const { getByText } = render(<RoleSelector />);

    expect(getByText('💪')).toBeTruthy();
    expect(getByText('Paciente')).toBeTruthy();
    expect(getByText('Registrá métricas, seguí tu plan y revisá tu progreso')).toBeTruthy();

    expect(getByText('🩺')).toBeTruthy();
    expect(getByText('Médico')).toBeTruthy();
    expect(getByText('Gestioná pacientes, turnos y registros médicos')).toBeTruthy();

    expect(getByText('🥗')).toBeTruthy();
    expect(getByText('Nutricionista')).toBeTruthy();
    expect(getByText('Planes nutricionales, dietas y seguimiento alimentario')).toBeTruthy();

    expect(getByText('🏋️')).toBeTruthy();
    expect(getByText('Entrenador')).toBeTruthy();
  });

  it('shows welcome message with user name', () => {
    const { getByText } = render(<RoleSelector />);

    expect(getByText('¡Bienvenido, Test!')).toBeTruthy();
  });

  it('displays logo', () => {
    const { getByTestId } = render(<RoleSelector />);

    expect(getByTestId('mock-image')).toBeTruthy();
  });

  it('navigates to correct screen when role is selected', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../src/contexts/RoleContext').useRole).mockReturnValue({
      activeRole: null,
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(true),
      clearActiveRole: jest.fn(),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleSelector />);

    // Select patient role
    fireEvent.press(getByText('Paciente'));

    await waitFor(() => {
      expect(mockSetActiveRole).toHaveBeenCalledWith('patient');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(patient)/home');
    });
  });

  it('navigates to doctor home for doctor role', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../src/contexts/RoleContext').useRole).mockReturnValue({
      activeRole: null,
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(true),
      clearActiveRole: jest.fn(),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleSelector />);

    // Select doctor role
    fireEvent.press(getByText('Médico'));

    await waitFor(() => {
      expect(mockSetActiveRole).toHaveBeenCalledWith('doctor');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(doctor)/home');
    });
  });

  it('navigates to doctor home for nutritionist role', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../src/contexts/RoleContext').useRole).mockReturnValue({
      activeRole: null,
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(true),
      clearActiveRole: jest.fn(),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleSelector />);

    // Select nutritionist role
    fireEvent.press(getByText('Nutricionista'));

    await waitFor(() => {
      expect(mockSetActiveRole).toHaveBeenCalledWith('nutritionist');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(doctor)/home');
    });
  });

  it('navigates to doctor home for trainer role', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../src/contexts/RoleContext').useRole).mockReturnValue({
      activeRole: null,
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(true),
      clearActiveRole: jest.fn(),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleSelector />);

    // Select trainer role
    fireEvent.press(getByText('Entrenador'));

    await waitFor(() => {
      expect(mockSetActiveRole).toHaveBeenCalledWith('trainer');
      expect(mockRouterReplace).toHaveBeenCalledWith('/(doctor)/home');
    });
  });

  it('does not navigate if role cannot be assumed', async () => {
    const mockSetActiveRole = jest.fn().mockResolvedValue(undefined);
    const mockRouterReplace = jest.fn();

    jest.mocked(require('../src/contexts/RoleContext').useRole).mockReturnValue({
      activeRole: null,
      setActiveRole: mockSetActiveRole,
      canAssumeRole: jest.fn().mockReturnValue(false), // Cannot assume role
      clearActiveRole: jest.fn(),
    });

    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      replace: mockRouterReplace,
    });

    const { getByText } = render(<RoleSelector />);

    // Try to select patient role
    fireEvent.press(getByText('Paciente'));

    // Should not call setActiveRole or navigate
    await waitFor(() => {
      expect(mockSetActiveRole).not.toHaveBeenCalled();
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  it('handles user without nombre_apellido', () => {
    jest.mocked(require('../src/contexts/AuthContext').useAuth).mockReturnValue({
      user: { email: 'test@example.com' }, // No nombre_apellido
      logout: jest.fn(),
    });

    const { getByText } = render(<RoleSelector />);

    expect(getByText('¡Bienvenido!')).toBeTruthy(); // Generic welcome
  });

  it('handles user with single name in nombre_apellido', () => {
    jest.mocked(require('../src/contexts/AuthContext').useAuth).mockReturnValue({
      user: { nombre_apellido: 'Juan' }, // Single name
      logout: jest.fn(),
    });

    const { getByText } = render(<RoleSelector />);

    expect(getByText('¡Bienvenido, Juan!')).toBeTruthy();
  });

  it('shows remember choice toggle', () => {
    const { getByText } = render(<RoleSelector />);

    expect(getByText('Recordar mi elección')).toBeTruthy();
  });

  it('displays subtitle text', () => {
    const { getByText } = render(<RoleSelector />);

    expect(getByText('Seleccioná el rol con el que querés continuar')).toBeTruthy();
  });
});
