'use client'

import { Download, ExternalLink, FileDown, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LibraryExportBusyPanel,
  expectedUnitExportSeconds,
  useLibraryExportLeaveGuard,
} from '@/app/lib/components/library/export-busy-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  clearPendingUnitLibraryAction,
  loadPendingUnitLibraryAction,
  savePendingUnitLibraryAction,
} from '@/lib/library/export/pending-export-selection'
import {
  showExportFailedToast,
  showExportFinishedToast,
} from '@/lib/library/export/show-export-finished-toast'
import {
  downloadLibraryMaterialsZip,
  LibraryDownloadAuthRequiredError,
} from '@/lib/library/export/trigger-library-download'
import type { LibraryUnitExportResponse, UnitExportSummary } from '@/lib/library/export/types'
import { cn } from '@/lib/utils'

interface ExportUnitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unitCode: string
  unitTitle: string
  exportSummary: UnitExportSummary
}

function unitExportSummaryText(summary: UnitExportSummary): string {
  const assessmentLabel = summary.assessmentCount === 1 ? 'assessment' : 'assessments'
  const materialLabel = summary.materialCount === 1 ? 'material' : 'materials'
  return `${summary.assessmentCount} ${assessmentLabel} · ${summary.materialCount} ${materialLabel}`
}

export function ExportUnitDialog({
  open,
  onOpenChange,
  unitCode,
  unitTitle,
  exportSummary,
}: ExportUnitDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successFolderUrl, setSuccessFolderUrl] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [result, setResult] = useState<LibraryUnitExportResponse | null>(null)
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

  const runExport = useCallback(async () => {
    if (!exportSummary.ready) {
      return
    }

    setIsExporting(true)
    setErrorMessage(null)
    setSuccessFolderUrl(null)
    setResult(null)

    try {
      const response = await fetch('/api/library/export/unit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitCode }),
      })

      const data = (await response.json().catch(() => ({}))) as LibraryUnitExportResponse & {
        error?: string
        code?: string
        authUrl?: string
      }

      if (response.status === 401 && data.code === 'GOOGLE_AUTH_REQUIRED' && data.authUrl) {
        savePendingUnitLibraryAction('export')
        const returnTo = `${globalThis.location.pathname}${globalThis.location.search}`
        const authUrl = new URL(data.authUrl, globalThis.location.origin)
        if (!authUrl.searchParams.has('returnTo')) {
          authUrl.searchParams.set('returnTo', returnTo)
        }
        globalThis.location.assign(authUrl.toString())
        return
      }

      if (!response.ok) {
        const message = data.error ?? 'Export failed. Please try again.'
        setErrorMessage(message)
        showExportFailedToast(message)
        return
      }

      setResult(data)
      setSuccessFolderUrl(data.folderUrl)
      setStatusMessage(null)
      if (data.folderUrl) {
        showExportFinishedToast({
          folderUrl: data.folderUrl,
          description: `Exported ${data.assessmentCount} assessments to your Google Drive.`,
          actionLabel: 'Open unit folder in Drive',
        })
      }
    } catch {
      const message = 'Export failed. Please try again.'
      setErrorMessage(message)
      showExportFailedToast(message)
    } finally {
      setIsExporting(false)
    }
  }, [exportSummary.ready, unitCode])

  const runDownload = useCallback(async () => {
    if (!exportSummary.ready) {
      return
    }

    setIsDownloading(true)
    setErrorMessage(null)

    try {
      await downloadLibraryMaterialsZip(
        {
          mode: 'unit',
          unitCode,
        },
        `Unit ${unitCode} materials.zip`,
      )
    } catch (error) {
      if (error instanceof LibraryDownloadAuthRequiredError) {
        savePendingUnitLibraryAction('download')
        const returnTo = `${globalThis.location.pathname}${globalThis.location.search}`
        const authUrl = new URL(error.authUrl, globalThis.location.origin)
        if (!authUrl.searchParams.has('returnTo')) {
          authUrl.searchParams.set('returnTo', returnTo)
        }
        globalThis.location.assign(authUrl.toString())
        return
      }
      const message = error instanceof Error ? error.message : 'Download failed. Please try again.'
      setErrorMessage(message)
      showExportFailedToast(message)
    } finally {
      setIsDownloading(false)
    }
  }, [exportSummary.ready, unitCode])

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

    setErrorMessage(null)
    setSuccessFolderUrl(null)
    setResult(null)
    setStatusMessage(null)

    const params = new URLSearchParams(globalThis.location.search)
    if (params.get('googleExport') === 'ready') {
      params.delete('googleExport')
      const nextSearch = params.toString()
      const nextUrl = `${globalThis.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`
      globalThis.history.replaceState({}, '', nextUrl)

      const intent = loadPendingUnitLibraryAction() ?? 'export'
      clearPendingUnitLibraryAction()

      if (!postOAuthExportStarted.current && exportSummary.ready) {
        postOAuthExportStarted.current = true
        if (intent === 'download') {
          setStatusMessage('Google account connected. Preparing download…')
          void runDownload()
        } else {
          setStatusMessage('Google account connected. Exporting unit materials…')
          void runExport()
        }
      }
    }
  }, [open, exportSummary.ready, runExport, runDownload])

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
            Unit {unitCode} · Export unit
          </DialogDescription>
          <DialogTitle className="text-xl leading-snug">
            Unit {unitCode}: {unitTitle}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Copy all available assessment materials for this unit to your Google Drive, or download
            them as a zip. Existing Google Forms open in a new tab; assessments without a Form yet
            get a new Form generated from the student handout. Each Drive export assessment gets its
            own folder inside{' '}
            <span className="font-medium text-foreground">
              Dott.it / OpenSciEd / Unit {unitCode}
            </span>
            . Teacher Edition guidance sheets are not included.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-4">
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {unitExportSummaryText(exportSummary)} will be exported.
          </p>

          {busy ? (
            <LibraryExportBusyPanel
              mode={isDownloading ? 'download' : 'export'}
              assessmentCount={exportSummary.assessmentCount}
              expectedSeconds={
                isDownloading
                  ? Math.max(45, exportSummary.assessmentCount * 8)
                  : expectedUnitExportSeconds(exportSummary.assessmentCount)
              }
            />
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
            <div className="space-y-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-3 text-sm text-muted-foreground">
              <p>
                Exported {result?.assessmentCount ?? exportSummary.assessmentCount} assessments to
                your Google Drive.
              </p>
              <a
                href={successFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-4" aria-hidden />
                Open unit folder in Drive
              </a>
              {result?.externalLinks.length ? (
                <div className="space-y-2 border-t border-border/60 pt-3">
                  <p className="font-medium text-foreground">Google Forms (open separately)</p>
                  <ul className="space-y-1">
                    {result.externalLinks.map((link) => (
                      <li key={`${link.kind}-${link.url}`}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-border px-6 py-4 sm:flex-col sm:space-x-0">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={!exportSummary.ready || busy}
              onClick={() => void runDownload()}
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
              disabled={!exportSummary.ready || busy}
              onClick={() => void runExport()}
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              {isExporting ? 'Exporting unit…' : 'Export unit to Google Drive'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
