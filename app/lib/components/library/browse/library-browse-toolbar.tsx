'use client'

import { LevelGradeUnitNav } from './level-grade-unit-nav'
import { UnitSearch } from './unit-search'

interface LibraryBrowseToolbarProps {
  grade?: number
  unitCode?: string
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function LibraryBrowseToolbar({
  grade,
  unitCode,
  searchQuery,
  onSearchChange,
}: LibraryBrowseToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LevelGradeUnitNav grade={grade} unitCode={unitCode} />
      <UnitSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search all assessments and opportunities by name..."
        aria-label="Search all assessments and opportunities by name"
        className="relative min-w-[220px] flex-1 sm:max-w-md"
      />
    </div>
  )
}
