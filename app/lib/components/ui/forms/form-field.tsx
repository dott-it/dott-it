import * as React from 'react'
import { Input } from './input'
import { Label } from './label'
import { Typography } from '../typography'
import { cn } from '@/app/lib/utils/utils'

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
  required?: boolean
  containerClassName?: string
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, description, error, required, containerClassName, className, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || `form-field-${generatedId}`
    let describedBy: string | undefined
    if (error) {
      describedBy = `${inputId}-error`
    } else if (description) {
      describedBy = `${inputId}-description`
    }

    return (
      <div className={cn('space-y-2', containerClassName)}>
        <Label htmlFor={inputId} className={error ? 'text-destructive font-bold text-lg' : ''}>
          {label}
          {required && <span className="ml-1 text-xl font-bold text-destructive">*</span>}
        </Label>

        {description && (
          <Typography variant="body1" color="muted" id={`${inputId}-description`}>
            {description}
          </Typography>
        )}

        <Input
          ref={ref}
          id={inputId}
          className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          {...props}
        />

        {error && (
          <Typography variant="body1" color="error" id={`${inputId}-error`} role="alert">
            {error}
          </Typography>
        )}
      </div>
    )
  },
)

FormField.displayName = 'FormField'

export { FormField }
