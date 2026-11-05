import { findIngestedAssessment } from '@/lib/library/ingest/load-manifest'
import { loadDriveIndex } from '@/lib/library/drive-index/load-drive-index'
import type { UnitDriveIndex } from '@/lib/library/drive-index/types'
import { materialContextFromIngested } from '@/lib/library/materials/from-ingested'
import type { PackageItemKind } from '@/lib/library/materials/types'
import { PACKAGE_KIND_TO_INGEST_FIELD } from './kind-to-field'
import type { DriveCopyTarget, ExternalExportLink, GenerateFormTarget } from './types'

export class LibraryExportResolveError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'UNIT_NOT_FOUND'
      | 'ASSESSMENT_NOT_FOUND'
      | 'DRIVE_INDEX_MISSING'
      | 'KIND_UNAVAILABLE'
      | 'UNIT_EXPORT_EMPTY',
  ) {
    super(message)
    this.name = 'LibraryExportResolveError'
  }
}

function findDriveMatch(index: UnitDriveIndex, assessmentId: string, field: string) {
  return index.matches.find((row) => row.assessmentId === assessmentId && row.field === field)
}

export function resolveExportTargets(args: {
  unitCode: string
  assessmentId: string
  kinds: PackageItemKind[]
  driveIndex?: UnitDriveIndex | null
}): {
  driveCopies: DriveCopyTarget[]
  externalLinks: ExternalExportLink[]
  formsToGenerate: GenerateFormTarget[]
} {
  const row = findIngestedAssessment(args.unitCode, args.assessmentId)
  if (!row) {
    throw new LibraryExportResolveError('Assessment not found in ingest manifest', 'ASSESSMENT_NOT_FOUND')
  }

  const context = materialContextFromIngested(row)
  const driveIndex = args.driveIndex ?? loadDriveIndex(args.unitCode)
  const driveCopies: DriveCopyTarget[] = []
  const externalLinks: ExternalExportLink[] = []
  const formsToGenerate: GenerateFormTarget[] = []

  for (const kind of args.kinds) {
    const packageItem = context.package.find((item) => item.kind === kind)
    if (!packageItem?.available) {
      throw new LibraryExportResolveError(`Material kind is not available: ${kind}`, 'KIND_UNAVAILABLE')
    }

    // Prefer copying a digitized Form (teacher-ready). createAssessmentFormInFolder
    // fails fast when teacher-ready is missing — no Playwright in the request path.
    if (kind === 'google-form') {
      if (
        !row.files.studentHandout?.trim() &&
        !row.files.googleForm?.trim() &&
        !row.files.googleFormTeacherReady?.trim()
      ) {
        throw new LibraryExportResolveError('Material kind is not available: google-form', 'KIND_UNAVAILABLE')
      }
      formsToGenerate.push({
        kind: 'google-form',
        label: packageItem.label,
        assessmentTitle: row.title,
      })
      continue
    }

    if (kind === 'guidance-sheet' && packageItem.url?.startsWith('/guidance/')) {
      throw new LibraryExportResolveError(`Material kind is not available: ${kind}`, 'KIND_UNAVAILABLE')
    }

    if (!driveIndex) {
      throw new LibraryExportResolveError('Drive index missing for unit', 'DRIVE_INDEX_MISSING')
    }

    const field = PACKAGE_KIND_TO_INGEST_FIELD[kind]
    if (!field) {
      throw new LibraryExportResolveError(`Material kind is not available: ${kind}`, 'KIND_UNAVAILABLE')
    }

    const match = findDriveMatch(driveIndex, args.assessmentId, field)
    if (!match?.driveFileId) {
      throw new LibraryExportResolveError(`No Drive file for ${kind}`, 'KIND_UNAVAILABLE')
    }

    driveCopies.push({
      kind,
      label: packageItem.label,
      driveFileId: match.driveFileId,
      name: packageItem.fileName ?? packageItem.label,
    })
  }

  return { driveCopies, externalLinks, formsToGenerate }
}
