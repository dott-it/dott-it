'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Book, Sparkles } from 'lucide-react'
import { DataTable, type Column } from '@/app/lib/components/ui/layout'
import { EmptyStateCard } from '@/app/lib/components/ui/layout/card'
import { SearchInput } from '@/app/lib/components/ui/forms'
import type { Assessment } from '@/types'

function formatListDate(value?: string | Date | null): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export interface AssessmentListTableProps {
  assessments: Assessment[]
  emptyTitle?: string
  emptyDescription?: string
  searchEmptyDescription?: string
}

export function AssessmentListTable({
  assessments,
  emptyTitle = 'No assessments found',
  emptyDescription = 'You have no assessments assigned to your workspace.',
  searchEmptyDescription = 'No assessments match your search. Try adjusting your search criteria.',
}: AssessmentListTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [unitFilter, setUnitFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const availableUnits = useMemo(() => {
    const units = new Set<string>()
    for (const assessment of assessments) {
      const unit = assessment.unitName || assessment.unitCode
      if (unit) units.add(unit)
    }
    return [...units].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [assessments])

  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    for (const assessment of assessments) {
      if (assessment.type) types.add(assessment.type)
    }
    return [...types].sort((a, b) => a.localeCompare(b))
  }, [assessments])

  const filteredAssessments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return assessments.filter((assessment) => {
      const unit = assessment.unitName || assessment.unitCode || ''
      const matchesSearch =
        term.length === 0 ||
        assessment.title.toLowerCase().includes(term) ||
        unit.toLowerCase().includes(term) ||
        (assessment.className || '').toLowerCase().includes(term) ||
        (assessment.type || '').toLowerCase().includes(term)

      const matchesUnit = unitFilter === 'all' || unit === unitFilter
      const matchesType = typeFilter === 'all' || assessment.type === typeFilter
      return matchesSearch && matchesUnit && matchesType
    })
  }, [assessments, searchTerm, unitFilter, typeFilter])

  const columns: Column<Assessment>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Assessment',
        sortable: true,
        sortFunction: (a, b) => a.title.localeCompare(b.title),
        cell: (item) => <span className="font-medium text-foreground">{item.title}</span>,
      },
      {
        key: 'className',
        header: 'Class',
        sortable: true,
        sortFunction: (a, b) => (a.className || '').localeCompare(b.className || ''),
        cell: (item) => item.className || '—',
      },
      {
        key: 'unit',
        header: 'Unit',
        sortable: true,
        sortFunction: (a, b) =>
          (a.unitName || a.unitCode || '').localeCompare(b.unitName || b.unitCode || ''),
        cell: (item) => item.unitName || item.unitCode || '—',
      },
      {
        key: 'type',
        header: 'Type',
        sortable: true,
        sortFunction: (a, b) => (a.type || '').localeCompare(b.type || ''),
        cell: (item) => item.type || '—',
      },
      {
        key: 'date',
        header: 'Date',
        sortable: true,
        sortFunction: (a, b) => {
          const aTime = new Date(a.dueDate || a.dueAt || 0).getTime()
          const bTime = new Date(b.dueDate || b.dueAt || 0).getTime()
          return aTime - bTime
        },
        cell: (item) => formatListDate(item.dueDate || item.dueAt),
      },
      {
        key: 'responses',
        header: 'Student responses',
        sortable: true,
        sortFunction: (a, b) =>
          (a.studentResponsesCount ?? a.studentCount ?? 0) -
          (b.studentResponsesCount ?? b.studentCount ?? 0),
        cell: (item) => item.studentResponsesCount ?? item.studentCount ?? 0,
      },
      {
        key: 'thematic',
        header: 'Analysis',
        sortable: true,
        sortFunction: (a, b) => Number(Boolean(a.hasThematicAnalysis)) - Number(Boolean(b.hasThematicAnalysis)),
        cell: (item) =>
          item.hasThematicAnalysis ? (
            <span className="inline-flex items-center gap-1 text-sm text-foreground" title="Thematic analysis available">
              <Sparkles className="size-4" aria-hidden />
              <span className="sr-only">Thematic analysis available</span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-[220px] flex-1">
          <SearchInput
            placeholder="Search assessments..."
            aria-label="search-assessments"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={unitFilter}
          aria-label="unit-filter"
          onChange={(e) => setUnitFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="all">All units</option>
          {availableUnits.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          aria-label="type-filter"
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="all">All types</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {filteredAssessments.length > 0 ? (
        <DataTable
          data={filteredAssessments}
          columns={columns}
          sortable
          emptyText="No assessments match your current filters."
          emptyIcon={<Book className="mx-auto size-8 text-muted-foreground" />}
          onRowClick={(assessment) => router.push(`/workspace/assessments/${assessment.id}`)}
          getRowAriaLabel={(assessment) => `Open assessment ${assessment.title}`}
          rowHoverClassName="hover:bg-muted/50"
        />
      ) : (
        <EmptyStateCard
          icon={Book}
          title={emptyTitle}
          description={searchTerm || unitFilter !== 'all' || typeFilter !== 'all' ? searchEmptyDescription : emptyDescription}
        />
      )}
    </div>
  )
}
