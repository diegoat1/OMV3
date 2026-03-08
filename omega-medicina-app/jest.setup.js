// Jest setup file for React Native testing
const fetchMock = require('jest-fetch-mock');

// Mock react-native Platform (not available in Node environment)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock expo-secure-store (native module, not available in Node)
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Enable fetch mocking globally
fetchMock.enableMocks();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    manifest: null,
    platform: {
      ios: null,
      android: null,
      web: null,
    },
    systemFonts: [],
    statusBarHeight: 0,
    deviceId: 'test-device-id',
    deviceName: 'test-device-name',
    deviceYearClass: 2020,
    linkingUri: 'test://',
    sessionId: 'test-session-id',
  },
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'test://'),
  parse: jest.fn(() => ({ scheme: 'test', hostname: null, path: null, queryParams: {} })),
  openURL: jest.fn(() => Promise.resolve()),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  Link: 'Link',
  Stack: 'Stack',
  Tabs: 'Tabs',
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Home: 'Home',
  User: 'User',
  Settings: 'Settings',
  Heart: 'Heart',
  Activity: 'Activity',
  FileText: 'FileText',
  Users: 'Users',
  Stethoscope: 'Stethoscope',
  Pill: 'Pill',
  Dumbbell: 'Dumbbell',
  Calendar: 'Calendar',
  MessageSquare: 'MessageSquare',
  BarChart3: 'BarChart3',
  Bell: 'Bell',
  Search: 'Search',
  Plus: 'Plus',
  ChevronRight: 'ChevronRight',
  CheckCircle: 'CheckCircle',
  XCircle: 'XCircle',
  AlertCircle: 'AlertCircle',
  Info: 'Info',
  Crown: 'Crown',
  UserCheck: 'UserCheck',
}));

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore console logs in tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock timers
jest.useFakeTimers();

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();
});
