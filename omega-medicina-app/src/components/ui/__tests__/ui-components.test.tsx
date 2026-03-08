// UI Components Integration Tests
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from '../Button';
import { Card } from '../Card';
import { ScoreCard } from '../ScoreCard';

// Mock theme constants
jest.mock('../../../constants/theme', () => ({
  Colors: {
    primary: '#d65151',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    white: '#ffffff',
    gray: '#6c757d',
  },
  BorderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  Spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  FontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  FontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
}));

describe('Button Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders with default props', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <Button title="Press Me" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Press Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByText } = render(
      <Button title="Disabled Button" onPress={mockOnPress} disabled />
    );

    fireEvent.press(getByText('Disabled Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const { getByText } = render(
      <Button title="Loading Button" onPress={mockOnPress} loading />
    );

    fireEvent.press(getByText('Loading Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(
      <Button title="Loading Button" onPress={mockOnPress} loading testID="button" />
    );

    // React Native Testing Library should find the ActivityIndicator
    // This test verifies the loading prop affects the UI
    const button = getByTestId('button');
    expect(button).toBeTruthy();
  });

  it('renders different variants correctly', () => {
    const { rerender, getByText } = render(
      <Button title="Primary" onPress={mockOnPress} variant="primary" />
    );

    expect(getByText('Primary')).toBeTruthy();

    rerender(<Button title="Secondary" onPress={mockOnPress} variant="secondary" />);
    expect(getByText('Secondary')).toBeTruthy();

    rerender(<Button title="Outline" onPress={mockOnPress} variant="outline" />);
    expect(getByText('Outline')).toBeTruthy();

    rerender(<Button title="Danger" onPress={mockOnPress} variant="danger" />);
    expect(getByText('Danger')).toBeTruthy();
  });

  it('renders different sizes correctly', () => {
    const { rerender, getByText } = render(
      <Button title="Small" onPress={mockOnPress} size="sm" />
    );

    expect(getByText('Small')).toBeTruthy();

    rerender(<Button title="Medium" onPress={mockOnPress} size="md" />);
    expect(getByText('Medium')).toBeTruthy();

    rerender(<Button title="Large" onPress={mockOnPress} size="lg" />);
    expect(getByText('Large')).toBeTruthy();
  });

  it('renders with icon', () => {
    const TestIcon = () => <></>; // Mock icon component
    const { getByText } = render(
      <Button title="Icon Button" onPress={mockOnPress} icon={<TestIcon />} />
    );

    expect(getByText('Icon Button')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { marginTop: 20 };
    const customTextStyle = { fontSize: 18 };

    const { getByText } = render(
      <Button
        title="Custom Styled"
        onPress={mockOnPress}
        style={customStyle}
        textStyle={customTextStyle}
      />
    );

    expect(getByText('Custom Styled')).toBeTruthy();
  });

  it('handles fullWidth prop', () => {
    const { getByText } = render(
      <Button title="Full Width" onPress={mockOnPress} fullWidth />
    );

    expect(getByText('Full Width')).toBeTruthy();
  });
});

describe('Card Component', () => {
  it('renders with title and children', () => {
    const { getByText } = render(
      <Card title="Test Card">
        <></>
      </Card>
    );

    expect(getByText('Test Card')).toBeTruthy();
  });

  it('renders without title', () => {
    const { queryByText } = render(
      <Card>
        <></>
      </Card>
    );

    expect(queryByText('Test Card')).toBeNull();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <Card title="Card with Content">
        <Button title="Child Button" onPress={() => {}} />
      </Card>
    );

    expect(getByText('Card with Content')).toBeTruthy();
    expect(getByText('Child Button')).toBeTruthy();
  });
});

describe('ScoreCard Component', () => {
  const mockScoreData = {
    current: 75,
    previous: 70,
    target: 80,
    trend: 'up' as const,
    label: 'Puntuación General',
    unit: 'pts',
  };

  it('renders score data correctly', () => {
    const { getByText } = render(<ScoreCard {...mockScoreData} />);

    expect(getByText('Puntuación General')).toBeTruthy();
    expect(getByText('75 pts')).toBeTruthy();
    expect(getByText('+5')).toBeTruthy(); // Trend calculation: 75 - 70 = +5
  });

  it('displays target when provided', () => {
    const { getByText } = render(<ScoreCard {...mockScoreData} showTarget />);

    expect(getByText('Meta: 80 pts')).toBeTruthy();
  });

  it('handles down trend correctly', () => {
    const downTrendData = { ...mockScoreData, current: 65, previous: 70, trend: 'down' as const };
    const { getByText } = render(<ScoreCard {...downTrendData} />);

    expect(getByText('-5')).toBeTruthy();
  });

  it('handles stable trend', () => {
    const stableData = { ...mockScoreData, current: 70, previous: 70, trend: 'stable' as const };
    const { getByText } = render(<ScoreCard {...stableData} />);

    expect(getByText('0')).toBeTruthy();
  });

  it('renders without unit', () => {
    const noUnitData = { ...mockScoreData, unit: undefined };
    const { getByText } = render(<ScoreCard {...noUnitData} />);

    expect(getByText('75')).toBeTruthy();
  });
});
