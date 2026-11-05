'use client'

import { useMemo, useState } from 'react'
import { filterLibraryActivitySearch } from '@/lib/library/browse/filter-library-activity-search'
import type { LibraryActivitySearchResult } from '@/lib/library/browse/library-activity-search-result'
import type { UnitBrowseModel } from '@/lib/library/browse'
import type { UnitExportSummary } from '@/lib/library/export/types'
import { LibraryActivitySearchResults } from './library-activity-search-results'
import { LibraryBrowseToolbar } from './library-browse-toolbar'
import { UnitBrowseView } from './unit-browse-view'

interface UnitBrowseShellProps {
  unit: UnitBrowseModel
  grade: number
  unitCode: string
  focus?: string | null
  exportSummary: UnitExportSummary
  searchIndex: LibraryActivitySearchResult[]
}

export function UnitBrowseShell({
  unit,
  grade,
  unitCode,
  focus,
  exportSummary,
  searchIndex,
}: UnitBrowseShellProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const searchResults = useMemo(
    () => filterLibraryActivitySearch(searchIndex, searchQuery),
    [searchIndex, searchQuery],
  )

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LibraryBrowseToolbar
          grade={grade}
          unitCode={unitCode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <LibraryActivitySearchResults results={searchResults} query={searchQuery} />
      </div>
      <UnitBrowseView unit={unit} focus={focus} exportSummary={exportSummary} />
    </div>
  )
}
