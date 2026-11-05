'use client'

import type { FormEvent } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { BackofficeFormCard } from '@/components/backoffice/common/backoffice-form-card'
import { FormInput } from '@/components/backoffice/common/form-field'
import { TenantSelect } from '@/components/backoffice/tenants/tenant-select'
import { RoleSelect } from '@/components/backoffice/users/role-select'
import { FormActions } from '@/components/backoffice/common/form-actions'
import type { CreateUserFormState } from '@/app/(dashboard)/backoffice/users/schemas'

type CreateUserFormErrors = Partial<Record<keyof CreateUserFormState, string>>

export interface UserCreateFormProps {
  formData: CreateUserFormState
  onFormDataChange: (field: keyof CreateUserFormState, value: string | boolean) => void
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  formErrors?: CreateUserFormErrors
}

export function UserCreateForm({
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
  formErrors = {},
}: UserCreateFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <BackofficeFormCard
        title="User Information"
        description="Fill in the details to create a new user"
      >
        <FormInput
          id="name"
          label="Name"
          placeholder="e.g., John Doe"
          value={formData.name || ''}
          onChange={(value) => onFormDataChange('name', value)}
          description="Optional: Full name of the user"
          error={formErrors.name}
        />

        <FormInput
          id="email"
          label="Email"
          type="email"
          required
          placeholder="e.g., user@example.com"
          value={formData.email}
          onChange={(value) => onFormDataChange('email', value)}
          description="Email address for the user (must be unique)"
          error={formErrors.email}
        />

        <FormInput
          id="password"
          label="Password"
          type="password"
          placeholder="Leave empty if not using password authentication"
          value={formData.password || ''}
          onChange={(value) => onFormDataChange('password', value)}
          description="Optional: Password for the user. Leave empty if using OAuth authentication."
          error={formErrors.password}
        />

        <TenantSelect
          value={formData.tenantId || ''}
          onChange={(value) => onFormDataChange('tenantId', value)}
          error={formErrors.tenantId}
        />

        <RoleSelect
          value={formData.role || ''}
          onChange={(value) => onFormDataChange('role', value)}
          error={formErrors.role}
        />

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="active-toggle">Account status</Label>
            <p className="text-sm text-muted-foreground">
              Disable this toggle to create a user who cannot sign in yet.
            </p>
          </div>
          <Switch
            id="active-toggle"
            checked={formData.active}
            onCheckedChange={(checked) => onFormDataChange('active', checked)}
          />
        </div>

        <FormActions
          submitLabel="Create User"
          isLoading={isSubmitting}
          loadingText="Creating..."
        />
      </BackofficeFormCard>
    </form>
  )
}

