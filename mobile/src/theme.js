// CleanTrack Design System — matching the web app's dark glassmorphism theme

export const COLORS = {
  // Backgrounds
  bgPrimary: '#0a0a1a',
  bgSecondary: '#12122a',
  bgCard: 'rgba(30, 30, 60, 0.85)',
  bgCardLight: 'rgba(40, 40, 80, 0.6)',
  bgInput: 'rgba(20, 20, 50, 0.8)',
  bgOverlay: 'rgba(0, 0, 0, 0.6)',

  // Accent & Brand
  accentPrimary: '#7c5cfc',
  accentSecondary: '#5a3de8',
  accentGlow: 'rgba(124, 92, 252, 0.3)',
  gradient1: '#7c5cfc',
  gradient2: '#c471ed',

  // Text
  textPrimary: '#f0f0ff',
  textSecondary: 'rgba(240, 240, 255, 0.65)',
  textMuted: 'rgba(240, 240, 255, 0.4)',
  textInverse: '#0a0a1a',

  // Status colors
  statusPending: '#f5a623',
  statusAssigned: '#4a90d9',
  statusInProgress: '#f5a623',
  statusCompleted: '#4cd964',
  statusFailed: '#ff3b5c',
  statusClosed: '#8e8ea0',

  // UI
  border: 'rgba(124, 92, 252, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  danger: '#ff3b5c',
  success: '#4cd964',
  white: '#ffffff',
  black: '#000000',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  hero: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// Status metadata
export const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: COLORS.statusPending, bg: 'rgba(245, 166, 35, 0.15)' },
  ASSIGNED: { label: 'Assigned', color: COLORS.statusAssigned, bg: 'rgba(74, 144, 217, 0.15)' },
  IN_PROGRESS: { label: 'In Progress', color: COLORS.statusInProgress, bg: 'rgba(245, 166, 35, 0.15)' },
  COMPLETED: { label: 'Completed', color: COLORS.statusCompleted, bg: 'rgba(76, 217, 100, 0.15)' },
  FAILED: { label: 'Failed', color: COLORS.statusFailed, bg: 'rgba(255, 59, 92, 0.15)' },
  CLOSED: { label: 'Closed', color: COLORS.statusClosed, bg: 'rgba(142, 142, 160, 0.15)' },
};

export const CLEANING_TYPES = [
  'Room Sweeping',
  'Room Mopping',
  'Bathroom Cleaning',
  'Full Room Cleaning',
  'Dustbin Clearing',
  'Other',
];

export const FAIL_REASONS = [
  'Room Locked',
  'Student Not Present',
  'Room Already Clean',
  'Equipment Unavailable',
  'Other',
];
