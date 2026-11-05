'use client'

import { CloudUpload, ExternalLink, FileDown, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LibraryExportBusyPanel,
  useLibraryExportLeaveGuard,
} from '@/app/lib/components/library/export-busy-panel'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PackageItem } from '@/lib/library/materials'
import {
  getBulkExportPackageItems,
  getDisplayPackageItems,
  packageItemAvailability,
  packageItemRowClass,
  packageItemStatusLabel,
  packageItemUnavailableLabel,
} from '@/lib/library/materials'
import {
  clearPendingLibraryExport,
  loadPendingLibraryExport,
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
import {
  downloadLibraryMaterialsZip,
  LibraryDownloadAuthRequiredError,
} from '@/lib/library/export/trigger-library-download'
import type { MaterialAssessmentContext } from '@/lib/library/materials'
import type { PackageItemAvailability } from '@/lib/library/materials/helpers'
import { cn } from '@/lib/utils'

interface ExportMaterialsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: MaterialAssessmentContext
  assessmentTitle: string
  unitCode: string
  lessonNumber?: number
}

function formatLessonLabel(lessonNumber?: number): string | undefined {
  if (!lessonNumber) {
    return undefined
  }
  return `Lesson ${String(lessonNumber).padStart(2, '0')}`
}

export function ExportMaterialsDialog({
  open,
  onOpenChange,
  context,
  assessmentTitle,
  unitCode,
  lessonNumber,
}: ExportMaterialsDialogProps) {
  const items = useMemo(() => {
    const display = getDisplayPackageItems(context).filter((item) => item.kind !== 'google-form')
    return display
  }, [context])
  const availableKinds = useMemo(
    () => getBulkExportPackageItems(context).map((item) => item.kind),
    [context],
  )

  const [selectedKinds, setSelectedKinds] = useState<Set<PackageItem['kind']>>(
    () => new Set(availableKinds),
  )
  const [isExporting, setIsExporting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successFolderUrl, setSuccessFolderUrl] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const postOAuthExportStarted = useRef(false)
  const dialogWasOpenRef = useRef(false)
  const busy = isExporting || isDownloading

  useLibraryExportLeaveGuard(busy)

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && busy) {
        return
      }
      onOpenChange(nextOpen)
    },
    [busy, onOpenChange],
  )

  const runExport = useCallback(
    async (kinds: PackageItem['kind'][]) => {
      if (kinds.length === 0) {
        return
      }

      setIsExporting(true)
      setErrorMessage(null)
      setSuccessFolderUrl(null)

      try {
        const data = await exportLibraryMaterials({
          unitCode,
          assessmentId: context.id,
          assessmentTitle,
          kinds,
        })

        for (const file of data.files ?? []) {
          if (file.action === 'external-link') {
            globalThis.open(file.url, '_blank', 'noopener,noreferrer')
          }
        }

        setSuccessFolderUrl(data.folderUrl)
        setStatusMessage(null)
        if (data.folderUrl) {
          showExportFinishedToast({
            folderUrl: data.folderUrl,
            description: 'Assessment materials were copied to your Google Drive.',
            actionLabel: 'Open folder in Drive',
          })
        }
      } catch (error) {
        if (error instanceof LibraryExportAuthRequiredError) {
          savePendingLibraryExport({
            unitCode,
            assessmentId: context.id,
            kinds,
            intent: 'export',
          })
          redirectToGoogleExportAuth(error.authUrl)
          return
        }
        const message =
          error instanceof LibraryExportRequestError
            ? error.message
            : 'Export failed. Please try again.'
        setErrorMessage(message)
        showExportFailedToast(message)
      } finally {
        setIsExporting(false)
      }
    },
    [assessmentTitle, context.id, unitCode],
  )

  const runDownload = useCallback(
    async (kinds: PackageItem['kind'][]) => {
      const downloadKinds = kinds.filter((kind) => kind !== 'google-form')
      if (downloadKinds.length === 0) {
        return
      }

      setIsDownloading(true)
      setErrorMessage(null)

      try {
        await downloadLibraryMaterialsZip(
          {
            mode: 'assessment',
            unitCode,
            assessmentId: context.id,
            assessmentTitle,
            kinds: downloadKinds,
          },
          `Unit ${unitCode} - ${assessmentTitle} materials.zip`,
        )
      } catch (error) {
        if (error instanceof LibraryDownloadAuthRequiredError) {
          savePendingLibraryExport({
            unitCode,
            assessmentId: context.id,
            kinds: downloadKinds,
            intent: 'download',
          })
          redirectToGoogleExportAuth(error.authUrl)
          return
        }
        const message = error instanceof Error ? error.message : 'Download failed. Please try again.'
        setErrorMessage(message)
        showExportFailedToast(message)
      } finally {
        setIsDownloading(false)
      }
    },
    [assessmentTitle, context.id, unitCode],
  )

  useEffect(() => {
    if (!open) {
      postOAuthExportStarted.current = false
      dialogWasOpenRef.current = false
      return
    }

    const justOpened = !dialogWasOpenRef.current
    dialogWasOpenRef.current = true
    // Stay-open updates (e.g. busy → false after export) must not wipe success/error UI.
    if (!justOpened) {
      return
    }

    const allAvailableKinds = new Set(getDisplayPackageItems(context)
      .filter((item) => item.available)
      .map((item) => item.kind))
    const pending = loadPendingLibraryExport({
      unitCode,
      assessmentId: context.id,
    })
    const pendingKinds = pending?.kinds.filter((kind) => allAvailableKinds.has(kind)) ?? []
    const initialKinds =
      pendingKinds.some((kind) => kind !== 'google-form')
        ? pendingKinds.filter((kind) => kind !== 'google-form')
        : availableKinds

    setSelectedKinds(new Set(initialKinds))
    setErrorMessage(null)
    setSuccessFolderUrl(null)
    setStatusMessage(null)

    const params = new URLSearchParams(globalThis.location.search)
    if (params.get('googleExport') === 'ready') {
      params.delete('googleExport')
      const nextSearch = params.toString()
      const nextUrl = `${globalThis.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`
      globalThis.history.replaceState({}, '', nextUrl)

      const kindsToResume = pendingKinds.length > 0 ? pendingKinds : availableKinds
      const intent = pending?.intent ?? 'export'
      clearPendingLibraryExport()

      if (!postOAuthExportStarted.current && kindsToResume.length > 0) {
        postOAuthExportStarted.current = true
        if (intent === 'download') {
          setStatusMessage('Google account connected. Preparing download…')
          void runDownload(kindsToResume)
        } else {
          setStatusMessage('Google account connected. Exporting materials…')
          void runExport(kindsToResume)
        }
      }
    }
  }, [open, availableKinds, context, runExport, runDownload, unitCode])

  const selectedItems = items.filter((item) => selectedKinds.has(item.kind) && item.available)
  const hasSelection = selectedItems.length > 0
  const lessonLabel = formatLessonLabel(lessonNumber)
  const headerParts = [`Unit ${unitCode}`]
  if (lessonLabel) {
    headerParts.push(lessonLabel)
  }
  headerParts.push('Export materials')

  const toggleItem = (kind: PackageItem['kind'], checked: boolean) => {
    setSelectedKinds((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(kind)
      } else {
        next.delete(kind)
      }
      return next
    })
    setErrorMessage(null)
    setSuccessFolderUrl(null)
  }

  const handleExport = async () => {
    setStatusMessage(null)
    await runExport(selectedItems.map((item) => item.kind))
  }

  const handleDownload = async () => {
    setStatusMessage(null)
    await runDownload(selectedItems.map((item) => item.kind))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[92vh] max-w-lg gap-0 overflow-y-auto p-0',
          busy && '[&>button]:pointer-events-none [&>button]:opacity-0',
        )}
        onPointerDownOutside={(event) => {
          if (busy) {
            event.preventDefault()
          }
        }}
        onEscapeKeyDown={(event) => {
          if (busy) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader className="space-y-2 border-b border-border px-6 py-5 text-left">
          <DialogDescription className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {headerParts.join(' · ')}
          </DialogDescription>
          <DialogTitle className="text-xl leading-snug">{assessmentTitle}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Choose which materials to either export to your Google Drive or download locally on your
            computer as a zip file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Materials to export
          </p>

          <ul className="space-y-2">
            {items.map((item) => {
              const availability = packageItemAvailability(item)
              const selectable = item.available
              const checked = selectedKinds.has(item.kind)
              const statusText = selectable
                ? packageItemStatusLabel(item)
                : packageItemUnavailableLabel(item)
              const statusClass = exportItemStatusClass(availability, selectable)

              return (
                <li
                  key={item.kind}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border px-3 py-3',
                    packageItemRowClass(item),
                  )}
                >
                  <Checkbox
                    id={`export-${item.kind}`}
                    checked={checked}
                    disabled={!selectable || busy}
                    onCheckedChange={(value) => toggleItem(item.kind, value === true)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={`export-${item.kind}`}
                    className={cn(
                      'min-w-0 flex-1 space-y-1',
                      selectable ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                  >
                    <p className="text-sm font-medium leading-snug">{item.label}</p>
                    <p className={cn('text-xs leading-relaxed', statusClass)}>{statusText}</p>
                  </label>
                </li>
              )
            })}
          </ul>

          {busy ? (
            <LibraryExportBusyPanel mode={isDownloading ? 'download' : 'export'} expectedSeconds={90} />
          ) : null}

          {statusMessage && !busy ? (
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {statusMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {successFolderUrl ? (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-muted-foreground">
              <p>Materials copied to your Google Drive.</p>
              <a
                href={successFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-4" aria-hidden />
                Open folder in Drive
              </a>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-border px-6 py-4 sm:flex-col sm:space-x-0">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={!hasSelection || busy}
              onClick={() => void handleDownload()}
            >
              {isDownloading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <FileDown className="size-4" aria-hidden />
              )}
              {isDownloading ? 'Preparing zip…' : 'Download files'}
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={!hasSelection || busy}
              onClick={() => void handleExport()}
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <CloudUpload className="size-4" aria-hidden />
              )}
              {isExporting ? 'Exporting…' : 'Export to Google Drive'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function exportItemStatusClass(
  availability: PackageItemAvailability,
  selectable: boolean,
): string {
  if (selectable && availability === 'planned') {
    return statusTextClass(availability)
  }
  if (selectable) {
    return 'text-muted-foreground'
  }
  return statusTextClass(availability)
}

function statusTextClass(availability: PackageItemAvailability): string {
  if (availability === 'planned') {
    return 'text-amber-800/80'
  }
  if (availability === 'not-applicable') {
    return 'text-muted-foreground/60'
  }
  return 'text-muted-foreground'
}
