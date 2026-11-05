import { loadIngestedManifest } from '@/lib/library/ingest/load-manifest'
import { loadDriveIndex } from '@/lib/library/drive-index/load-drive-index'
import { materialContextFromIngested } from '@/lib/library/materials/from-ingested'
import {
  getAvailablePackageItems,
  isExportReady,
} from '@/lib/library/materials/helpers'
import type { PackageItemKind } from '@/lib/library/materials/types'
import { distinctTeacherReadyFormId } from '@/lib/library/workspace/parse-google-form'
import { LibraryExportResolveError, resolveExportTargets } from './resolve-export-targets'
import type { DriveCopyTarget, ExternalExportLink, GenerateFormTarget, UnitExportSummary } from './types'

export interface UnitExportAssessmentTarget {
  assessmentId: string
  assessmentTitle: string
  driveCopies: DriveCopyTarget[]
  externalLinks: ExternalExportLink[]
  formsToGenerate: GenerateFormTarget[]
}

const UNIT_EXPORT_KIND_BLOCKLIST = new Set<PackageItemKind>(['guidance-sheet'])

/**
 * Unit export only includes live teacher-ready Forms (copy path).
 * Export-only / preview-only rows stay on single-assessment export so bulk unit
 * export cannot trigger on-the-fly LLM digitize or Playwright convert.
 */
function exportableKindsForAssessment(unitCode: string, assessmentId: string): PackageItemKind[] {
  const row = loadIngestedManifest(unitCode)?.assessments.find((item) => item.id === assessmentId)
  if (!row) {
    return []
  }

  const context = materialContextFromIngested(row)
  if (!isExportReady(context)) {
    return []
  }

  const hasTeacherReady = Boolean(
    distinctTeacherReadyFormId(row.files.googleFormTeacherReady, row.files.googleForm),
  )

  return getAvailablePackageItems(context)
    .filter((item) => {
      if (UNIT_EXPORT_KIND_BLOCKLIST.has(item.kind)) {
        return false
      }
      if (item.kind === 'google-form') {
        return hasTeacherReady
      }
      return true
    })
    .map((item) => item.kind)
}

export function resolveUnitExportTargets(unitCode: string): {
  assessments: UnitExportAssessmentTarget[]
  materialCount: number
} {
  const manifest = loadIngestedManifest(unitCode)
  if (!manifest) {
    throw new LibraryExportResolveError('Unit not found in ingest manifest', 'UNIT_NOT_FOUND')
  }

  const driveIndex = loadDriveIndex(unitCode)
  if (!driveIndex) {
    throw new LibraryExportResolveError('Drive index missing for unit', 'DRIVE_INDEX_MISSING')
  }

  const assessments: UnitExportAssessmentTarget[] = []
  let materialCount = 0

  for (const row of manifest.assessments) {
    const kinds = exportableKindsForAssessment(unitCode, row.id)
    if (kinds.length === 0) {
      continue
    }

    try {
      const resolved = resolveExportTargets({
        unitCode,
        assessmentId: row.id,
        kinds,
        driveIndex,
      })

      if (
        resolved.driveCopies.length === 0 &&
        resolved.externalLinks.length === 0 &&
        resolved.formsToGenerate.length === 0
      ) {
        continue
      }

      materialCount +=
        resolved.driveCopies.length + resolved.externalLinks.length + resolved.formsToGenerate.length
      assessments.push({
        assessmentId: row.id,
        assessmentTitle: row.title,
        driveCopies: resolved.driveCopies,
        externalLinks: resolved.externalLinks,
        formsToGenerate: resolved.formsToGenerate,
      })
    } catch {
      continue
    }
  }

  if (assessments.length === 0) {
    throw new LibraryExportResolveError(
      'No exportable assessment materials for this unit',
      'UNIT_EXPORT_EMPTY',
    )
  }

  return { assessments, materialCount }
}

export function summarizeUnitExport(unitCode: string): UnitExportSummary {
  try {
    const { assessments, materialCount } = resolveUnitExportTargets(unitCode)
    return {
      unitCode,
      ready: assessments.length > 0,
      assessmentCount: assessments.length,
      materialCount,
    }
  } catch {
    return {
      unitCode,
      ready: false,
      assessmentCount: 0,
      materialCount: 0,
    }
  }
}
