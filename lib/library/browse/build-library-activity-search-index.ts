import { openSciEdGrades } from '@/lib/library-service'
import { loadUnitBrowseData } from './load-unit-browse'
import { unitBrowseFocusPath } from './browse-focus'
import type { LibraryActivitySearchResult } from './library-activity-search-result'

let cachedIndex: LibraryActivitySearchResult[] | null = null

/**
 * Build (once per process) a lean search index from ingested unit browse models.
 * Pass the result into client components as props — never import this module
 * (or load-manifest) from client code; client filtering uses filter-library-activity-search.
 */
export function buildLibraryActivitySearchIndex(): LibraryActivitySearchResult[] {
  if (cachedIndex) {
    return cachedIndex
  }

  const results: LibraryActivitySearchResult[] = []

  for (const gradeEntry of openSciEdGrades) {
    const gradeNumber = Number(gradeEntry.grade)

    for (const unit of gradeEntry.units) {
      const browse = loadUnitBrowseData(unit.id, gradeNumber)
      if (!browse) {
        continue
      }

      for (const lesson of browse.lessons) {
        for (const assessment of lesson.assessments) {
          results.push({
            grade: gradeNumber,
            unitCode: browse.unitCode,
            unitTitle: browse.title,
            lessonNumber: lesson.lessonNumber,
            title: assessment.title,
            kind: 'assessment',
            categoryLabel: assessment.categoryLabel,
            href: unitBrowseFocusPath(gradeNumber, browse.unitCode, 'assessment', assessment.slug),
          })
        }

        for (const opportunity of lesson.opportunities) {
          results.push({
            grade: gradeNumber,
            unitCode: browse.unitCode,
            unitTitle: browse.title,
            lessonNumber: lesson.lessonNumber,
            title: opportunity.title,
            kind: 'opportunity',
            categoryLabel: opportunity.categoryLabel,
            href: unitBrowseFocusPath(gradeNumber, browse.unitCode, 'opportunity', opportunity.slug),
          })
        }
      }
    }
  }

  cachedIndex = results
  return results
}
