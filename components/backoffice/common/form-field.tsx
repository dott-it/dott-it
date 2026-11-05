'use client'

import { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  description?: string
  error?: string
  children?: ReactNode
}

export function FormField({
  id,
  label,
  required = false,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {description && (
        <p id={`${id}-description`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

interface FormInputProps extends Omit<FormFieldProps, 'children'> {
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function FormInput({
  id,
  label,
  required,
  description,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled,
}: FormInputProps) {
  return (
    <FormField
      id={id}
      label={label}
      required={required}
      description={description}
      error={error}
    >
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
        }
        aria-required={required || undefined}
      />
    </FormField>
  )
}

interface FormTextareaProps extends Omit<FormFieldProps, 'children'> {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  disabled?: boolean
}

export function FormTextarea({
  id,
  label,
  required,
  description,
  error,
  placeholder,
  value,
  onChange,
  rows = 4,
  disabled,
}: FormTextareaProps) {
  return (
    <FormField
      id={id}
      label={label}
      required={required}
      description={description}
      error={error}
    >
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
        disabled={disabled}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
        }
        aria-required={required || undefined}
      />
    </FormField>
  )
}

export interface FormSelectOption {
  value: string
  label: string
}

interface FormSelectProps extends Omit<FormFieldProps, 'children'> {
  value: string
  onChange: (value: string) => void
  options: FormSelectOption[]
  placeholder?: string
  disabled?: boolean
}

export function FormSelect({
  id,
  label,
  required,
  description,
  error,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled,
}: FormSelectProps) {
  // Filter out options with empty values to prevent Select errors
  const validOptions = options.filter((option) => option.value !== '')

  return (
    <FormField
      id={id}
      label={label}
      required={required}
      description={description}
      error={error}
    >
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
          }
          aria-required={required || undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {validOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )
}



