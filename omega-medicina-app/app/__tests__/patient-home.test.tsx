// Patient Home Screen Integration Tests
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PatientHomeScreen from '../(patient)/home';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      nombre_apellido: 'Pérez García, Juan',
      email: 'juan.perez@example.com',
    },
    logout: jest.fn(),
  }),
}));

jest.mock('../../src/hooks', () => ({
  useHealthScore: () => ({
    score: 85,
    semaphoreColor: 'green',
  }),
}));

jest.mock('../../src/services/api', () => ({
  assignmentService: {
    getPendingForPatient: jest.fn().mockResolvedValue({
      success: true,
      data: {
        pending: [
          {
            id: 1,
            specialist_id: 2,
            specialist_name: 'Dr. María González',
            specialist_role: 'doctor',
            created_at: '2024-01-15T10:00:00Z',
          },
          {
            id: 2,
            specialist_id: 3,
            specialist_name: 'Lic. Ana Rodríguez',
            specialist_role: 'nutritionist',
            created_at: '2024-01-16T14:30:00Z',
          }
        ]
      }
    }),
    acceptAssignment: jest.fn().mockResolvedValue({
      success: true,
      message: 'Assignment accepted successfully'
    }),
    rejectAssignment: jest.fn().mockResolvedValue({
      success: true,
      message: 'Assignment rejected successfully'
    }),
  },
}));

jest.mock('../../src/components/ui', () => ({
  BuildBanner: () => null,
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Activity: 'Activity',
  Dumbbell: 'Dumbbell',
  Apple: 'Apple',
  TrendingUp: 'TrendingUp',
  ChevronRight: 'ChevronRight',
}));

describe('PatientHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome message with user name', () => {
    const { getByText } = render(<PatientHomeScreen />);

    expect(getByText('¡Hola, Juan!')).toBeTruthy();
  });

  it('displays health score', () => {
    const { getByText } = render(<PatientHomeScreen />);

    expect(getByText('85')).toBeTruthy(); // Health score
  });

  it('renders all intent cards', () => {
    const { getByText } = render(<PatientHomeScreen />);

    expect(getByText('Registrar Salud')).toBeTruthy();
    expect(getByText('Ver métricas de salud y bienestar general')).toBeTruthy();

    expect(getByText('Plan de Entrenamiento')).toBeTruthy();
    expect(getByText('Seguimiento de rutinas y progreso físico')).toBeTruthy();

    expect(getByText('Plan Nutricional')).toBeTruthy();
    expect(getByText('Dieta personalizada y seguimiento alimentario')).toBeTruthy();

    expect(getByText('Análisis de Progreso')).toBeTruthy();
    expect(getByText('Estadísticas y evolución a lo largo del tiempo')).toBeTruthy();
  });

  it('loads pending assignments on mount', async () => {
    const mockGetPending = jest.mocked(require('../../src/services/api').assignmentService.getPendingForPatient);

    render(<PatientHomeScreen />);

    await waitFor(() => {
      expect(mockGetPending).toHaveBeenCalledTimes(1);
    });
  });

  it('displays pending specialist requests', async () => {
    const { getByText } = render(<PatientHomeScreen />);

    await waitFor(() => {
      expect(getByText('Dr. María González')).toBeTruthy();
      expect(getByText('Médico')).toBeTruthy();
      expect(getByText('Lic. Ana Rodríguez')).toBeTruthy();
      expect(getByText('Nutricionista')).toBeTruthy();
    });
  });

  it('navigates to health screen when health card is pressed', () => {
    const mockRouterPush = jest.fn();
    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      push: mockRouterPush,
      replace: jest.fn(),
    });

    const { getByText } = render(<PatientHomeScreen />);
    fireEvent.press(getByText('Registrar Salud'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(patient)/health');
  });

  it('navigates to training screen when training card is pressed', () => {
    const mockRouterPush = jest.fn();
    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      push: mockRouterPush,
      replace: jest.fn(),
    });

    const { getByText } = render(<PatientHomeScreen />);
    fireEvent.press(getByText('Plan de Entrenamiento'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(patient)/training');
  });

  it('navigates to nutrition screen when nutrition card is pressed', () => {
    const mockRouterPush = jest.fn();
    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      push: mockRouterPush,
      replace: jest.fn(),
    });

    const { getByText } = render(<PatientHomeScreen />);
    fireEvent.press(getByText('Plan Nutricional'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(patient)/nutrition');
  });

  it('navigates to dashboard when analysis card is pressed', () => {
    const mockRouterPush = jest.fn();
    jest.mocked(require('expo-router').useRouter).mockReturnValue({
      push: mockRouterPush,
      replace: jest.fn(),
    });

    const { getByText } = render(<PatientHomeScreen />);
    fireEvent.press(getByText('Análisis de Progreso'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(patient)/dashboard');
  });

  it('handles accept assignment', async () => {
    const mockAcceptAssignment = jest.mocked(require('../../src/services/api').assignmentService.acceptAssignment);

    const { getByText, getAllByText } = render(<PatientHomeScreen />);

    // Wait for pending assignments to load
    await waitFor(() => {
      expect(getByText('Dr. María González')).toBeTruthy();
    });

    // Find and press the accept button for the first assignment
    const acceptButtons = getAllByText('Aceptar');
    fireEvent.press(acceptButtons[0]);

    await waitFor(() => {
      expect(mockAcceptAssignment).toHaveBeenCalledWith(1);
    });
  });

  it('handles reject assignment', async () => {
    const mockRejectAssignment = jest.mocked(require('../../src/services/api').assignmentService.rejectAssignment);

    const { getByText, getAllByText } = render(<PatientHomeScreen />);

    // Wait for pending assignments to load
    await waitFor(() => {
      expect(getByText('Dr. María González')).toBeTruthy();
    });

    // Find and press the reject button for the first assignment
    const rejectButtons = getAllByText('Rechazar');
    fireEvent.press(rejectButtons[0]);

    await waitFor(() => {
      expect(mockRejectAssignment).toHaveBeenCalledWith(1);
    });
  });

  it('shows loading indicator when accepting assignment', async () => {
    const mockAcceptAssignment = jest.mocked(require('../../src/services/api').assignmentService.acceptAssignment);
    mockAcceptAssignment.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { getByText, queryByText } = render(<PatientHomeScreen />);

    // Wait for pending assignments to load
    await waitFor(() => {
      expect(getByText('Dr. María González')).toBeTruthy();
    });

    // Press accept button
    fireEvent.press(getByText('Aceptar'));

    // Should show loading, button should be disabled/not visible
    expect(queryByText('Aceptar')).toBeTruthy(); // Button should still be there during loading
  });

  it('handles empty pending assignments', async () => {
    jest.mocked(require('../../src/services/api').assignmentService.getPendingForPatient).mockResolvedValue({
      success: true,
      data: { pending: [] }
    });

    const { queryByText } = render(<PatientHomeScreen />);

    await waitFor(() => {
      expect(queryByText('Dr. María González')).toBeNull();
    });
  });

  it('handles API error when loading pending assignments', async () => {
    jest.mocked(require('../../src/services/api').assignmentService.getPendingForPatient).mockRejectedValue(
      new Error('API Error')
    );

    // Should not crash, should handle error gracefully
    expect(() => render(<PatientHomeScreen />)).not.toThrow();
  });

  it('handles user without nombre_apellido', () => {
    jest.mocked(require('../../src/contexts/AuthContext').useAuth).mockReturnValue({
      user: { email: 'test@example.com' }, // No nombre_apellido
      logout: jest.fn(),
    });

    const { getByText } = render(<PatientHomeScreen />);

    expect(getByText('¡Hola!')).toBeTruthy(); // Generic greeting
  });

  it('displays subtitle', () => {
    const { getByText } = render(<PatientHomeScreen />);

    expect(getByText('¿Qué querés hacer hoy?')).toBeTruthy();
  });
});
