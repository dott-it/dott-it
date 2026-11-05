'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function formatExportElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** Soft estimate so the bar moves without claiming exact server progress. */
export function estimateExportProgressPercent(
  elapsedSeconds: number,
  expectedSeconds: number,
): number {
  const ratio = elapsedSeconds / Math.max(expectedSeconds, 1)
  return Math.min(92, Math.round(ratio * 90))
}

export function expectedUnitExportSeconds(assessmentCount: number): number {
  // Forms + Drive copies dominate; unit exports routinely run multi-minute.
  return Math.max(90, assessmentCount * 25)
}

export interface LibraryExportBusyPanelProps {
  mode: 'export' | 'download'
  /** Rough expected duration; used only for the soft progress bar. */
  expectedSeconds?: number
  assessmentCount?: number
  className?: string
}

/**
 * In-dialog feedback while a long library Drive/zip request is in flight.
 * Reminds the teacher to keep the tab open (request is not a background job).
 */
export function LibraryExportBusyPanel({
  mode,
  expectedSeconds = 120,
  assessmentCount,
  className,
}: LibraryExportBusyPanelProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    setElapsedSeconds(0)
    const id = globalThis.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => globalThis.clearInterval(id)
  }, [])

  const progress = estimateExportProgressPercent(elapsedSeconds, expectedSeconds)
  const title = mode === 'download' ? 'Preparing download…' : 'Exporting to Google Drive…'
  let detail =
    'Keep this tab open until export finishes. Leaving or refreshing this page cancels the request.'
  if (mode === 'download') {
    detail = 'Keep this tab open until the zip finishes downloading.'
  } else if (assessmentCount && assessmentCount > 1) {
    detail = `Keep this tab open. Copying materials and Forms for ${assessmentCount} assessments — this often takes a few minutes.`
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'space-y-3 rounded-md border border-primary/25 bg-primary/5 px-3 py-3 text-sm text-foreground',
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" aria-hidden />
        <div className="min-w-0 space-y-1">
          <p className="font-medium leading-snug">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Progress value={progress} className="h-2" aria-label="Export progress estimate" />
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatExportElapsed(elapsedSeconds)} elapsed
          {mode === 'export' ? ' · progress is approximate' : null}
        </p>
      </div>
    </div>
  )
}

/** Warn before tab close/refresh while a library export/download request is running. */
export function useLibraryExportLeaveGuard(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    globalThis.addEventListener('beforeunload', onBeforeUnload)
    return () => globalThis.removeEventListener('beforeunload', onBeforeUnload)
  }, [active])
}
