import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Absolute path to a unit ingest manifest JSON on disk.
 */
export function ingestedManifestPath(unitCode: string, repoRoot = process.cwd()): string {
  return path.join(repoRoot, 'data', 'ingested', `unit-${unitCode}.json`)
}

export type IngestFormUrlField = 'googleForm' | 'googleFormTeacherReady'

export interface PersistGoogleFormUrlResult {
  updated: boolean
  previousUrl: string | null
  assessmentId: string
  unitCode: string
  field: IngestFormUrlField
}

type ManifestAssessmentFiles = {
  googleForm?: string | null
  googleFormTeacherReady?: string | null
}

/**
 * Write (or clear) a live Google Form URL on one assessment in the unit ingest JSON.
 * Keyed by assessmentId so multiple assessments in the same lesson stay independent.
 */
export function persistGoogleFormUrl(args: {
  unitCode: string
  assessmentId: string
  /** Pass null to clear the field. */
  formUrl: string | null
  /** Defaults to library preview (`googleForm`). */
  field?: IngestFormUrlField
  repoRoot?: string
}): PersistGoogleFormUrlResult {
  const field: IngestFormUrlField = args.field ?? 'googleForm'
  const formUrl = args.formUrl === null ? null : args.formUrl.trim()
  if (formUrl !== null && !formUrl.startsWith('http')) {
    throw new Error(`persistGoogleFormUrl expects an http(s) Form URL or null, got: ${formUrl}`)
  }

  const filePath = ingestedManifestPath(args.unitCode, args.repoRoot)
  const raw = readFileSync(filePath, 'utf8')
  const manifest = JSON.parse(raw) as {
    assessments?: Array<{ id?: string; files?: ManifestAssessmentFiles }>
  }

  const matches = (manifest.assessments ?? []).filter((row) => row.id === args.assessmentId)
  if (matches.length === 0 || matches.some((row) => !row.files)) {
    throw new Error(`Assessment ${args.assessmentId} not found in ${filePath}`)
  }

  const previousUrl = matches[0]?.files?.[field]?.trim() || null
  let updated = false
  for (const assessment of matches) {
    if (!assessment.files) {
      continue
    }
    const current = assessment.files[field]?.trim() || null
    const next = formUrl
    if (current === next) {
      continue
    }
    assessment.files[field] = next
    updated = true
  }

  if (!updated) {
    return {
      updated: false,
      previousUrl,
      assessmentId: args.assessmentId,
      unitCode: args.unitCode,
      field,
    }
  }

  writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  return {
    updated: true,
    previousUrl,
    assessmentId: args.assessmentId,
    unitCode: args.unitCode,
    field,
  }
}

/** Persist (or clear) the My Drive teacher-export template (native File upload). */
export function persistGoogleFormTeacherReadyUrl(args: {
  unitCode: string
  assessmentId: string
  formUrl: string | null
  repoRoot?: string
}): PersistGoogleFormUrlResult {
  return persistGoogleFormUrl({ ...args, field: 'googleFormTeacherReady' })
}
