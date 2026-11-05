'use client'

import { useMemo, useState } from 'react'
import type { BrowseViewMode, UnitBrowseModel } from '@/lib/library/browse'
import { findBrowseFocusInUnit, parseBrowseFocusParam } from '@/lib/library/browse'
import type { UnitExportSummary } from '@/lib/library/export/types'
import { BrowseViewToggle } from './browse-view-toggle'
import { TerminologyHelp } from './terminology-help'
import { UnitBrowseTable } from './unit-browse-table'
import { UnitSearch } from './unit-search'
import { UnitSummary } from './unit-summary'
import { UnitTimeline } from './unit-timeline'

interface UnitBrowseViewProps {
  unit: UnitBrowseModel
  focus?: string | null
  exportSummary: UnitExportSummary
}

export function UnitBrowseView({ unit, focus, exportSummary }: UnitBrowseViewProps) {
  const focusTarget = useMemo(
    () => findBrowseFocusInUnit(unit, parseBrowseFocusParam(focus)),
    [unit, focus],
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<BrowseViewMode>('all')

  return (
    <div className="space-y-6">
      <UnitSummary unit={unit} exportSummary={exportSummary} />
      <UnitTimeline timeline={unit.timeline} assessmentShape={unit.assessmentShape} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <UnitSearch value={searchQuery} onChange={setSearchQuery} />
        <div className="flex flex-wrap items-center gap-3">
          <BrowseViewToggle
            value={viewMode}
            onChange={setViewMode}
            assessmentCount={unit.assessmentShape.assessmentCount}
            opportunityCount={unit.assessmentShape.opportunityCount}
          />
          <TerminologyHelp assessmentShape={unit.assessmentShape} />
        </div>
      </div>

      <UnitBrowseTable
        unit={unit}
        searchQuery={searchQuery}
        viewMode={viewMode}
        focusTarget={focusTarget}
      />
    </div>
  )
}
