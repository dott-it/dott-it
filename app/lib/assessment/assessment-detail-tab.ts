export const ASSESSMENT_DETAIL_TAB_VALUES = ['thematic-analysis', 'students'] as const

export type AssessmentDetailTab = (typeof ASSESSMENT_DETAIL_TAB_VALUES)[number]

export const DEFAULT_ASSESSMENT_DETAIL_TAB: AssessmentDetailTab = 'thematic-analysis'

export function assessmentDetailTabFromQuery(
  value: string | null | undefined,
): AssessmentDetailTab {
  if (value && (ASSESSMENT_DETAIL_TAB_VALUES as readonly string[]).includes(value)) {
    return value as AssessmentDetailTab
  }
  return DEFAULT_ASSESSMENT_DETAIL_TAB
}

/** Assessment detail URL that keeps the active tab (and any other query) in the search string. */
export function assessmentDetailHref(
  assessmentId: string,
  tab: AssessmentDetailTab,
  search = '',
): string {
  const params = new URLSearchParams(search)
  params.set('tab', tab)
  return `/workspace/assessments/${assessmentId}?${params.toString()}`
}

/**
 * Back from an individual student response should land on Student Records.
 * Only `tab` is set: the assessment list does not read student-page filters
 * from the query, so copying them would look preserved and then be ignored.
 */
export function studentResponseBackHref(assessmentId: string): string {
  return assessmentDetailHref(assessmentId, 'students')
}
