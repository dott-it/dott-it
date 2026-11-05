'use client'

import Link from 'next/link'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'

interface FormActionsProps {
  cancelHref?: string
  onCancel?: () => void
  submitLabel?: string
  isLoading?: boolean
  loadingText?: string
  submitDisabled?: boolean
}

export function FormActions({
  cancelHref = '/backoffice',
  onCancel,
  submitLabel = 'Save',
  isLoading = false,
  loadingText = 'Saving...',
  submitDisabled = false,
}: FormActionsProps) {
  return (
    <div className="flex gap-3 pt-4 border-t">
      {cancelHref ? (
        <Button.Outline asChild className="flex-1">
          <Link href={cancelHref}>Cancel</Link>
        </Button.Outline>
      ) : (onCancel ? (
        <Button.Outline onClick={onCancel} className="flex-1" type="button">
          Cancel
        </Button.Outline>
      ) : null)}
      <Button.SubmitWithLoading
        isLoading={isLoading}
        loadingText={loadingText}
        className="flex-1"
        disabled={submitDisabled}
      >
        {submitLabel}
      </Button.SubmitWithLoading>
    </div>
  )
}



