'use client'

import Link from 'next/link'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Pencil, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
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

export interface BackofficeAssessmentActionsProps {
  assessmentId: string
  hasGoogleForm: boolean
  onDelete: () => void
  isDeleting: boolean
  onSyncResponses: () => void
  isSyncing: boolean
}

export function BackofficeAssessmentActions({
  assessmentId,
  hasGoogleForm,
  onDelete,
  isDeleting,
  onSyncResponses,
  isSyncing,
}: BackofficeAssessmentActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button.Outline asChild>
        <Link href={`/workspace/assessments/${assessmentId}`}>
          <ExternalLink className="mr-2 size-4" />
          View in Workspace
        </Link>
      </Button.Outline>
      <Button.Outline asChild>
        <Link href={`/backoffice/assessments/${assessmentId}/edit`}>
          <Pencil className="mr-2 size-4" />
          Edit Assessment
        </Link>
      </Button.Outline>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button.Outline disabled={!hasGoogleForm || isSyncing}>
            <RefreshCw className={`mr-2 size-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync responses'}
          </Button.Outline>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync responses from Google Form?</AlertDialogTitle>
            <AlertDialogDescription>
              This pulls live responses from the linked Google Form for this assessment. New
              responses are imported and AI feedback is generated. Submissions that already have
              feedback keep it. Submissions whose feedback is missing are generated again. This can
              take a few minutes for large forms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSyncing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onSyncResponses} disabled={isSyncing || !hasGoogleForm}>
              {isSyncing ? 'Syncing...' : 'Confirm sync'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button.Destructive onClick={onDelete} disabled={isDeleting}>
        <Trash2 className="mr-2 size-4" />
        {isDeleting ? 'Deleting...' : 'Delete Assessment'}
      </Button.Destructive>
    </div>
  )
}
