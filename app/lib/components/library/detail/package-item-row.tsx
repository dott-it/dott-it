'use client'

import { Copy, Eye, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { MaterialQuickLookDialog } from '@/app/lib/components/library/detail/material-quick-look-dialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  savePendingLibraryExport,
} from '@/lib/library/export/pending-export-selection'
import {
  showExportFailedToast,
  showExportFinishedToast,
} from '@/lib/library/export/show-export-finished-toast'
import {
  exportLibraryMaterials,
  LibraryExportAuthRequiredError,
  LibraryExportRequestError,
  redirectToGoogleExportAuth,
} from '@/lib/library/export/trigger-library-export'
import type { PackageItem } from '@/lib/library/materials'
import {
  packageItemAllowsQuickLook,
  packageItemAvailability,
  packageItemRowClass,
  packageItemStatusLabel,
  packageItemUnavailableLabel,
} from '@/lib/library/materials'
import { cn } from '@/lib/utils'

interface PackageItemRowProps {
  item: PackageItem
  assessmentTitle: string
  unitCode: string
  assessmentId: string
  previewExcerpt?: string
}

const iconButtonBase =
  'size-9 shrink-0 rounded-full border border-primary p-0 text-primary shadow-none hover:bg-primary/10'

export function PackageItemRow({
  item,
  assessmentTitle,
  unitCode,
  assessmentId,
  previewExcerpt,
}: PackageItemRowProps) {
  const [quickLookOpen, setQuickLookOpen] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const availability = packageItemAvailability(item)
  const isPermanentAbsent = availability === 'not-applicable'
  const isPlanned = availability === 'planned'
  const selectable = item.available
  const statusText = selectable ? packageItemStatusLabel(item) : packageItemUnavailableLabel(item)
  const showQuickLook = packageItemAllowsQuickLook(item, previewExcerpt)
  const showCopy = selectable
  const isGoogleForm = item.kind === 'google-form'
  const previewTooltip = `Preview ${item.label}`
  const copyTooltip = isGoogleForm
    ? 'Make a copy in your Google Forms'
    : 'Make a copy in your Google Drive'

  const statusClassName = (() => {
    if (isPlanned) {
      return 'truncate text-amber-800/80'
    }
    if (selectable) {
      return 'truncate text-muted-foreground'
    }
    if (isPermanentAbsent) {
      return 'text-muted-foreground/60'
    }
    return 'text-muted-foreground'
  })()

  const handleCopy = async () => {
    if (isCopying) {
      return
    }

    setIsCopying(true)
    try {
      const data = await exportLibraryMaterials({
        unitCode,
        assessmentId,
        assessmentTitle,
        kinds: [item.kind],
      })

      for (const file of data.files ?? []) {
        if (file.action === 'external-link') {
          globalThis.open(file.url, '_blank', 'noopener,noreferrer')
        }
      }

      if (data.folderUrl) {
        showExportFinishedToast({
          folderUrl: data.folderUrl,
          description: isGoogleForm
            ? 'A copy was created in your Google Forms / Drive.'
            : 'A copy was placed in your Google Drive.',
          actionLabel: 'Open folder in Drive',
        })
      }
    } catch (error) {
      if (error instanceof LibraryExportAuthRequiredError) {
        savePendingLibraryExport({
          unitCode,
          assessmentId,
          kinds: [item.kind],
          intent: 'export',
        })
        redirectToGoogleExportAuth(error.authUrl)
        return
      }
      const message =
        error instanceof LibraryExportRequestError
          ? error.message
          : 'Export failed. Please try again.'
      showExportFailedToast(message)
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${packageItemRowClass(item)}`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{item.label}</p>
          <p className={`text-xs ${statusClassName}`} title={statusText}>
            {statusText}
          </p>
        </div>
        <TooltipProvider delayDuration={200}>
          <div className="flex shrink-0 items-center gap-1.5">
            {showQuickLook ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={iconButtonBase}
                    onClick={() => setQuickLookOpen(true)}
                    aria-label={previewTooltip}
                  >
                    <Eye className="size-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="border-primary bg-primary text-primary-foreground"
                >
                  {previewTooltip}
                </TooltipContent>
              </Tooltip>
            ) : null}
            {showCopy ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={isGoogleForm ? 'default' : 'outline'}
                    size="icon"
                    className={cn(
                      iconButtonBase,
                      isGoogleForm &&
                        'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                    )}
                    disabled={isCopying}
                    onClick={() => void handleCopy()}
                    aria-label={copyTooltip}
                  >
                    {isCopying ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Copy className="size-4" aria-hidden />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="border-primary bg-primary text-primary-foreground"
                >
                  {copyTooltip}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </TooltipProvider>
      </div>

      <MaterialQuickLookDialog
        item={item}
        assessmentTitle={assessmentTitle}
        unitCode={unitCode}
        assessmentId={assessmentId}
        previewExcerpt={previewExcerpt}
        open={quickLookOpen}
        onOpenChange={setQuickLookOpen}
      />
    </>
  )
}
