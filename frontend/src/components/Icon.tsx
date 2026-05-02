type IconName =
  | 'home' | 'users' | 'user' | 'calendar' | 'activity' | 'file' | 'chart'
  | 'settings' | 'bell' | 'search' | 'plus' | 'chevL' | 'chevR' | 'chevD'
  | 'menu' | 'db' | 'shield' | 'dumbbell' | 'apple' | 'heart' | 'film'
  | 'check' | 'upload' | 'logout' | 'filter' | 'x'
  // Mockup-aligned icon set (from _design-reference/components.jsx)
  | 'dashboard' | 'training' | 'nutrition' | 'medicine' | 'data'
  | 'history' | 'target' | 'timer' | 'flame' | 'arrowUp' | 'arrowDown'
  | 'play' | 'more' | 'edit' | 'video' | 'mic' | 'phone'

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  calendar: 'M3 9h18M8 3v4m8-4v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6',
  chart: 'M3 3v18h18M7 16l4-4 4 4 5-6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.5 7.5 0 0 0-.1-1.4l2-1.5-2-3.4-2.3.9a7.3 7.3 0 0 0-2.4-1.4l-.4-2.4h-4l-.3 2.4a7.3 7.3 0 0 0-2.4 1.4l-2.4-.9-2 3.4 2 1.5a7.5 7.5 0 0 0 0 2.8l-2 1.5 2 3.4 2.4-.9a7.3 7.3 0 0 0 2.4 1.4l.3 2.4h4l.4-2.4a7.3 7.3 0 0 0 2.4-1.4l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.4Z',
  bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3',
  plus: 'M12 5v14M5 12h14',
  chevL: 'm15 18-6-6 6-6',
  chevR: 'm9 6 6 6-6 6',
  chevD: 'm6 9 6 6 6-6',
  menu: 'M3 12h18M3 6h18M3 18h18',
  db: 'M21 5c0 1.7-4 3-9 3s-9-1.3-9-3 4-3 9-3 9 1.3 9 3Zm0 0v14c0 1.7-4 3-9 3s-9-1.3-9-3V5m18 7c0 1.7-4 3-9 3s-9-1.3-9-3',
  shield: 'M12 2 4 5v7c0 5.5 3.8 8.5 8 10 4.2-1.5 8-4.5 8-10V5l-8-3Z',
  dumbbell: 'M6 9v6M18 9v6M3 11v2M21 11v2M8 7.5v9M16 7.5v9',
  apple: 'M12 3c-3 2-5 5-5 9a5 5 0 0 0 10 0c0-4-2-7-5-9ZM12 9v4',
  heart: 'M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10Z',
  film: 'M2 4h20v16H2zM2 8h4m12 0h4M2 16h4m12 0h4M6 4v16m12-16v16',
  check: 'M5 12l5 5L20 7',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5M21 12H9',
  filter: 'M3 4h18l-7 9v7l-4-2v-5L3 4Z',
  x: 'M18 6 6 18M6 6l12 12',
  // Mockup-aligned set
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  training: 'M6 9v6M18 9v6M3 11v2M21 11v2M8 7.5v9M16 7.5v9',
  nutrition: 'M12 3c-3 2-5 5-5 9a5 5 0 0 0 10 0c0-4-2-7-5-9ZM12 9v4',
  medicine: 'M12 2v20M2 12h20',
  data: 'M3 20V10M9 20V4M15 20v-8M21 20v-4',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 9v4l2 2M9 2h6',
  flame: 'M12 3s5 4 5 9a5 5 0 0 1-10 0c0-3 2-5 2-7 0 1 1 2 3 2 0-2 0-4 0-4Z',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M5 12l7 7 7-7',
  play: 'M6 4l14 8-14 8V4z',
  more: 'M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  video: 'M2 6h14v12H2zM22 8l-6 4 6 4V8Z',
  mic: 'M9 3h6v12H9zM5 11a7 7 0 0 0 14 0M12 18v4',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z',
}

interface IconProps {
  name: IconName
  size?: number
}

export function Icon({ name, size = 16 }: IconProps) {
  const d = PATHS[name] || ''
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.split('M').filter(Boolean).map((p, i) => (
        <path key={i} d={'M' + p} />
      ))}
    </svg>
  )
}

export type { IconName }
