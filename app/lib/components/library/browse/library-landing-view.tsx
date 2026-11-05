'use client'

import { useMemo, useState } from 'react'
import { filterLibraryActivitySearch } from '@/lib/library/browse/filter-library-activity-search'
import type { LibraryActivitySearchResult } from '@/lib/library/browse/library-activity-search-result'
import { MIDDLE_SCHOOL_GRADES } from '@/lib/library/browse/paths'
import { LibraryActivitySearchResults } from './library-activity-search-results'
import { LibraryBrowseToolbar } from './library-browse-toolbar'

interface LibraryLandingViewProps {
  grade?: number
  searchIndex: LibraryActivitySearchResult[]
}

function isValidGrade(grade: number | undefined): grade is number {
  return grade !== undefined && MIDDLE_SCHOOL_GRADES.includes(grade as (typeof MIDDLE_SCHOOL_GRADES)[number])
}

export function LibraryLandingView({ grade, searchIndex }: LibraryLandingViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const selectedGrade = isValidGrade(grade) ? grade : undefined
  const searchResults = useMemo(
    () => filterLibraryActivitySearch(searchIndex, searchQuery),
    [searchIndex, searchQuery],
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">OpenSciEd Assessment Library</h1>
        <p className="mt-2 text-muted-foreground">
          Use the filters below to choose a grade and unit, then browse assessments and
          assessment opportunities in storyline order.
        </p>
      </div>

      <LibraryBrowseToolbar
        grade={selectedGrade}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {selectedGrade && !searchQuery ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Grade {selectedGrade} selected — choose a unit from the dropdown to open the unit
          table.
        </div>
      ) : null}

      {searchQuery ? (
        <LibraryActivitySearchResults results={searchResults} query={searchQuery} />
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {selectedGrade ? 'Select a unit' : 'Select a grade and unit'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {selectedGrade
              ? 'Pick a unit from the filter above, or search by activity name to jump directly to an assessment or opportunity.'
              : 'Choose a grade from the filter above, then select a unit to view the unit timeline and assessment table.'}
          </p>
        </div>
      )}
    </div>
  )
}
