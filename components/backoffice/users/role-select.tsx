'use client'

import { FormSelect, type FormSelectOption } from '../common/form-field'

interface RoleSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  description?: string
  required?: boolean
  includeNone?: boolean
  error?: string
}

const ROLE_OPTIONS: FormSelectOption[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
]

export function RoleSelect({
  value,
  onChange,
  label = 'Role',
  description = 'Optional: Assign a role to this user',
  required = false,
  includeNone = true,
  error,
}: RoleSelectProps) {
  const options: FormSelectOption[] = [
    ...(includeNone ? [{ value: 'none', label: 'No role' }] : []),
    ...ROLE_OPTIONS,
  ]

  const handleChange = (newValue: string) => {
    onChange(newValue === 'none' ? '' : newValue)
  }

  return (
    <FormSelect
      id="role"
      label={label}
      required={required}
      description={description}
      value={value || 'none'}
      onChange={handleChange}
      options={options}
      placeholder="Select a role"
      error={error}
    />
  )
}



