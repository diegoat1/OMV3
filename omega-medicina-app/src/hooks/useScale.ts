import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/**
 * Returns a scale factor based on viewport width.
 * - Mobile (< 768px): factor = 1 (no scaling)
 * - Desktop: scales from 1x (at 1100px) up to maxScale (at very large screens)
 * 
 * Usage:
 *   const { s, isWide, width, height } = useScale();
 *   fontSize: 16 * s  // 16px on mobile, ~21px on 1440p, ~26px on 4K
 */
export function useScale(baseWidth = 1100, maxScale = 1.6) {
  const { width, height } = useWindowDimensions();
  const isWide = width >= 768;

  const s = useMemo(() => {
    if (!isWide) return 1;
    return Math.min(Math.max(width / baseWidth, 1), maxScale);
  }, [width, isWide, baseWidth, maxScale]);

  return { s, isWide, width, height };
}
