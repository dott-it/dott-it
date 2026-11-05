/**
 * Pure view-model for the teacher planner home (week/month calendar + soft classes).
 * No Prisma / Class entity — soft turmas from classSection + className.
 */

export type PlannerPeriod = 'week' | 'month'

export type PlannerAssessmentInput = {
  id: string
  title: string
  dueAt?: string | Date | null
  assignedAt?: string | Date | null
  dueDate?: string | Date | null
  startDate?: string | Date | null
  className?: string | null
  classSections?: string[] | null
  unitCode?: string | null
  grade?: number | null
  lessonNumber?: number | null
  pendingRecords?: number | null
  submissionStats?: { readyForReview?: number } | null
  submissionStatus?: { readyForReview?: number } | null
}

export type PlannerEvent = {
  id: string
  title: string
  start: Date
  classKeys: string[]
  unitCode: string | null
  grade: number | null
  lessonNumber: number | null
  pendingCount: number
  href: string
}

export type SoftClass = {
  key: string
  label: string
}

export type FeedbackQueueItem = {
  id: string
  title: string
  pendingCount: number
  dueAt: Date | null
  classKeys: string[]
  unitCode: string | null
  href: string
}

export type PlannerHomeModel = {
  softClasses: SoftClass[]
  events: PlannerEvent[]
  eventsInRange: PlannerEvent[]
  feedbackQueue: FeedbackQueueItem[]
  activeUnitCode: string | null
  activeGrade: number | null
  rangeStart: Date
  rangeEnd: Date
}

const EMPTY_CLASS_LABEL = '—'

export function parsePlannerDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

/** Prefer due date, then assigned/start. */
export function resolveAssessmentEventDate(assessment: PlannerAssessmentInput): Date | null {
  return (
    parsePlannerDate(assessment.dueAt) ??
    parsePlannerDate(assessment.dueDate) ??
    parsePlannerDate(assessment.assignedAt) ??
    parsePlannerDate(assessment.startDate)
  )
}

export function pendingFeedbackCount(assessment: PlannerAssessmentInput): number {
  const pending = assessment.pendingRecords ?? 0
  const ready =
    assessment.submissionStats?.readyForReview ??
    assessment.submissionStatus?.readyForReview ??
    0
  return Math.max(pending, ready)
}

export function softClassKeysForAssessment(assessment: PlannerAssessmentInput): string[] {
  const keys = new Set<string>()
  for (const section of assessment.classSections ?? []) {
    const trimmed = section.trim()
    if (trimmed) keys.add(trimmed)
  }
  const className = (assessment.className ?? '').trim()
  if (className && className !== EMPTY_CLASS_LABEL) {
    keys.add(className)
  }
  return [...keys].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/** Monday 00:00:00.000 local → Sunday end of day for the week containing `anchor`. */
export function getWeekRange(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay() // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + mondayOffset)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function getMonthRange(anchor: Date): { start: Date; end: Date } {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function getPeriodRange(period: PlannerPeriod, anchor: Date): { start: Date; end: Date } {
  return period === 'week' ? getWeekRange(anchor) : getMonthRange(anchor)
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function eventMatchesClass(event: PlannerEvent, classKey: string | null): boolean {
  if (!classKey || classKey === 'all') return true
  return event.classKeys.includes(classKey)
}

export function mapAssessmentToPlannerEvent(assessment: PlannerAssessmentInput): PlannerEvent | null {
  const start = resolveAssessmentEventDate(assessment)
  if (!start) return null

  return {
    id: assessment.id,
    title: assessment.title,
    start,
    classKeys: softClassKeysForAssessment(assessment),
    unitCode: assessment.unitCode?.trim() || null,
    grade: assessment.grade ?? null,
    lessonNumber: assessment.lessonNumber ?? null,
    pendingCount: pendingFeedbackCount(assessment),
    href: `/workspace/assessments/${assessment.id}`,
  }
}

export function buildPlannerHome(options: {
  assessments: PlannerAssessmentInput[]
  period: PlannerPeriod
  anchor?: Date
  classKey?: string | null
}): PlannerHomeModel {
  const anchor = options.anchor ?? new Date()
  const { start: rangeStart, end: rangeEnd } = getPeriodRange(options.period, anchor)
  const classKey = options.classKey ?? 'all'

  const events = options.assessments
    .map((assessment) => mapAssessmentToPlannerEvent(assessment))
    .filter((event): event is PlannerEvent => event != null)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const softClassMap = new Map<string, SoftClass>()
  for (const event of events) {
    for (const key of event.classKeys) {
      if (!softClassMap.has(key)) {
        softClassMap.set(key, { key, label: key })
      }
    }
  }
  const softClasses = [...softClassMap.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }),
  )

  const eventsInRange = events.filter(
    (event) => isDateInRange(event.start, rangeStart, rangeEnd) && eventMatchesClass(event, classKey),
  )

  const feedbackQueue = options.assessments
    .map((assessment) => {
      const pendingCount = pendingFeedbackCount(assessment)
      if (pendingCount <= 0) return null
      const classKeys = softClassKeysForAssessment(assessment)
      if (classKey && classKey !== 'all' && classKeys.length > 0 && !classKeys.includes(classKey)) {
        return null
      }
      return {
        id: assessment.id,
        title: assessment.title,
        pendingCount,
        dueAt: resolveAssessmentEventDate(assessment),
        classKeys,
        unitCode: assessment.unitCode?.trim() || null,
        href: `/workspace/assessments/${assessment.id}`,
      } satisfies FeedbackQueueItem
    })
    .filter((item): item is FeedbackQueueItem => item != null)
    .sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount
      const aDue = a.dueAt?.getTime() ?? Number.POSITIVE_INFINITY
      const bDue = b.dueAt?.getTime() ?? Number.POSITIVE_INFINITY
      return aDue - bDue
    })

  const unitSource = eventsInRange.find((e) => e.unitCode) ?? events.find((e) => e.unitCode)
  const activeUnitCode = unitSource?.unitCode ?? null
  const activeGrade = unitSource?.grade ?? null

  return {
    softClasses,
    events,
    eventsInRange,
    feedbackQueue,
    activeUnitCode,
    activeGrade,
    rangeStart,
    rangeEnd,
  }
}

/** Local calendar day key YYYY-MM-DD */
export function toDayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function groupEventsByDay(events: PlannerEvent[]): Map<string, PlannerEvent[]> {
  const map = new Map<string, PlannerEvent[]>()
  for (const event of events) {
    const key = toDayKey(event.start)
    const list = map.get(key) ?? []
    list.push(event)
    map.set(key, list)
  }
  return map
}

/** Seven local dates Mon→Sun for the week containing `anchor`. */
export function listWeekDays(anchor: Date): Date[] {
  const { start } = getWeekRange(anchor)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    return day
  })
}

/** Calendar month cells including leading/trailing days to fill Mon–Sun rows. */
export function listMonthGridDays(anchor: Date): Date[] {
  const { start: monthStart } = getMonthRange(anchor)
  const gridStart = getWeekRange(monthStart).start
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + i)
    days.push(day)
  }
  return days
}
