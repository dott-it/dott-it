/** Minimum total student responses for an assessment to appear in Spotlight. */
export const SPOTLIGHT_MIN_RESPONSES = 10

export type SpotlightThematicStatus = 'processing' | 'completed' | null

/**
 * Whether an assessment should appear as a spotlight card for a teacher.
 * Threshold is total responses on the assessment (not per hour).
 */
export function isEligibleForSpotlight(input: {
  studentResponsesCount: number
  isDismissed: boolean
}): boolean {
  if (input.isDismissed) return false
  return input.studentResponsesCount >= SPOTLIGHT_MIN_RESPONSES
}

/**
 * Keep class sections that have a non-empty label.
 * Empty / whitespace-only `classSection` values are ignored for display.
 */
export function filterHoursForSpotlight(
  classSections: Array<{ classSection: string } | string>,
): string[] {
  const hours: string[] = []
  const seen = new Set<string>()

  for (const entry of classSections) {
    const raw = typeof entry === 'string' ? entry : entry.classSection
    const label = raw.trim()
    if (!label || seen.has(label)) continue
    seen.add(label)
    hours.push(label)
  }

  return hours
}

/**
 * Prefer active processing, then completed; otherwise none (failed/pending ignored for card UI).
 */
export function pickSpotlightThematicStatus(
  statuses: Array<{ status: string }>,
): SpotlightThematicStatus {
  if (statuses.some((row) => row.status === 'processing')) return 'processing'
  if (statuses.some((row) => row.status === 'completed')) return 'completed'
  return null
}
