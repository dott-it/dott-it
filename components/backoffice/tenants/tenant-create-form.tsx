'use client'

import type { FormEvent } from 'react'
import { BackofficeFormCard } from '@/components/backoffice/common/backoffice-form-card'
import { FormInput } from '@/components/backoffice/common/form-field'
import { DomainInput } from '@/components/backoffice/common/domain-input'
import { FormActions } from '@/components/backoffice/common/form-actions'
import type { CreateTenantFormState } from '@/app/(dashboard)/backoffice/tenants/schemas'

type CreateTenantFormErrors = Partial<Record<keyof CreateTenantFormState, string>>

export interface TenantCreateFormProps {
  formData: CreateTenantFormState
  domains: string[]
  onFormDataChange: (field: keyof CreateTenantFormState, value: string) => void
  onDomainsChange: (domains: string[]) => void
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  formErrors?: CreateTenantFormErrors
}

export function TenantCreateForm({
  formData,
  domains,
  onFormDataChange,
  onDomainsChange,
  onSubmit,
  isSubmitting,
  formErrors = {},
}: TenantCreateFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <BackofficeFormCard
        title="Tenant Information"
        description="Fill in the details to create a new tenant organization"
      >
        <FormInput
          id="name"
          label="Tenant Name"
          required
          placeholder="e.g., Cameron School District"
          value={formData.name}
          onChange={(value) => onFormDataChange('name', value)}
          description="The display name for this tenant organization"
          error={formErrors.name}
        />

        <FormInput
          id="slug"
          label="Slug"
          required
          placeholder="e.g., cameron-k12"
          value={formData.slug}
          onChange={(value) => onFormDataChange('slug', value.toLowerCase())}
          description={`A unique identifier for this tenant (lowercase, letters, numbers, dots, and hyphens only). Used in URLs like ${formData.slug ? `${formData.slug}.eddolearning.com` : 'tenant-name.eddolearning.com'}`}
          error={formErrors.slug}
        />

        <DomainInput
          domains={domains}
          onDomainsChange={onDomainsChange}
          description="Optional: Custom domains associated with this tenant (e.g., science.wsd.edu)"
        />

        <FormInput
          id="logo"
          label="Logo URL"
          type="url"
          placeholder="e.g., https://example.com/logo.png"
          value={formData.logo || ''}
          onChange={(value) => onFormDataChange('logo', value)}
          description="Optional: URL to the tenant's logo image"
          error={formErrors.logo}
        />

        <FormActions
          submitLabel="Create Tenant"
          isLoading={isSubmitting}
          loadingText="Creating..."
        />
      </BackofficeFormCard>
    </form>
  )
}

