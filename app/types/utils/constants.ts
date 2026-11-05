/**
 * Application Constants Types
 */

/**
 * Application Configuration
 */
export interface AppConfig {
  name: string
  version: string
  environment: 'development' | 'staging' | 'production'
  apiUrl: string
  baseUrl: string
  features: {
    [key: string]: boolean
  }
}

/**
 * Theme Configuration
 */
export interface ThemeConfig {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  error: string
  warning: string
  success: string
  info: string
}

/**
 * Breakpoint Configuration
 */
export interface BreakpointConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  '2xl': number
}

/**
 * Animation Configuration
 */
export interface AnimationConfig {
  duration: {
    fast: number
    normal: number
    slow: number
  }
  easing: {
    ease: string
    easeIn: string
    easeOut: string
    easeInOut: string
  }
}

/**
 * Localization Configuration
 */
export interface LocalizationConfig {
  defaultLanguage: string
  supportedLanguages: string[]
  dateFormat: string
  timeFormat: string
  numberFormat: {
    decimal: string
    thousands: string
    currency: string
  }
}

