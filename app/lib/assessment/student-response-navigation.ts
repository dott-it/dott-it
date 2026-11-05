import type { AssessmentRecord } from '@/types'

export type StudentDetailUrlFilters = {
  statusFilter?: string
  classFilter?: string
  searchTerm?: string
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc'
}

/**
 * Build the student response detail URL.
 * Prefer the record's own assessmentId so a stale parent prop cannot send
 * the teacher to a different assessment.
 */
export function buildStudentDetailUrl(
  student: Pick<AssessmentRecord, 'id' | 'assessmentId'>,
  routeAssessmentId: string | undefined,
  filters: StudentDetailUrlFilters = {},
): string | null {
  const assessmentId = student.assessmentId || routeAssessmentId
  if (!assessmentId) {
    return null
  }

  const searchParams = new URLSearchParams()
  const {
    statusFilter = 'all',
    classFilter = 'all',
    searchTerm = '',
    sortColumn = null,
    sortDirection = 'asc',
  } = filters

  if (statusFilter !== 'all') searchParams.set('status', statusFilter)
  if (classFilter !== 'all') searchParams.set('class', classFilter)
  if (searchTerm.trim() !== '') searchParams.set('search', searchTerm.trim())
  if (sortColumn) {
    searchParams.set('sortColumn', sortColumn)
    searchParams.set('sortDirection', sortDirection)
  }

  const query = searchParams.toString()
  return query
    ? `/workspace/assessments/${assessmentId}/${student.id}?${query}`
    : `/workspace/assessments/${assessmentId}/${student.id}`
}

/** True when the URL assessment segment does not own this record. */
export function isAssessmentRecordMismatch(
  routeAssessmentId: string,
  recordAssessmentId: string | undefined | null,
): boolean {
  return Boolean(recordAssessmentId && recordAssessmentId !== routeAssessmentId)
}

/**
 * URL to the assessment that owns this record, preserving list filters.
 * Returns null unless the loaded record is the one in the route and it
 * belongs to a different assessment (stale cache must not redirect).
 */
export function resolveMismatchedRecordRedirect(args: {
  routeAssessmentId: string
  routeStudentEntryId: string
  record: Pick<AssessmentRecord, 'id' | 'assessmentId'> | null | undefined
  filters?: StudentDetailUrlFilters
}): string | null {
  const { routeAssessmentId, routeStudentEntryId, record, filters } = args
  if (!record || record.id !== routeStudentEntryId) return null
  if (!isAssessmentRecordMismatch(routeAssessmentId, record.assessmentId)) return null
  return buildStudentDetailUrl(record, routeAssessmentId, filters)
}

/**
 * A failed assessment fetch is not a final error while we are about to
 * replace the URL with the assessment that owns the record.
 */
export function isStudentPageLoadError(args: {
  assessmentFailed: boolean
  recordFailed: boolean
  redirectingToOwningAssessment: boolean
}): boolean {
  if (args.recordFailed) return true
  if (args.redirectingToOwningAssessment) return false
  return args.assessmentFailed
}

export type StudentNavState = {
  isFirst: boolean
  isLast: boolean
  currentPosition: number
  totalCount: number
}

/**
 * Next/prev state for the filtered student list.
 * When the current student is outside the filter, disable both directions
 * (do not treat index -1 as "before first" and jump to [0]).
 */
export function getStudentNavigationState(
  recordIds: string[],
  currentStudentEntryId: string,
): StudentNavState {
  const totalCount = recordIds.length
  if (totalCount === 0) {
    return { isFirst: true, isLast: true, currentPosition: 0, totalCount: 0 }
  }

  const currentIndex = recordIds.indexOf(currentStudentEntryId)
  if (currentIndex === -1) {
    return { isFirst: true, isLast: true, currentPosition: 0, totalCount }
  }

  return {
    isFirst: currentIndex === 0,
    isLast: currentIndex === totalCount - 1,
    currentPosition: currentIndex + 1,
    totalCount,
  }
}

export function getAdjacentStudentRecordId(
  recordIds: string[],
  currentStudentEntryId: string,
  direction: 'previous' | 'next',
): string | null {
  const currentIndex = recordIds.indexOf(currentStudentEntryId)
  if (currentIndex === -1) return null

  const nextIndex = direction === 'previous' ? currentIndex - 1 : currentIndex + 1
  if (nextIndex < 0 || nextIndex >= recordIds.length) return null
  return recordIds[nextIndex] ?? null
}
