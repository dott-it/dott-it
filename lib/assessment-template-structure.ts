import { loadIngestedManifest } from '@/lib/library/ingest/load-manifest'

export type TemplateStructureInput = {
  unitCode: unknown
  lessonNumber: unknown
}

export type TemplateStructureSuccess = {
  ok: true
  unitCode: string | null
  lessonNumber: number | null
}

export type TemplateStructureFailure = {
  ok: false
  message: string
  details: string
}

export type TemplateStructureResult = TemplateStructureSuccess | TemplateStructureFailure

function readUnitCode(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readLessonNumber(
  value: unknown,
): { ok: true; lessonNumber: number | null } | { ok: false; message: string; details: string } {
  if (value === null || value === undefined || value === '') {
    return { ok: true, lessonNumber: null }
  }

  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return {
      ok: false,
      message: 'Invalid lesson number',
      details: 'lessonNumber must be a positive integer',
    }
  }

  return { ok: true, lessonNumber: parsed }
}

/** Whether the ingested unit catalog includes this lesson number. */
export function unitHasIngestedLesson(unitCode: string, lessonNumber: number): boolean {
  const manifest = loadIngestedManifest(unitCode)
  if (!manifest) {
    return false
  }

  const lessons = manifest.lessons ?? []
  if (lessons.length > 0) {
    return lessons.some((lesson) => lesson.lessonNum === lessonNumber)
  }

  return lessonNumber >= 1 && lessonNumber <= manifest.lessonCount
}

export type PreservedTemplateStructure = {
  unitCode: string | null
  lessonNumber: number | null
}

function preservedStructureMatches(
  unitCode: string,
  lessonNumber: number | null,
  preserved: PreservedTemplateStructure,
): boolean {
  return unitCode === readUnitCode(preserved.unitCode) && lessonNumber === preserved.lessonNumber
}

/**
 * Normalize unit + lesson for create and update.
 * Create requires both. Update keeps an unchanged unit/lesson pair — including a
 * legacy unit with no lesson — even when that pair is missing from the ingested
 * catalog. A catalog lesson is required when the unit or the lesson number changes.
 */
export function resolveTemplateStructure(
  input: TemplateStructureInput,
  options: { requireUnitAndLesson: boolean; preserved?: PreservedTemplateStructure },
): TemplateStructureResult {
  const unitCode = readUnitCode(input.unitCode)
  const lesson = readLessonNumber(input.lessonNumber)
  if (!lesson.ok) {
    return lesson
  }

  const lessonNumber = lesson.lessonNumber

  if (options.preserved && preservedStructureMatches(unitCode, lessonNumber, options.preserved)) {
    return {
      ok: true,
      unitCode: unitCode || null,
      lessonNumber,
    }
  }

  if (options.requireUnitAndLesson) {
    if (!unitCode) {
      return {
        ok: false,
        message: 'Unit is required',
        details: 'Choose an OpenSciEd unit',
      }
    }
    if (lessonNumber === null) {
      return {
        ok: false,
        message: 'Lesson is required',
        details: 'Choose a lesson from the selected unit',
      }
    }
  }

  if (unitCode && lessonNumber === null) {
    return {
      ok: false,
      message: 'Lesson is required',
      details: 'A unit must include a lesson from that unit',
    }
  }

  if (!unitCode && lessonNumber !== null) {
    return {
      ok: false,
      message: 'Unit is required',
      details: 'A lesson must belong to a unit',
    }
  }

  if (unitCode && lessonNumber !== null && !unitHasIngestedLesson(unitCode, lessonNumber)) {
    return {
      ok: false,
      message: 'Lesson not found',
      details: `Lesson ${lessonNumber} is not in unit ${unitCode}`,
    }
  }

  return {
    ok: true,
    unitCode: unitCode || null,
    lessonNumber,
  }
}
