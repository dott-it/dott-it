/** Columns the 409 check needs. Curriculum text stays out of this query. */
export const templateConflictSelect = {
  id: true,
  title: true,
  type: true,
  unitCode: true,
  lessonNumber: true,
} as const

export type TemplateConflictCandidate = {
  id: string
  title: string
  type: string
  unitCode: string | null
  lessonNumber: number | null
}

export type TemplateDuplicateMatchInput = {
  unitCode: string
  lessonNumber: number
  type: string
  title: string
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase()
}

function normalizeType(type: string): string {
  return type.trim().toLowerCase()
}

/**
 * Templates that share the same OpenSciEd structure (unit + lesson + type).
 */
export function findStructuralTemplateDuplicates<T extends TemplateConflictCandidate>(
  templates: T[],
  input: Pick<TemplateDuplicateMatchInput, 'unitCode' | 'lessonNumber' | 'type'>,
): T[] {
  const unitCode = input.unitCode.trim()
  const type = normalizeType(input.type)

  return templates.filter(
    (template) =>
      (template.unitCode ?? '').trim() === unitCode &&
      template.lessonNumber === input.lessonNumber &&
      normalizeType(template.type ?? '') === type,
  )
}

/**
 * Whether the proposed title collides with any structural duplicate (case-insensitive).
 */
export function titleMatchesExistingTemplate(
  templates: Pick<TemplateConflictCandidate, 'title'>[],
  title: string,
): boolean {
  const normalized = normalizeTitle(title)
  if (!normalized) {
    return false
  }
  return templates.some((template) => normalizeTitle(template.title) === normalized)
}

/**
 * Template whose unit, lesson, type, and title all match (case-insensitive type and title).
 * `excludeId` skips the record being updated so a no-op save is not a conflict.
 */
export function findExactTemplateTitleConflict<T extends TemplateConflictCandidate>(
  templates: T[],
  input: TemplateDuplicateMatchInput,
  excludeId?: string,
): T | undefined {
  const pool = excludeId ? templates.filter((template) => template.id !== excludeId) : templates
  const structural = findStructuralTemplateDuplicates(pool, input)
  const normalized = normalizeTitle(input.title)
  if (!normalized) {
    return undefined
  }
  return structural.find((template) => normalizeTitle(template.title) === normalized)
}

const MAX_COPY_TITLE_ATTEMPTS = 100

/**
 * Titles already used by the same unit, lesson, and type.
 * Lesson may be null for legacy templates.
 */
export function copyTitlesTaken(
  templates: TemplateConflictCandidate[],
  input: {
    unitCode: string | null
    lessonNumber: number | null
    type: string
  },
): string[] {
  const unitCode = (input.unitCode ?? '').trim()
  const type = input.type.trim().toLowerCase()
  return templates
    .filter(
      (template) =>
        (template.unitCode ?? '').trim() === unitCode &&
        template.lessonNumber === input.lessonNumber &&
        template.type.trim().toLowerCase() === type,
    )
    .map((template) => template.title)
}

/**
 * First free duplicate title: "Title (Copy)", then "Title (Copy 2)", "Title (Copy 3)", ...
 * Comparison ignores case and surrounding spaces, matching the unique index.
 */
/** Drop a trailing "(Copy)" or "(Copy 2)" so duplicating a copy does not nest the suffix. */
export function copyTitleBase(title: string): string {
  return title.trim().replace(/\s+\(Copy(?:\s+\d+)?\)\s*$/i, '').trim()
}

export function nextCopyTitle(originalTitle: string, takenTitles: string[]): string | null {
  const taken = new Set(takenTitles.map((title) => title.trim().toLowerCase()))
  const base = copyTitleBase(originalTitle) || originalTitle.trim()
  const first = `${base} (Copy)`
  if (!taken.has(first.toLowerCase())) {
    return first
  }

  for (let copyNumber = 2; copyNumber <= MAX_COPY_TITLE_ATTEMPTS; copyNumber += 1) {
    const candidate = `${base} (Copy ${copyNumber})`
    if (!taken.has(candidate.toLowerCase())) {
      return candidate
    }
  }

  return null
}

/** True when Postgres rejected a write that matches AssessmentTemplate_structure_title_key. */
export function isTemplateUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'P2002'
  )
}

export function templateTitleConflictResponse(existingId?: string) {
  const details = existingId
    ? `Change the title to save a new version, or edit the existing template (${existingId}).`
    : 'Change the title to save a new version, or edit the existing template.'

  return {
    error: 'Conflict' as const,
    message: 'A template with this unit, lesson, type, and title already exists',
    details,
    type: 'QUERY_ERROR' as const,
    retryable: false,
  }
}
