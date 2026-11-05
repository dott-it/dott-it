/**
 * Form Types
 */

import type { ReactNode } from 'react'

/**
 * Form Field Types
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'time'
  | 'datetime-local'

/**
 * Form Validation Rules
 */
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: unknown) => string | null
}

/**
 * Form Field Configuration
 */
export interface FormField {
  name: string
  label: string
  type: FormFieldType
  placeholder?: string
  description?: string
  validation?: ValidationRule
  options?: Array<{ label: string; value: string }>
  defaultValue?: unknown
  disabled?: boolean
  required?: boolean
}

/**
 * Form State
 */
export interface FormState<T = Record<string, unknown>> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
}

/**
 * Form Props
 */
export interface FormProps<T = Record<string, unknown>> {
  initialValues?: T
  onSubmit: (values: T) => void | Promise<void>
  validationSchema?: Record<string, ValidationRule>
  children: ReactNode
  className?: string
}

/**
 * Form Field Props
 */
export interface FormFieldProps {
  field: FormField
  value: unknown
  error?: string
  touched?: boolean
  onChange: (value: unknown) => void
  onBlur?: () => void
  className?: string
}
