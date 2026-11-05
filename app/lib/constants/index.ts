/**
 * Application Constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  ASSESSMENTS: '/api/assessments',
  USERS: '/api/users',
  AUTH: '/api/auth',
} as const

// Routes
export const ROUTES = {
  HOME: '/v2',
  LOGIN: '/login',
  WORKSPACE: '/workspace',
  ASSESSMENT_DETAILS: (id: string) => `/workspace/assessments/${id}`,
  ASSESSMENT_CREATE: '/workspace/assessments/create',
} as const

// Assessment Status
export const ASSESSMENT_STATUS = {
  DRAFT: 'draft',
  LIVE: 'live',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
} as const

// Student Status
export const STUDENT_STATUS = {
  HANDED_IN: 'handed_in',
  READY_FOR_REVIEW: 'ready_for_review',
  REVISION_REQUESTED: 'revision_requested',
  DONE: 'done',
} as const

// User Roles
export const USER_ROLES = {
  TEACHER: 'teacher',
  ADMIN: 'admin',
  STUDENT: 'student',
} as const

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

// Component Sizes
export const SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
} as const

// Component Variants
export const VARIANTS = {
  DEFAULT: 'default',
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
  OUTLINE: 'outline',
  GHOST: 'ghost',
  LINK: 'link',
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  V2_AUTH: 'v2-auth',
  THEME: 'v2-theme',
  USER_PREFERENCES: 'v2-user-preferences',
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const

// Validation
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MAX_LENGTH: 100,
  TITLE_MAX_LENGTH: 200,
} as const
