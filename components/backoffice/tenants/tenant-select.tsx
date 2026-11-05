'use client'

import { useEffect, useState } from 'react'
import { Tenant } from '@/types'
import { FormSelect, type FormSelectOption } from '../common/form-field'

interface TenantSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  description?: string
  required?: boolean
  includeNone?: boolean
  loading?: boolean
  error?: string
}

export function TenantSelect({
  value,
  onChange,
  label = 'Tenant',
  description = 'Optional: Assign this user to a tenant',
  required = false,
  includeNone = true,
  loading = false,
  error,
}: TenantSelectProps) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/tenants')
        if (response.ok) {
          const data = await response.json()
          setTenants(data || [])
        }
      } catch {
        // Error fetching tenants
      } finally {
        setIsLoading(false)
      }
    }

    if (!loading) {
      fetchTenants()
    }
  }, [loading])

  const options: FormSelectOption[] = [
    ...(includeNone ? [{ value: 'none', label: 'No tenant' }] : []),
    ...tenants.map((tenant) => ({
      value: tenant.id,
      label: tenant.name,
    })),
  ]

  const handleChange = (newValue: string) => {
    onChange(newValue === 'none' ? '' : newValue)
  }

  return (
    <FormSelect
      id="tenantId"
      label={label}
      required={required}
      description={description}
      value={value || 'none'}
      onChange={handleChange}
      options={options}
      placeholder={
        isLoading || loading
          ? 'Loading tenants...'
          : 'Select a tenant'
      }
      disabled={isLoading || loading}
      error={error}
    />
  )
}



