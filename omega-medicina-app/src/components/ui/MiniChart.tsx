// Mini Chart Component - Simple line chart for trends using react-native-svg

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, FontSize } from '../../constants/theme';

interface DataPoint {
  date: string;
  value: number;
}

interface MiniChartProps {
  data: DataPoint[];
  height?: number;
  width?: number;
  color?: string;
  showLabels?: boolean;
  unit?: string;
}

export function MiniChart({ 
  data, 
  height = 120, 
  width = Dimensions.get('window').width - 64,
  color = Colors.primary,
  showLabels = true,
  unit = '',
}: MiniChartProps) {
  if (data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noData}>Datos insuficientes</Text>
      </View>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Scale functions
  const scaleX = (index: number) => 
    padding.left + (index / (data.length - 1)) * chartWidth;
  
  const scaleY = (value: number) => 
    padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Generate path
  const pathData = data
    .map((point, index) => {
      const x = scaleX(index);
      const y = scaleY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path for gradient effect
  const areaPath = `${pathData} L ${scaleX(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * (1 - ratio)}
            x2={width - padding.right}
            y2={padding.top + chartHeight * (1 - ratio)}
            stroke={Colors.gray200}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Area fill */}
        <Path
          d={areaPath}
          fill={`${color}15`}
        />

        {/* Line */}
        <Path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, index) => (
          <Circle
            key={index}
            cx={scaleX(index)}
            cy={scaleY(point.value)}
            r={index === data.length - 1 ? 5 : 3}
            fill={index === data.length - 1 ? color : Colors.white}
            stroke={color}
            strokeWidth={2}
          />
        ))}

        {/* Y-axis labels */}
        {showLabels && (
          <>
            <SvgText
              x={padding.left - 8}
              y={padding.top + 4}
              fontSize={10}
              fill={Colors.gray500}
              textAnchor="end"
            >
              {maxValue.toFixed(1)}{unit}
            </SvgText>
            <SvgText
              x={padding.left - 8}
              y={height - padding.bottom}
              fontSize={10}
              fill={Colors.gray500}
              textAnchor="end"
            >
              {minValue.toFixed(1)}{unit}
            </SvgText>
          </>
        )}

        {/* X-axis labels (first and last) */}
        {showLabels && data.length > 0 && (
          <>
            <SvgText
              x={padding.left}
              y={height - 8}
              fontSize={10}
              fill={Colors.gray500}
              textAnchor="start"
            >
              {formatDate(data[0].date)}
            </SvgText>
            <SvgText
              x={width - padding.right}
              y={height - 8}
              fontSize={10}
              fill={Colors.gray500}
              textAnchor="end"
            >
              {formatDate(data[data.length - 1].date)}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noData: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    textAlign: 'center',
  },
});
