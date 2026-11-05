import type { LibraryActivitySearchResult } from './library-activity-search-result'

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase())
}

/**
 * Client-safe filter over a precomputed search index.
 * Does not import ingest manifests — keep index building on the server.
 */
export function filterLibraryActivitySearch(
  index: LibraryActivitySearchResult[],
  query: string,
  grade?: number,
): LibraryActivitySearchResult[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return []
  }

  const results = index.filter((entry) => {
    if (grade !== undefined && entry.grade !== grade) {
      return false
    }
    const haystack = [
      entry.title,
      entry.categoryLabel,
      entry.kind === 'assessment' ? 'Assessment' : '',
      entry.unitTitle,
      entry.unitCode,
    ].join(' ')
    return matchesQuery(haystack, normalized)
  })

  return results.sort((a, b) => {
    const unitCompare = a.unitCode.localeCompare(b.unitCode)
    if (unitCompare !== 0) {
      return unitCompare
    }
    if (a.lessonNumber !== b.lessonNumber) {
      return a.lessonNumber - b.lessonNumber
    }
    return a.title.localeCompare(b.title)
  })
}
