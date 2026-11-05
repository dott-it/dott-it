import type { PackageItemKind } from '@/lib/library/materials/types'

const PENDING_EXPORT_STORAGE_KEY = 'dott-it.library.export.pending'

export type PendingLibraryExportIntent = 'export' | 'download'

export interface PendingLibraryExport {
  unitCode: string
  assessmentId: string
  kinds: PackageItemKind[]
  /** Defaults to export when omitted (older pending payloads). */
  intent?: PendingLibraryExportIntent
}

const PENDING_UNIT_ACTION_KEY = 'dott-it.library.export.pendingUnitAction'

export function savePendingUnitLibraryAction(intent: PendingLibraryExportIntent): void {
  try {
    sessionStorage.setItem(PENDING_UNIT_ACTION_KEY, intent)
  } catch {
    // Ignore storage failures (private mode / quota).
  }
}

export function loadPendingUnitLibraryAction(): PendingLibraryExportIntent | null {
  try {
    const value = sessionStorage.getItem(PENDING_UNIT_ACTION_KEY)
    if (value === 'export' || value === 'download') {
      return value
    }
    return null
  } catch {
    return null
  }
}

export function clearPendingUnitLibraryAction(): void {
  try {
    sessionStorage.removeItem(PENDING_UNIT_ACTION_KEY)
  } catch {
    // ignore
  }
}

function isPackageItemKind(value: unknown): value is PackageItemKind {
  return (
    typeof value === 'string' &&
    [
      'student-handout',
      'google-form',
      'teacher-guide',
      'answer-key',
      'rubric',
      'guidance-sheet',
    ].includes(value)
  )
}

export function savePendingLibraryExport(payload: PendingLibraryExport): void {
  try {
    sessionStorage.setItem(PENDING_EXPORT_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures (private mode / quota) — OAuth return will fall back.
  }
}

export function loadPendingLibraryExport(args: {
  unitCode: string
  assessmentId: string
}): PendingLibraryExport | null {
  try {
    const raw = sessionStorage.getItem(PENDING_EXPORT_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<PendingLibraryExport>
    if (
      parsed.unitCode !== args.unitCode ||
      parsed.assessmentId !== args.assessmentId ||
      !Array.isArray(parsed.kinds)
    ) {
      return null
    }

    const kinds = parsed.kinds.filter((kind) => isPackageItemKind(kind))
    if (kinds.length === 0) {
      return null
    }

    const intent =
      parsed.intent === 'download' || parsed.intent === 'export' ? parsed.intent : 'export'

    return {
      unitCode: parsed.unitCode,
      assessmentId: parsed.assessmentId,
      kinds,
      intent,
    }
  } catch {
    return null
  }
}

export function clearPendingLibraryExport(): void {
  try {
    sessionStorage.removeItem(PENDING_EXPORT_STORAGE_KEY)
  } catch {
    // ignore
  }
}
