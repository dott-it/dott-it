import type { IngestedFileRefs, IngestedUnitManifest } from '@/lib/library/ingest/types'
import { buildDrivePathIndex, matchManifestPathToDrive } from './path-index'
import type { DriveFileEntry, ManifestFileRefMatch, UnitDriveIndex } from './types'

const FILE_REF_KEYS: Array<keyof IngestedFileRefs> = [
  'studentHandout',
  'teacherGuide',
  'answerKey',
  'googleForm',
  'rubric',
  'guidanceSheet',
]

function isLocalFileRef(value: string | null | undefined): value is string {
  if (!value) {
    return false
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return false
  }
  if (value.startsWith('/guidance/')) {
    return false
  }
  return true
}

export function collectManifestFileRefs(manifest: IngestedUnitManifest): Array<{
  assessmentId: string
  field: string
  manifestPath: string
}> {
  const refs: Array<{ assessmentId: string; field: string; manifestPath: string }> = []

  for (const assessment of manifest.assessments) {
    for (const field of FILE_REF_KEYS) {
      const value = assessment.files[field]
      if (isLocalFileRef(value)) {
        refs.push({
          assessmentId: assessment.id,
          field,
          manifestPath: value,
        })
      }
    }
  }

  if (manifest.unitOverviewPath && isLocalFileRef(manifest.unitOverviewPath)) {
    refs.push({
      assessmentId: '__unit__',
      field: 'unitOverviewPath',
      manifestPath: manifest.unitOverviewPath,
    })
  }

  for (const lesson of manifest.lessons ?? []) {
    if (lesson.teacherEditionPath && isLocalFileRef(lesson.teacherEditionPath)) {
      refs.push({
        assessmentId: `__lesson-${lesson.lessonNum}__`,
        field: 'teacherEditionPath',
        manifestPath: lesson.teacherEditionPath,
      })
    }
  }

  return refs
}

export function buildUnitDriveIndex(args: {
  unitId: string
  driveRootFolderId: string
  gradeFolder: string
  unitFolder: string
  unitDriveFolderId: string
  manifest: IngestedUnitManifest
  driveFiles: DriveFileEntry[]
  indexedAt?: string
}): UnitDriveIndex {
  const index = buildDrivePathIndex(args.driveFiles)
  const manifestRefs = collectManifestFileRefs(args.manifest)

  const matches: ManifestFileRefMatch[] = []
  const unmatchedManifestPaths: UnitDriveIndex['unmatchedManifestPaths'] = []

  for (const ref of manifestRefs) {
    const match = matchManifestPathToDrive(ref.manifestPath, index)
    if (!match) {
      unmatchedManifestPaths.push(ref)
      continue
    }

    matches.push({
      assessmentId: ref.assessmentId,
      field: ref.field,
      manifestPath: ref.manifestPath,
      driveFileId: match.entry.driveFileId,
      driveRelativePath: match.entry.relativePath,
      matchKind: match.matchKind,
      modifiedTime: match.entry.modifiedTime,
    })
  }

  const filesByRelativePath: UnitDriveIndex['filesByRelativePath'] = {}
  for (const entry of args.driveFiles) {
    filesByRelativePath[entry.relativePath] = {
      driveFileId: entry.driveFileId,
      name: entry.name,
      modifiedTime: entry.modifiedTime,
    }
  }

  return {
    unitId: args.unitId,
    driveRootFolderId: args.driveRootFolderId,
    gradeFolder: args.gradeFolder,
    unitFolder: args.unitFolder,
    unitDriveFolderId: args.unitDriveFolderId,
    indexedAt: args.indexedAt ?? new Date().toISOString(),
    fileCount: args.driveFiles.length,
    manifestPathCount: manifestRefs.length,
    matchedCount: matches.length,
    unmatchedManifestPaths,
    matches,
    filesByRelativePath,
  }
}
