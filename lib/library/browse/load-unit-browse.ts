import openSciEdUnitsData from '@/data/seed/openscied_units.json' with { type: 'json' }
import { loadIngestedManifest } from '@/lib/library/ingest/load-manifest'
import { unitBrowseModelFromManifest } from '@/lib/library/ingest/to-browse-model'
import { getUnitOverview } from '@/lib/unit-overviews'
import {
  getCategoryLabel,
  normalizeAssessmentCategory,
} from './categories'
import { buildItemSlug } from './slug'
import type {
  AssessmentBrowseItem,
  LessonBrowseRow,
  OpenSciEdSeedUnit,
  TeOpportunityBrowseItem,
  TimelineSegment,
  UnitAssessmentShape,
  UnitBrowseModel,
} from './types'

const seedUnits = openSciEdUnitsData as OpenSciEdSeedUnit[]

export function getSeedUnitByCode(unitCode: string, grade?: number): OpenSciEdSeedUnit | undefined {
  return seedUnits.find(
    (unit) => unit.unitCode === unitCode && (grade === undefined || unit.grade === grade),
  )
}

export function getMiddleSchoolUnitsForGrade(grade: number): OpenSciEdSeedUnit[] {
  return seedUnits.filter((unit) => unit.grade === grade).sort((a, b) => a.unitCode.localeCompare(b.unitCode))
}

function deriveLessonTopic(
  lessonNumber: number,
  overviewTitle: string | undefined,
  titles: string[],
): string {
  if (overviewTitle) {
    return overviewTitle
  }
  if (titles.length === 1) {
    return titles[0]
  }
  if (titles.length > 1) {
    return `Lesson ${lessonNumber}`
  }
  return `Lesson ${lessonNumber}`
}

function resolveLessonCount(unit: OpenSciEdSeedUnit, overview?: ReturnType<typeof getUnitOverview>): number {
  if (overview?.lessons?.length) {
    return overview.lessons.length
  }
  return unit.lessons
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

export function buildTimeline(lessons: LessonBrowseRow[]): TimelineSegment[] {
  if (lessons.length === 0) {
    return []
  }

  const totalPacing = lessons.reduce((sum, lesson) => sum + (lesson.pacingDays ?? 1), 0)

  return lessons.map((lesson) => ({
    lessonNumber: lesson.lessonNumber,
    label: String(lesson.lessonNumber).padStart(2, '0'),
    widthFraction: (lesson.pacingDays ?? 1) / totalPacing,
    markers: [
      ...lesson.opportunities.map((opportunity) => ({
        lessonNumber: lesson.lessonNumber,
        category: opportunity.category,
        kind: 'opportunity' as const,
      })),
      ...lesson.assessments.map((assessment) => ({
        lessonNumber: lesson.lessonNumber,
        category: assessment.category,
        kind: 'assessment' as const,
      })),
    ],
  }))
}

export function loadUnitBrowseData(unitCode: string, grade: number): UnitBrowseModel | null {
  const unit = getSeedUnitByCode(unitCode, grade)
  if (!unit) {
    return null
  }

  const manifest = loadIngestedManifest(unitCode)
  if (manifest) {
    const overview = getUnitOverview(unitCode)
    const model = unitBrowseModelFromManifest(manifest, {
      unitCode: unit.unitCode,
      title: unit.title,
      subject: unit.subject,
      grade: unit.grade,
      drivingQuestion: unit.drivingQuestion,
      description: unit.description,
      duration: unit.duration,
      externalLink: unit.link,
    })

    const overviewLessonsByNumber = new Map(
      (overview?.lessons ?? []).map((lesson) => [lesson.lesson, lesson]),
    )
    const lessons = model.lessons.map((lesson) => {
      const overviewLesson = overviewLessonsByNumber.get(lesson.lessonNumber)
      return {
        ...lesson,
        topic: overviewLesson?.title ?? lesson.topic,
        drivingQuestion: overviewLesson?.drivingQuestion ?? lesson.drivingQuestion,
        pacingDays: lesson.pacingDays ?? overviewLesson?.pacingDays,
      }
    })

    return {
      ...model,
      lessons,
      timeline: buildTimeline(lessons),
    }
  }

  const overview = getUnitOverview(unitCode)
  const lessonCount = resolveLessonCount(unit, overview)
  const lessonNumbers = new Set<number>()

  for (let lesson = 1; lesson <= lessonCount; lesson += 1) {
    lessonNumbers.add(lesson)
  }

  const assessments: AssessmentBrowseItem[] = unit.assessmentTemplates.map((template) => {
    const category = normalizeAssessmentCategory(template.type)
    if (template.lesson) {
      lessonNumbers.add(template.lesson)
    }

    return {
      id: template.id,
      slug: buildItemSlug(template.title, template.id),
      title: template.title,
      category,
      categoryLabel: getCategoryLabel(category),
      standards: template.standards ?? unit.standards,
      lessonNumber: template.lesson,
      description: template.description,
      externalLink: unit.link,
    }
  })

  const opportunities: TeOpportunityBrowseItem[] = (overview?.opportunities ?? []).map(
    (opportunity, index) => {
      const category = normalizeAssessmentCategory(opportunity.type)
      lessonNumbers.add(opportunity.lesson)

      const id = `opp-${unitCode}-${opportunity.lesson}-${index}`

      return {
        id,
        slug: buildItemSlug(opportunity.title, id),
        title: opportunity.title,
        category,
        categoryLabel: getCategoryLabel(category),
        lessonNumber: opportunity.lesson,
        standards: unit.standards,
        purpose: opportunity.purpose,
        keyFocus: opportunity.keyFocus,
        buildingTowards: opportunity.buildingTowards ?? opportunity.purpose,
        whatToLookFor: opportunity.whatToLookFor ?? opportunity.keyFocus,
        whatToDo: opportunity.whatToDo ?? opportunity.keyFocus,
      }
    },
  )

  const sortedLessonNumbers = [...lessonNumbers].sort((a, b) => a - b)
  const overviewLessonsByNumber = new Map(
    (overview?.lessons ?? []).map((lesson) => [lesson.lesson, lesson]),
  )

  const lessons: LessonBrowseRow[] = sortedLessonNumbers.map((lessonNumber) => {
    const overviewLesson = overviewLessonsByNumber.get(lessonNumber)
    const lessonAssessments = assessments.filter(
      (assessment) => assessment.lessonNumber === lessonNumber,
    )
    const lessonOpportunities = opportunities.filter(
      (opportunity) => opportunity.lessonNumber === lessonNumber,
    )

    const titleCandidates = [
      ...lessonAssessments.map((item) => item.title),
      ...lessonOpportunities.map((item) => item.title),
    ]

    return {
      lessonNumber,
      topic: deriveLessonTopic(lessonNumber, overviewLesson?.title, titleCandidates),
      drivingQuestion:
        overviewLesson?.drivingQuestion ?? overview?.drivingQuestion ?? unit.drivingQuestion,
      pacingDays: overviewLesson?.pacingDays,
      assessments: lessonAssessments,
      opportunities: lessonOpportunities,
    }
  })

  const assessmentShape = buildAssessmentShape(lessons)

  return {
    unitCode: unit.unitCode,
    title: unit.title,
    subject: unit.subject,
    description: unit.description,
    drivingQuestion: overview?.drivingQuestion ?? unit.drivingQuestion,
    grade: unit.grade,
    lessonCount: sortedLessonNumbers.length,
    duration: unit.duration,
    externalLink: unit.link,
    assessmentShape,
    lessons,
    timeline: buildTimeline(lessons),
  }
}

export function findAssessmentInUnit(
  unit: UnitBrowseModel,
  slug: string,
): AssessmentBrowseItem | undefined {
  for (const lesson of unit.lessons) {
    const match = lesson.assessments.find((assessment) => assessment.slug === slug)
    if (match) {
      return match
    }
  }
  return undefined
}

export function findOpportunityInUnit(
  unit: UnitBrowseModel,
  slug: string,
): TeOpportunityBrowseItem | undefined {
  for (const lesson of unit.lessons) {
    const match = lesson.opportunities.find((opportunity) => opportunity.slug === slug)
    if (match) {
      return match
    }
  }
  return undefined
}
