/**
 * Form Types
 */
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    message?: string
  }
}
