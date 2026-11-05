import { buildLibraryActivitySearchIndex } from './build-library-activity-search-index'
import { filterLibraryActivitySearch } from './filter-library-activity-search'
import type { LibraryActivitySearchResult } from './library-activity-search-result'

export type { LibraryActivitySearchResult } from './library-activity-search-result'

/**
 * Server-side library activity search.
 * Builds the index from ingest (server-only) then filters in memory.
 */
export function searchLibraryActivities(
  query: string,
  grade?: number,
): LibraryActivitySearchResult[] {
  return filterLibraryActivitySearch(buildLibraryActivitySearchIndex(), query, grade)
}
