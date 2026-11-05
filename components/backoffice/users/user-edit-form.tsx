'use client'

import type { FormEvent } from 'react'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface UserEditFormProps {
  formData: {
    tenantId: string
    role: string
    active: boolean
  }
  tenants: Array<{
    id: string
    name: string
  }>
  onFormDataChange: (field: string, value: string | boolean) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function UserEditForm({
  formData,
  tenants,
  onFormDataChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: UserEditFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit User Information</CardTitle>
          <CardDescription>Update the tenant and role for this user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tenant */}
          <div className="space-y-2">
            <Label htmlFor="tenantId">Tenant</Label>
            <Select
              value={formData.tenantId || 'none'}
              onValueChange={(value) =>
                onFormDataChange('tenantId', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger id="tenantId">
                <SelectValue placeholder="Select a tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No tenant</SelectItem>
                {tenants?.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Assign this user to a tenant or leave unassigned.
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role || 'none'}
              onValueChange={(value) =>
                onFormDataChange('role', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No role</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Assign a role to this user.</p>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="active-toggle">Account status</Label>
              <p className="text-sm text-muted-foreground">
                Toggle to deactivate or reactivate the user without deleting data.
              </p>
            </div>
            <Switch
              id="active-toggle"
              checked={formData.active}
              onCheckedChange={(checked) => onFormDataChange('active', checked)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button.Outline type="button" onClick={onCancel} className="flex-1">
              Cancel
            </Button.Outline>
            <Button.SubmitWithLoading
              isLoading={isSubmitting}
              loadingText="Saving..."
              className="flex-1"
            >
              Save Changes
            </Button.SubmitWithLoading>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

