import { ReactNode } from "react"

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
export type Variant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
