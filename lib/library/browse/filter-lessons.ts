import type { BrowseViewMode, LessonBrowseRow } from './types'

function lessonMatchesSearch(lesson: LessonBrowseRow, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    lesson.topic,
    String(lesson.lessonNumber),
    ...lesson.assessments.flatMap((item) => [
      item.title,
      item.category,
      item.categoryLabel,
      ...item.standards,
    ]),
    ...lesson.opportunities.flatMap((item) => [
      item.title,
      item.category,
      item.categoryLabel,
      item.purpose,
      item.keyFocus,
    ]),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

export function filterLessonsForBrowseView(
  lessons: LessonBrowseRow[],
  viewMode: BrowseViewMode,
  searchQuery: string,
): LessonBrowseRow[] {
  const scopedLessons =
    viewMode === 'assessments-only'
      ? lessons.filter((lesson) => lesson.assessments.length > 0)
      : lessons

  return scopedLessons.filter((lesson) => lessonMatchesSearch(lesson, searchQuery))
}
