'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/lib/components/ui/layout/card'
import { AssessmentRecord } from '@/types'
import { Filter } from 'lucide-react'
import { cn } from '@/app/lib/utils/utils'

const STATUS_OPTIONS: { value: string; label: string; dotColor?: string; bgBase: string; bgHover: string; borderSelected: string }[] = [
  { value: 'all', label: 'All', bgBase: 'bg-muted/50', bgHover: 'hover:bg-muted', borderSelected: 'border-primary ring-2 ring-primary/20' },
  { value: 'ready_for_review', label: 'Ready for Review', dotColor: 'bg-blue-500', bgBase: 'bg-blue-50 dark:bg-blue-950/20', bgHover: 'hover:bg-blue-100 dark:hover:bg-blue-950/40', borderSelected: 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20' },
  { value: 'in_progress', label: 'In Progress', dotColor: 'bg-yellow-500', bgBase: 'bg-yellow-50 dark:bg-yellow-950/20', bgHover: 'hover:bg-yellow-100 dark:hover:bg-yellow-950/40', borderSelected: 'border-yellow-300 dark:border-yellow-700 ring-2 ring-yellow-500/20' },
  { value: 'shared', label: 'Shared', dotColor: 'bg-green-500', bgBase: 'bg-green-50 dark:bg-green-950/20', bgHover: 'hover:bg-green-100 dark:hover:bg-green-950/40', borderSelected: 'border-green-300 dark:border-green-700 ring-2 ring-green-500/20' },
  { value: 'handed_in', label: 'Handed In', dotColor: 'bg-orange-500', bgBase: 'bg-orange-50 dark:bg-orange-950/20', bgHover: 'hover:bg-orange-100 dark:hover:bg-orange-950/40', borderSelected: 'border-orange-300 dark:border-orange-700 ring-2 ring-orange-500/20' },
]

interface StatusFilterSidebarProps {
  assessmentRecords: AssessmentRecord[]
  statusFilter: string
  onFilterChange: (status: string) => void
}

export function StatusFilterSidebar({
  assessmentRecords,
  statusFilter,
  onFilterChange,
}: StatusFilterSidebarProps) {
  const total = assessmentRecords.length

  const counts = useMemo(() => {
    const readyForReview = assessmentRecords.filter((r) => r.status === 'ready_for_review').length
    const inProgress = assessmentRecords.filter((r) => r.status === 'in_progress').length
    const shared = assessmentRecords.filter((r) => r.status === 'shared').length
    const handedIn = assessmentRecords.filter((r) => r.status === 'handed_in').length
    return { all: total, ready_for_review: readyForReview, in_progress: inProgress, shared, handed_in: handedIn }
  }, [assessmentRecords, total])

  const getPercentage = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0)

  const showingCount = statusFilter === 'all' ? total : counts[statusFilter as keyof typeof counts] ?? 0

  return (
    <Card className="w-[280px] shrink-0" data-testid="status-filter-sidebar">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4" aria-hidden />
          Filter by Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {STATUS_OPTIONS.map((opt) => {
          const count = opt.value === 'all' ? total : counts[opt.value as keyof typeof counts]
          const isSelected = statusFilter === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilterChange(opt.value)}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between rounded-lg border p-3 text-left transition-all',
                opt.bgBase,
                opt.bgHover,
                isSelected ? `border-2 ${opt.borderSelected}` : 'border-transparent'
              )}
              data-testid={`status-filter-option-${opt.value}`}
              aria-pressed={isSelected}
              aria-label={`Filter by ${opt.label}, ${count} students`}
            >
              <div className="flex items-center gap-3">
                {opt.dotColor ? (
                  <div className={cn('size-3 shrink-0 rounded-full', opt.dotColor)} aria-hidden />
                ) : null}
                <span className="text-sm font-medium">{opt.label}</span>
              </div>
              <div className="text-right">
                <div className="font-bold tabular-nums">{count}</div>
                {opt.value !== 'all' && (
                  <div className="text-xs text-muted-foreground">{getPercentage(count)}%</div>
                )}
              </div>
            </button>
          )
        })}
        <p className="pt-3 text-center text-sm text-muted-foreground" data-testid="status-filter-summary">
          Showing {showingCount} of {total} students
        </p>
      </CardContent>
    </Card>
  )
}
