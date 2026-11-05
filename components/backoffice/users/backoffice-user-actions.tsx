'use client'

import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Ban, ShieldCheck } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export interface BackofficeUserActionsProps {
  isEditing: boolean
  userActive: boolean
  onEdit: () => void
  onToggleActive: (nextActive: boolean) => void
  isTogglingActive: boolean
  userName?: string | null
  userEmail?: string | null
}

export function BackofficeUserActions({
  isEditing,
  userActive,
  onEdit,
  onToggleActive,
  isTogglingActive,
  userName,
  userEmail,
}: BackofficeUserActionsProps) {
  if (isEditing) {
    return null
  }

  return (
    <div className="flex gap-3">
      <Button.Primary onClick={onEdit}>Edit User</Button.Primary>
      {userActive ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button.Destructive disabled={isTogglingActive}>
              <Ban className="mr-2 size-4" />
              Deactivate
            </Button.Destructive>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
              <AlertDialogDescription>
                Temporarily block <strong>{userName || userEmail}</strong> from signing in. You
                can reactivate this account whenever needed; no data will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onToggleActive(false)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isTogglingActive}
              >
                {isTogglingActive ? 'Deactivating...' : 'Confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button.Primary
          disabled={isTogglingActive}
          onClick={() => onToggleActive(true)}
          className="flex items-center"
        >
          <ShieldCheck className="mr-2 size-4" />
          Reactivate
        </Button.Primary>
      )}
    </div>
  )
}

