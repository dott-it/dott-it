import { loadDriveIndex } from '@/lib/library/drive-index/load-drive-index'
import { loadIngestedManifest } from '@/lib/library/ingest/load-manifest'
import { isDigitizeEligible } from './eligibility'
import { resolveLessonFolderId } from './resolve-lesson-folder'
import type { DigitizeAssessmentInput } from './types'

export interface DigitizeBatchTarget {
  unitCode: string
  assessmentId: string
  assessmentTitle: string
  handoutDriveFileId: string
  lessonFolderId: string
}

function resolveHandoutDriveFileId(unitCode: string, assessmentId: string): string | null {
  const driveIndex = loadDriveIndex(unitCode)
  if (!driveIndex) {
    return null
  }

  const match = driveIndex.matches.find(
    (row) => row.assessmentId === assessmentId && row.field === 'studentHandout',
  )
  return match?.driveFileId ?? null
}

/**
 * List digitize-eligible formal assessments in a unit, optionally limited to one lesson folder.
 */
export async function listDigitizeTargetsForUnit(args: {
  accessToken: string
  unitCode: string
  force?: boolean
  /** When set, only assessments whose handout parent is this folder. */
  lessonFolderId?: string
}): Promise<DigitizeBatchTarget[]> {
  const manifest = loadIngestedManifest(args.unitCode)
  if (!manifest) {
    throw new Error(`Ingested manifest not found for unit ${args.unitCode}`)
  }

  const targets: DigitizeBatchTarget[] = []
  const seenAssessmentIds = new Set<string>()

  for (const assessment of manifest.assessments ?? []) {
    if (seenAssessmentIds.has(assessment.id)) {
      continue
    }

    const input: DigitizeAssessmentInput = {
      id: assessment.id,
      title: assessment.title,
      source: assessment.source,
      files: assessment.files,
    }
    const eligibility = isDigitizeEligible(input, { force: args.force })
    if (!eligibility.eligible) {
      continue
    }

    const handoutDriveFileId = resolveHandoutDriveFileId(args.unitCode, assessment.id)
    if (!handoutDriveFileId) {
      continue
    }

    const lessonFolderId = await resolveLessonFolderId(args.accessToken, handoutDriveFileId)
    if (args.lessonFolderId && lessonFolderId !== args.lessonFolderId) {
      continue
    }

    seenAssessmentIds.add(assessment.id)
    targets.push({
      unitCode: args.unitCode,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      handoutDriveFileId,
      lessonFolderId,
    })
  }

  return targets
}
