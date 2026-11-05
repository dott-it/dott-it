/**
 * US K-12 school year helpers.
 * A school year runs from July 1 through June 30 (inclusive of start year).
 * Format: "YYYY-YYYY" (e.g. "2025-2026").
 *
 * Boundaries are evaluated in UTC so runtime helpers match SQL backfills that
 * use EXTRACT(... AT TIME ZONE 'UTC').
 */

const SCHOOL_YEAR_PATTERN = /^(\d{4})-(\d{4})$/

export function getSchoolYearForDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() // 0-indexed; July = 6
  const startYear = month >= 6 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

export function getCurrentSchoolYear(now: Date = new Date()): string {
  return getSchoolYearForDate(now)
}

export function isValidSchoolYear(value: string): boolean {
  const match = SCHOOL_YEAR_PATTERN.exec(value)
  if (!match) return false
  const start = Number.parseInt(match[1], 10)
  const end = Number.parseInt(match[2], 10)
  return end === start + 1
}

/** Recent school years for backoffice selects (newest first), including current. */
export function listRecentSchoolYears(count = 6, now: Date = new Date()): string[] {
  const current = getCurrentSchoolYear(now)
  const startYear = Number.parseInt(current.split('-')[0]!, 10)
  const years: string[] = []
  for (let i = 0; i < count; i++) {
    const y = startYear - i
    years.push(`${y}-${y + 1}`)
  }
  return years
}

export function parseDateLike(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Infer school year from assignedAt, falling back to dueAt, then current.
 */
export function inferSchoolYear(assignedAt?: string | null, dueAt?: string | null): string {
  const fromAssigned = parseDateLike(assignedAt ?? undefined)
  if (fromAssigned) return getSchoolYearForDate(fromAssigned)
  const fromDue = parseDateLike(dueAt ?? undefined)
  if (fromDue) return getSchoolYearForDate(fromDue)
  return getCurrentSchoolYear()
}

export type SchoolYearListFilter = 'current' | 'prior' | string

export type ParseSchoolYearListFilterResult =
  | { ok: true; filter: SchoolYearListFilter | undefined }
  | { ok: false; error: string }

/**
 * Parse a schoolYear query param for list endpoints.
 * Accepts "current", "prior", or a valid YYYY-YYYY value.
 */
export function parseSchoolYearListFilter(
  value: string | null | undefined,
): ParseSchoolYearListFilterResult {
  if (value == null || value === '') {
    return { ok: true, filter: undefined }
  }
  if (value === 'current' || value === 'prior') {
    return { ok: true, filter: value }
  }
  if (isValidSchoolYear(value)) {
    return { ok: true, filter: value }
  }
  return {
    ok: false,
    error: 'schoolYear must be "current", "prior", or a YYYY-YYYY value',
  }
}

/**
 * Build a Prisma where clause fragment for schoolYear filtering.
 * - current → equals current school year
 * - prior → not equal to current school year
 * - YYYY-YYYY → exact match
 */
export function schoolYearWhereClause(
  filter: SchoolYearListFilter | null | undefined,
  now: Date = new Date(),
): { schoolYear: string } | { NOT: { schoolYear: string } } | Record<string, never> {
  if (!filter || filter === '') return {}
  const current = getCurrentSchoolYear(now)
  if (filter === 'current') {
    return { schoolYear: current }
  }
  if (filter === 'prior') {
    return { NOT: { schoolYear: current } }
  }
  if (isValidSchoolYear(filter)) {
    return { schoolYear: filter }
  }
  return {}
}
