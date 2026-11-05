import { ReactNode } from 'react'

/**
 * Common UI Component Props
 */
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

/**
 * Theme Types
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Status Types
 */
export type Status = 'idle' | 'loading' | 'success' | 'error'

/**
 * Size Types
 */
export type Size = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Variant Types
 */
export type Variant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link'

/**
 * Button Props
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

/**
 * Card Props
 */
export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated'
}

/**
 * Input Props
 */
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value?: string
  defaultValue?: string
  disabled?: boolean
  required?: boolean
  onChange?: (value: string) => void
  onBlur?: () => void
  onFocus?: () => void
}

/**
 * Badge Props
 */
export interface BadgeProps extends BaseComponentProps {
  variant?: Variant
  size?: Size
}

/**
 * Alert Props
 */
export interface AlertProps extends BaseComponentProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success'
  title?: string
  description?: string
}

