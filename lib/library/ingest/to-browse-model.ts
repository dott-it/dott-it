import { getCategoryLabel, normalizeAssessmentCategory } from '../browse/categories'
import { buildItemSlug } from '../browse/slug'
import type {
  AssessmentBrowseItem,
  LessonBrowseRow,
  TeOpportunityBrowseItem,
  UnitAssessmentShape,
  UnitBrowseModel,
} from '../browse/types'
import type { AssessmentSource, AssessmentTypeSlug, IngestedAssessment, IngestedUnitManifest } from './types'

function resolveSource(row: IngestedAssessment): AssessmentSource {
  if (row.source) {
    return row.source
  }
  return row.id.includes('-ao-') ? 'te-opportunity' : 'formal-assessment'
}

function categoryFromIngested(row: IngestedAssessment, source: AssessmentSource): ReturnType<typeof normalizeAssessmentCategory> {
  if (source === 'te-opportunity') {
    if (row.assessmentType === 'pre-assessment') return 'Pre'
    if (row.assessmentType === 'summative' || row.isSummative) return 'Summative'
    if (row.assessmentType === 'peer-feedback') return 'Peer'
    return 'Formative'
  }

  if (row.assessmentType) {
    return normalizeAssessmentCategory(row.assessmentType)
  }
  if (row.isSummative) {
    return 'Summative'
  }
  return 'Formative'
}

function toAssessmentBrowseItem(row: IngestedAssessment): AssessmentBrowseItem {
  const source = resolveSource(row)
  const category = categoryFromIngested(row, source)
  const title = row.shortTitle ?? row.title

  const linkedTeOpportunityId = row.linkedTeOpportunityId?.trim() || undefined

  return {
    id: row.id,
    slug: buildItemSlug(title, row.id),
    title,
    category,
    categoryLabel: getCategoryLabel(category),
    standards: row.standards,
    lessonNumber: row.lessonNum,
    description: row.description,
    linkedTeOpportunityId,
  }
}

function toOpportunityBrowseItem(row: IngestedAssessment): TeOpportunityBrowseItem {
  const category = categoryFromIngested(row, 'te-opportunity')
  const title = row.shortTitle ?? row.title
  const buildingTowards = row.buildingTowards?.trim() || undefined
  const whatToLookFor = row.lookListenFor?.trim() || undefined
  const whatToDo = row.whatToDo?.trim() || undefined

  return {
    id: row.id,
    slug: buildItemSlug(title, row.id),
    title,
    category,
    categoryLabel: getCategoryLabel(category),
    lessonNumber: row.lessonNum,
    peCode: row.peCode?.trim() || undefined,
    standards: row.standards,
    purpose: buildingTowards ?? row.description,
    keyFocus: whatToLookFor ?? whatToDo ?? row.description,
    buildingTowards,
    whatToLookFor,
    whatToDo,
  }
}

function buildAssessmentShape(lessons: LessonBrowseRow[]): UnitAssessmentShape {
  const opportunityCount = lessons.reduce((sum, lesson) => sum + lesson.opportunities.length, 0)
  const assessmentCount = lessons.reduce((sum, lesson) => sum + lesson.assessments.length, 0)
  const totalPacingDays = lessons.reduce((sum, lesson) => sum + (lesson.pacingDays ?? 1), 0)

  return {
    lessonCount: lessons.length,
    opportunityCount,
    assessmentCount,
    totalPacingDays,
  }
}

/** True when the label is only a placeholder like "Lesson 3". */
export function isGenericLessonLabel(label: string | undefined, lessonNumber: number): boolean {
  if (!label?.trim()) {
    return true
  }
  return new RegExp(`^Lesson\\s+0*${lessonNumber}$`, 'i').test(label.trim())
}

/**
 * Prefer a curated shortTitle, but fall back to the driving-question title when
 * shortTitle was left as the placeholder "Lesson N" (batch ingest bug on MS units).
 */
export function resolveLessonTopic(
  lessonNumber: number,
  shortTitle: string | undefined,
  title: string | undefined,
): string {
  if (shortTitle?.trim() && !isGenericLessonLabel(shortTitle, lessonNumber)) {
    return shortTitle.trim()
  }
  if (title?.trim() && !isGenericLessonLabel(title, lessonNumber)) {
    return title.trim().replaceAll(/\?+$/g, '').trim()
  }
  return `Lesson ${lessonNumber}`
}

export function unitBrowseModelFromManifest(
  manifest: IngestedUnitManifest,
  seed: {
    unitCode: string
    title: string
    subject: string
    grade: number
    drivingQuestion: string
    description?: string
    duration?: string
    externalLink?: string
  },
): UnitBrowseModel {
  const assessments: AssessmentBrowseItem[] = []
  const opportunities: TeOpportunityBrowseItem[] = []
  const lessonNumbers = new Set<number>()
  const seenIds = new Set<string>()

  for (const row of manifest.assessments) {
    if (seenIds.has(row.id)) {
      continue
    }
    seenIds.add(row.id)
    lessonNumbers.add(row.lessonNum)
    const source = resolveSource(row)
    if (source === 'te-opportunity') {
      opportunities.push(toOpportunityBrowseItem(row))
    } else {
      assessments.push(toAssessmentBrowseItem(row))
    }
  }

  for (const lesson of manifest.lessons ?? []) {
    lessonNumbers.add(lesson.lessonNum)
  }

  if (lessonNumbers.size === 0 && manifest.lessonCount > 0) {
    for (let lesson = 1; lesson <= manifest.lessonCount; lesson += 1) {
      lessonNumbers.add(lesson)
    }
  }

  const lessonsByNumber = new Map((manifest.lessons ?? []).map((lesson) => [lesson.lessonNum, lesson]))
  const sortedLessonNumbers = [...lessonNumbers].sort((a, b) => a - b)

  const lessons: LessonBrowseRow[] = sortedLessonNumbers.map((lessonNumber) => {
    const manifestLesson = lessonsByNumber.get(lessonNumber)
    const lessonAssessments = assessments.filter((item) => item.lessonNumber === lessonNumber)
    const lessonOpportunities = opportunities.filter((item) => item.lessonNumber === lessonNumber)

    return {
      lessonNumber,
      topic: resolveLessonTopic(
        lessonNumber,
        manifestLesson?.shortTitle,
        manifestLesson?.title,
      ),
      drivingQuestion: seed.drivingQuestion,
      pacingDays: manifestLesson?.expectedDays,
      assessments: lessonAssessments,
      opportunities: lessonOpportunities,
    }
  })

  const assessmentShape = buildAssessmentShape(lessons)

  return {
    unitCode: seed.unitCode,
    title: seed.title,
    subject: seed.subject,
    description: seed.description ?? manifest.description,
    drivingQuestion: seed.drivingQuestion,
    grade: seed.grade,
    lessonCount: sortedLessonNumbers.length,
    duration: seed.duration,
    externalLink: seed.externalLink,
    assessmentShape,
    lessons,
    timeline: [],
  }
}

export function assessmentTypeSlugFromCategory(category: string): AssessmentTypeSlug | undefined {
  const normalized = category.trim().toLowerCase()
  if (normalized === 'pre-assessment' || normalized === 'pre') return 'pre-assessment'
  if (normalized === 'summative') return 'summative'
  if (normalized === 'peer-feedback' || normalized === 'peer') return 'peer-feedback'
  if (normalized === 'lesson-reflection') return 'lesson-reflection'
  if (normalized === 'formative') return 'formative'
  return undefined
}
