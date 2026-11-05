'use client'

import { toast } from 'sonner'

export function showExportFinishedToast(args: {
  folderUrl: string
  title?: string
  description?: string
  actionLabel?: string
}) {
  toast.success(args.title ?? 'Export finished', {
    description: args.description ?? 'Materials were copied to your Google Drive.',
    duration: 12_000,
    action: {
      label: args.actionLabel ?? 'Open folder in Drive',
      onClick: () => {
        globalThis.open(args.folderUrl, '_blank', 'noopener,noreferrer')
      },
    },
  })
}

export function showExportFailedToast(message?: string) {
  toast.error('Export failed', {
    description: message ?? 'Please try again.',
    duration: 8000,
  })
}
