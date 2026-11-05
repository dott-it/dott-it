'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'

export interface BackofficeTenantActionsProps {
  isEditing: boolean
  isAddingUser: boolean
  isAddingTeacher: boolean
  onEdit: () => void
  onAddUser: () => void
}

export function BackofficeTenantActions({
  isEditing,
  isAddingUser,
  isAddingTeacher,
  onEdit,
  onAddUser,
}: BackofficeTenantActionsProps) {
  if (isEditing || isAddingUser || isAddingTeacher) {
    return null
  }

  return (
    <div className="flex gap-3">
      <Button.Primary onClick={onEdit}>Edit Tenant</Button.Primary>
      <Button.Primary onClick={onAddUser}>
        <Plus className="mr-2 size-4" />
        Add User
      </Button.Primary>
    </div>
  )
}

