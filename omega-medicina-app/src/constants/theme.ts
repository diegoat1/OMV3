// Theme Constants - Design system for Omega Medicina

export const Colors = {
  // Primary - Teal/Cyan health app style
  primary: '#0891b2',
  primaryLight: '#22d3ee',
  primaryDark: '#0e7490',
  
  // Secondary
  secondary: '#6366f1',
  secondaryLight: '#818cf8',
  secondaryDark: '#4f46e5',
  
  // Success/Health positive
  success: '#10b981',
  successLight: '#34d399',
  successDark: '#059669',
  
  // Warning
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  warningDark: '#d97706',
  
  // Error/Danger
  error: '#ef4444',
  errorLight: '#f87171',
  errorDark: '#dc2626',
  
  // Neutral
  white: '#ffffff',
  black: '#000000',
  
  // Grays (dark-first palette)
  gray50: '#1a1a1a',
  gray100: '#1e1e1e',
  gray200: '#2a2a2a',
  gray300: '#3a3a3a',
  gray400: '#64748b',
  gray500: '#94a3b8',
  gray600: '#cbd5e1',
  gray700: '#e2e8f0',
  gray800: '#f1f5f9',
  gray900: '#f8fafc',
  
  // Background
  background: '#0a0a0a',
  backgroundDark: '#0a0a0a',
  surface: '#111111',
  surfaceDark: '#111111',
  
  // Text
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  textLight: '#64748b',
  textDark: '#f9fafb',
  
  // Specific UI elements
  border: '#1a1a1a',
  borderDark: '#1a1a1a',
  divider: '#1a1a1a',
  
  // Score colors
  scoreExcellent: '#10b981',
  scoreGood: '#22d3ee',
  scoreAverage: '#f59e0b',
  scorePoor: '#ef4444',
  
  // Category colors
  categoryScreening: '#8b5cf6',
  categoryLab: '#3b82f6',
  categoryMeasurement: '#10b981',
  categoryConsultation: '#f59e0b',
  categoryVaccination: '#ec4899',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Helper to get score color based on value
export const getScoreColor = (score: number): string => {
  if (score >= 80) return Colors.scoreExcellent;
  if (score >= 60) return Colors.scoreGood;
  if (score >= 40) return Colors.scoreAverage;
  return Colors.scorePoor;
};

// Helper to get category color
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    screening: Colors.categoryScreening,
    laboratory: Colors.categoryLab,
    anthropometric: Colors.categoryMeasurement,
    consultation: Colors.categoryConsultation,
    vaccination: Colors.categoryVaccination,
    medication: Colors.primary,
    custom: Colors.gray500,
  };
  return colors[category] || Colors.gray500;
};
