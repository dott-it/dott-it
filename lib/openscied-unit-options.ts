import comprehensiveMetadata from '@/data/seed/openscied_course_metadata_comprehensive.json'

export type OpenSciEdUnitOption = {
  value: string
  label: string
  gradeLevel: string
}

type CourseLike = {
  grade_level?: string
  units?: Array<{ unit_id?: string }>
}

/**
 * Normalize grade labels so "8", "Grade 8", and "grade 8" compare equal.
 * Non-numeric labels (Kindergarten, High School Biology) match case-insensitively.
 */
export function normalizeGradeLevelKey(gradeLevel: string | null | undefined): string {
  const trimmed = (gradeLevel ?? '').trim()
  if (!trimmed) return ''
  const numbered = /^(?:grade\s+)?(\d+)$/i.exec(trimmed)
  if (numbered) return numbered[1]!
  return trimmed.toLowerCase()
}

export function gradeLevelsMatch(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizeGradeLevelKey(left)
  const b = normalizeGradeLevelKey(right)
  return Boolean(a && b && a === b)
}

/**
 * Standard OpenSciEd unit dropdown options (from course metadata seed).
 */
export function listOpenSciEdUnitOptions(): OpenSciEdUnitOption[] {
  const courses = (comprehensiveMetadata as { courses?: Record<string, CourseLike> }).courses ?? {}
  const options: OpenSciEdUnitOption[] = []
  const seen = new Set<string>()

  for (const course of Object.values(courses)) {
    const gradeLevel = course.grade_level ?? 'Unknown'
    for (const unit of course.units ?? []) {
      const unitId = unit.unit_id
      if (!unitId || seen.has(unitId)) continue
      seen.add(unitId)
      options.push({
        value: unitId,
        label: unitId,
        gradeLevel,
      })
    }
  }

  return options.sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }))
}

/** Resolve template grade level from a unit code using OpenSciEd metadata. */
export function gradeLevelForUnitCode(unitCode: string | null | undefined): string | null {
  const normalized = (unitCode ?? '').trim()
  if (!normalized) return null
  const unit = listOpenSciEdUnitOptions().find((option) => option.value === normalized)
  return unit?.gradeLevel ?? null
}

/**
 * Units for a specific grade level label (e.g. "Grade 6" or "6").
 * Empty grade returns no units.
 */
export function listOpenSciEdUnitOptionsForGrade(
  gradeLevel: string | null | undefined,
): OpenSciEdUnitOption[] {
  if (!normalizeGradeLevelKey(gradeLevel)) return []
  return listOpenSciEdUnitOptions().filter((unit) => gradeLevelsMatch(unit.gradeLevel, gradeLevel))
}
