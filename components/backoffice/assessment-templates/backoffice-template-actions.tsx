'use client'

import Link from 'next/link'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Pencil, Trash2, ClipboardCopy } from 'lucide-react'

export interface BackofficeTemplateActionsProps {
  templateId: string
  onDuplicate: () => void
  onDelete: () => void
  isDeleting: boolean
  isDuplicating: boolean
}

export function BackofficeTemplateActions({
  templateId,
  onDuplicate,
  onDelete,
  isDeleting,
  isDuplicating,
}: BackofficeTemplateActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button.Outline onClick={onDuplicate} disabled={isDuplicating}>
        <ClipboardCopy className="mr-2 size-4" />
        {isDuplicating ? 'Duplicating...' : 'Duplicate Template'}
      </Button.Outline>
      <Button.Outline asChild>
        <Link href={`/backoffice/assessment-templates/${templateId}/edit`}>
          <Pencil className="mr-2 size-4" />
          Edit Template
        </Link>
      </Button.Outline>
      <Button.Destructive onClick={onDelete} disabled={isDeleting}>
        <Trash2 className="mr-2 size-4" />
        {isDeleting ? 'Deleting...' : 'Delete Template'}
      </Button.Destructive>
    </div>
  )
}

