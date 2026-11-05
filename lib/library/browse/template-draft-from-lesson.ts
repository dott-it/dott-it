import { promises as fs } from 'node:fs'
import path from 'node:path'
import { extractDocxPlainText } from '@/lib/library/digitize/extract-docx-plain-text'
import { loadDriveIndex } from '@/lib/library/drive-index/load-drive-index'
import { downloadDriveFileBytes } from '@/lib/library/export/download-drive-file'
import { getLibraryDriveServiceAccountAccessToken } from '@/lib/library/export/service-account-token'
import { findIngestedAssessment } from '@/lib/library/ingest/load-manifest'
import type { LessonBrowseRow } from './types'
import type { UnitBrowseModel } from './types'
import {
  buildTemplateDraftFieldsFromLesson,
  findLessonInUnit,
  type AssessmentTemplateDraftFields,
} from './template-draft-fields'

export type { AssessmentTemplateDraftFields } from './template-draft-fields'
export {
  buildTemplateDraftFieldsFromLesson,
  findLessonInUnit,
  formatLessonTeachersEdition,
} from './template-draft-fields'

function candidateAnswerKeyPaths(relativePath: string): string[] {
  const trimmed = relativePath.trim()
  if (!trimmed) {
    return []
  }

  const candidates = [trimmed]
  const materialsRoot = process.env.OPENSCIED_MATERIALS_ROOT?.trim()
  if (materialsRoot) {
    candidates.push(path.join(materialsRoot, trimmed))
  }

  const contentPipelineRoot = process.env.CONTENT_PIPELINE_ROOT?.trim()
  if (contentPipelineRoot) {
    candidates.push(path.join(contentPipelineRoot, trimmed))
  }

  return [
    ...new Set([
      ...candidates,
      path.join(process.cwd(), trimmed),
      path.join(process.cwd(), 'data', 'curriculum', trimmed),
    ]),
  ]
}

async function extractAnswerKeyTextFromLocalPath(relativePath: string): Promise<string> {
  for (const candidate of candidateAnswerKeyPaths(relativePath)) {
    try {
      const bytes = await fs.readFile(candidate)
      const extracted = await extractDocxPlainText(bytes)
      const text = extracted.trim()
      if (text) {
        return text
      }
    } catch {
      // Try next candidate; missing local Drive-relative paths are expected.
    }
  }
  return ''
}

export function resolveAnswerKeyDriveFileId(
  unitCode: string,
  assessmentId: string,
): string | null {
  const index = loadDriveIndex(unitCode)
  if (!index) {
    return null
  }

  const match = index.matches.find(
    (row) => row.assessmentId === assessmentId && row.field === 'answerKey' && row.driveFileId,
  )
  return match?.driveFileId ?? null
}

const answerKeyTextCache = new Map<string, string>()

/**
 * Reuse extracted answer-key text for the same file within this process.
 * Empty results are not cached so a later retry can still succeed.
 */
export async function cachedAnswerKeyText(
  cacheKey: string,
  load: () => Promise<string>,
): Promise<string> {
  const cached = answerKeyTextCache.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  const loaded = await load()
  const text = loaded.trim()
  if (text) {
    answerKeyTextCache.set(cacheKey, text)
  }
  return text
}

async function extractAnswerKeyTextFromDrive(driveFileId: string): Promise<string> {
  const accessToken = await getLibraryDriveServiceAccountAccessToken()
  const downloaded = await downloadDriveFileBytes(accessToken, driveFileId)
  const extracted = await extractDocxPlainText(Buffer.from(downloaded.bytes))
  return extracted.trim()
}

export const ANSWER_KEY_UNAVAILABLE_MESSAGE =
  'Could not load the answer key for this lesson. Paste it manually, or try again. An empty field means the key failed to load, not that this lesson has no answer key.'

export const ANSWER_KEY_PARTIAL_MESSAGE =
  'Could not load every answer key for this lesson. The field shows only the keys that loaded. Paste the missing ones manually, or try again.'

export type AnswerKeySection = {
  text: string
  failed: boolean
}

/**
 * A Drive download that yields no text is a failed load.
 * An empty string must not look like a lesson that has no answer key.
 */
export function driveAnswerKeySection(text: string): AnswerKeySection {
  const trimmed = text.trim()
  return { text: trimmed, failed: trimmed.length === 0 }
}

/** Join extracted sections and surface a warning when any configured key failed to load. */
export function combineAnswerKeySections(sections: AnswerKeySection[]): {
  curriculumAnswerKey: string
  answerKeyWarning: string | null
} {
  const curriculumAnswerKey = sections
    .map((section) => section.text.trim())
    .filter(Boolean)
    .join('\n\n')
  const anyFailed = sections.some((section) => section.failed)
  let answerKeyWarning: string | null = null
  if (anyFailed) {
    answerKeyWarning = curriculumAnswerKey
      ? ANSWER_KEY_PARTIAL_MESSAGE
      : ANSWER_KEY_UNAVAILABLE_MESSAGE
  }

  return {
    curriculumAnswerKey,
    answerKeyWarning,
  }
}

async function extractAnswerKeyTextForAssessment(
  unitCode: string,
  assessmentId: string,
  relativePath: string,
): Promise<AnswerKeySection> {
  const localText = await cachedAnswerKeyText(`local:${relativePath}`, () =>
    extractAnswerKeyTextFromLocalPath(relativePath),
  )
  if (localText) {
    return { text: localText, failed: false }
  }

  const driveFileId = resolveAnswerKeyDriveFileId(unitCode, assessmentId)
  if (!driveFileId) {
    return { text: '', failed: true }
  }

  try {
    const text = await cachedAnswerKeyText(`drive:${driveFileId}`, () =>
      extractAnswerKeyTextFromDrive(driveFileId),
    )
    return driveAnswerKeySection(text)
  } catch (error) {
    console.error('Failed to extract answer key from Drive', {
      unitCode,
      assessmentId,
      driveFileId,
      error: error instanceof Error ? error.message : error,
    })
    return { text: '', failed: true }
  }
}

export async function loadLessonAnswerKeyText(
  unitCode: string,
  lesson: LessonBrowseRow,
): Promise<{ curriculumAnswerKey: string; answerKeyWarning: string | null }> {
  const sections = await Promise.all(
    lesson.assessments.map(async (assessment) => {
      const ingested = findIngestedAssessment(unitCode, assessment.id)
      const answerKeyPath = ingested?.files.answerKey?.trim()
      if (!answerKeyPath) {
        return { text: '', failed: false }
      }

      const loaded = await extractAnswerKeyTextForAssessment(
        unitCode,
        assessment.id,
        answerKeyPath,
      )
      if (!loaded.text) {
        return loaded
      }

      return {
        text: `### ${assessment.title}\n\n${loaded.text}`,
        failed: loaded.failed,
      }
    }),
  )

  return combineAnswerKeySections(sections)
}

/**
 * Full template draft for a unit lesson, including answer-key text from local files or Drive.
 * Server-only — do not import from client components or the browse barrel.
 */
export async function buildAssessmentTemplateDraftFromLesson(
  unit: UnitBrowseModel,
  lessonNumber: number,
): Promise<AssessmentTemplateDraftFields | null> {
  const draft = buildTemplateDraftFieldsFromLesson(unit, lessonNumber)
  if (!draft) {
    return null
  }

  const lesson = findLessonInUnit(unit, lessonNumber)
  if (!lesson) {
    return draft
  }

  const answerKey = await loadLessonAnswerKeyText(unit.unitCode, lesson)
  return {
    ...draft,
    curriculumAnswerKey: answerKey.curriculumAnswerKey,
    answerKeyWarning: answerKey.answerKeyWarning,
  }
}
