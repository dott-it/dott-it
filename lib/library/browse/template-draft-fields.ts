import type {
  AssessmentCategory,
  LessonBrowseRow,
  TeOpportunityBrowseItem,
  UnitBrowseModel,
} from './types'
import { hasTeFacilitationContent, teFacilitationFromOpportunity } from './te-facilitation'

export interface AssessmentTemplateDraftFields {
  title: string
  description: string
  subject: string
  type: string
  curriculumTeachersEdition: string
  curriculumAnswerKey: string
  /** Set when an answer-key file exists but extraction failed. Empty text is not a successful key. */
  answerKeyWarning: string | null
}

const LIBRARY_SUBJECT_ALIASES: Record<string, string> = {
  'life science': 'Life Science',
  life: 'Life Science',
  biology: 'Biology',
  'physical science': 'Physical Science',
  physics: 'Physics',
  chemistry: 'Chemistry',
  'earth & space science': 'Earth & Space Science',
  'earth and space science': 'Earth & Space Science',
  'earth science': 'Earth & Space Science',
}

const LIBRARY_CATEGORY_TO_TEMPLATE_TYPE: Record<AssessmentCategory, string> = {
  Pre: 'Other',
  Formative: 'Formative',
  Summative: 'Summative',
  Peer: 'Peer-Assessment',
}

const ENTRANCE_EXIT_TICKET_TYPE = 'Entrance/Exit Ticket'
const ENTRANCE_EXIT_TICKET_PATTERN = /\b(?:entrance\s*\/\s*exit|entrance|exit)\s+tickets?\b/i

/** True when a title or short description names an entrance or exit ticket. */
export function textMarksEntranceExitTicket(value: string | null | undefined): boolean {
  return ENTRANCE_EXIT_TICKET_PATTERN.test(value ?? '')
}

const KNOWN_TEMPLATE_SUBJECTS = new Set([
  'Life Science',
  'Physical Science',
  'Earth & Space Science',
  'Biology',
  'Chemistry',
  'Physics',
])

/** Map library / OpenSciEd subject labels onto template subject options. */
export function mapLibrarySubjectToTemplate(subject: string | null | undefined): string {
  const trimmed = (subject ?? '').trim()
  if (!trimmed) {
    return ''
  }
  if (KNOWN_TEMPLATE_SUBJECTS.has(trimmed)) {
    return trimmed
  }
  return LIBRARY_SUBJECT_ALIASES[trimmed.toLowerCase()] ?? trimmed
}

function formatOpportunityTeSection(opportunity: TeOpportunityBrowseItem): string {
  const facilitation = teFacilitationFromOpportunity(opportunity)
  if (!hasTeFacilitationContent(facilitation)) {
    return ''
  }

  const lines = [`### ${opportunity.title}`]
  if (facilitation.buildingTowards?.trim()) {
    lines.push('', '**Building towards**', facilitation.buildingTowards.trim())
  }
  if (facilitation.whatToLookFor?.trim()) {
    lines.push('', '**What to look / listen for**', facilitation.whatToLookFor.trim())
  }
  if (facilitation.whatToDo?.trim()) {
    lines.push('', '**What to do**', facilitation.whatToDo.trim())
  }
  return lines.join('\n')
}

export function formatLessonTeachersEdition(lesson: LessonBrowseRow): string {
  return lesson.opportunities
    .map((opportunity) => formatOpportunityTeSection(opportunity))
    .filter(Boolean)
    .join('\n\n')
}

export function findLessonInUnit(
  unit: UnitBrowseModel,
  lessonNumber: number,
): LessonBrowseRow | undefined {
  return unit.lessons.find((lesson) => lesson.lessonNumber === lessonNumber)
}

function templateTypeForLessonItem(item: {
  title?: string
  description?: string
  purpose?: string
  category: AssessmentCategory
}): string {
  if (
    textMarksEntranceExitTicket(item.title) ||
    textMarksEntranceExitTicket(item.description) ||
    textMarksEntranceExitTicket(item.purpose)
  ) {
    return ENTRANCE_EXIT_TICKET_TYPE
  }
  return LIBRARY_CATEGORY_TO_TEMPLATE_TYPE[item.category] ?? ''
}

/**
 * Infer a template type from the lesson's assessments (preferred) or opportunities.
 * Uses the most frequent type; ties keep the first seen type.
 * Entrance/exit ticket titles map to Entrance/Exit Ticket instead of Formative or Other.
 */
export function inferTemplateTypeFromLesson(lesson: LessonBrowseRow): string {
  const items =
    lesson.assessments.length > 0
      ? lesson.assessments.map((assessment) => templateTypeForLessonItem(assessment))
      : lesson.opportunities.map((opportunity) => templateTypeForLessonItem(opportunity))

  if (items.length === 0) {
    return ''
  }

  const counts = new Map<string, number>()
  for (const itemType of items) {
    if (!itemType) continue
    counts.set(itemType, (counts.get(itemType) ?? 0) + 1)
  }

  let bestType = items.find(Boolean) ?? ''
  let bestCount = 0
  for (const [itemType, count] of counts) {
    if (count > bestCount) {
      bestType = itemType
      bestCount = count
    }
  }

  return bestType
}

/**
 * Sync draft fields from browse data (title, description, subject, type, TE).
 * Answer key stays empty here — use the server draft builder to extract file text.
 */
export function buildTemplateDraftFieldsFromLesson(
  unit: UnitBrowseModel,
  lessonNumber: number,
): AssessmentTemplateDraftFields | null {
  const lesson = findLessonInUnit(unit, lessonNumber)
  if (!lesson) {
    return null
  }

  return {
    title: lesson.topic.trim() || `Lesson ${lesson.lessonNumber}`,
    description: (lesson.drivingQuestion ?? unit.description ?? '').trim(),
    subject: mapLibrarySubjectToTemplate(unit.subject),
    type: inferTemplateTypeFromLesson(lesson),
    curriculumTeachersEdition: formatLessonTeachersEdition(lesson),
    curriculumAnswerKey: '',
    answerKeyWarning: null,
  }
}
