'use client'

import React from 'react'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Download, X } from 'lucide-react'
import { getStudentDisplayName } from '@/app/lib/utils/student-display-name'
import { getStatusColor } from '@/app/lib/utils/export/utils/status-utils'
import { StudentStatusBadge } from '@/app/lib/components/ui/feedback'
import { cn } from '@/app/lib/utils/utils'
import type { AssessmentRecordStatus } from '@/types'

function getInitials(name: string): string {
  const displayName = name.trim() || '?'
  const parts = displayName.split(/\s+/)
  if (parts.length >= 2) {
    return ((parts[0][0] ?? '') + (parts[1][0] ?? '')).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
}

export interface ActiveFilter {
  type: 'status' | 'class'
  value: string
  label: string
}

export interface StudentAssessmentSecondaryBarProps {
  studentName: string
  learnerId?: string
  showStudentInfo: boolean
  onToggleStudentInfo: () => void
  onPrevious?: () => void
  onNext?: () => void
  isFirstRecord?: boolean
  isLastRecord?: boolean
  classSection?: string
  assessmentRecordStatus: AssessmentRecordStatus
  activeFilters: ActiveFilter[]
  onRemoveFilter: (type: 'status' | 'class') => void
  currentPosition: number
  totalCount: number
  onExport: () => void
  className?: string
}

export function StudentAssessmentSecondaryBar({
  studentName,
  learnerId,
  showStudentInfo,
  onToggleStudentInfo,
  onPrevious,
  onNext,
  isFirstRecord = false,
  isLastRecord = false,
  classSection,
  assessmentRecordStatus,
  activeFilters,
  onRemoveFilter,
  currentPosition,
  totalCount,
  onExport,
  className,
}: StudentAssessmentSecondaryBarProps) {
  const displayName = getStudentDisplayName({
    showRealNames: showStudentInfo,
    learnerName: studentName,
    learnerId,
  })
  const initials = getInitials(displayName)
  const segmentClass = 'flex items-center gap-1.5 text-base text-foreground'
  const divider = <div className="h-4 w-px shrink-0 bg-border" aria-hidden />

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/40 px-4 py-3',
        className
      )}
      data-testid="student-assessment-secondary-bar"
    >
      <div className="flex flex-wrap items-center gap-0">
        {/* Previous */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={!onPrevious || isFirstRecord}
          className={cn(
            'flex items-center gap-1 pr-2 text-base text-foreground transition-colors hover:text-foreground/80 disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="Previous student"
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span>Previous</span>
        </button>

        {/* Avatar + Name + Eye */}
        <div className={cn(segmentClass, 'px-2')}>
          {divider}
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-base font-medium text-muted-foreground"
            aria-hidden
          >
            {initials}
          </div>
          <span className="font-semibold">{displayName}</span>
          <button
            type="button"
            onClick={onToggleStudentInfo}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={showStudentInfo ? 'Hide student name' : 'Show student name'}
          >
            {showStudentInfo ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>

        {/* Next */}
        <div className="flex items-center pl-2">
          {divider}
          <button
            type="button"
            onClick={onNext}
            disabled={!onNext || isLastRecord}
            className={cn(
              'flex items-center gap-1 text-base text-foreground transition-colors hover:text-foreground/80 disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label="Next student"
          >
            <span>Next</span>
            <ChevronRight className="size-4 shrink-0" />
          </button>
        </div>

        {/* Middle section: Class, Status, Filters, Reviewed - with extra left spacing from Next */}
        <div className="flex flex-wrap items-center gap-0 pl-10">
        {/* Class */}
        {classSection && (
          <>
            {divider}
            <div className={cn(segmentClass, 'px-4')} data-testid="secondary-bar-class">
              <span>{classSection}</span>
            </div>
          </>
        )}

        {/* Status badge */}
        {divider}
        <div className={cn(segmentClass, 'px-4')} data-testid="secondary-bar-status">
          <StudentStatusBadge status={assessmentRecordStatus} />
        </div>

        {/* Filter chips */}
        {activeFilters.length > 0 && (
          <>
            {divider}
            <div className="flex flex-wrap items-center gap-2 px-4">
              {activeFilters.map((filter) => (
                <span
                  key={`${filter.type}-${filter.value}`}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    filter.type === 'status' ? getStatusColor(filter.value) : 'bg-muted/60 text-foreground'
                  )}
                  data-testid={`filter-chip-${filter.type}-${filter.value}`}
                >
                  {filter.type === 'status' && (
                    <span
                      className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        filter.value === 'ready_for_review' && 'bg-blue-500',
                        filter.value === 'in_progress' && 'bg-yellow-500',
                        filter.value === 'shared' && 'bg-green-500',
                        filter.value === 'handed_in' && 'bg-orange-500'
                      )}
                      aria-hidden
                    />
                  )}
                  {filter.label}
                  <button
                    type="button"
                    onClick={() => onRemoveFilter(filter.type)}
                    className="shrink-0 rounded p-0.5 hover:bg-black/10"
                    aria-label={`Remove ${filter.type} filter`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </>
        )}

        {/* X/Y reviewed */}
        {divider}
        <div
          className={cn(segmentClass, 'px-4 tabular-nums')}
          data-testid="secondary-bar-reviewed"
          aria-label={`Student ${currentPosition} of ${totalCount} reviewed`}
        >
          <span>
            {currentPosition}/{totalCount} reviewed
          </span>
        </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        className="shrink-0 bg-background"
        data-testid="student-assessment-secondary-bar-export"
        aria-label="Export"
      >
        <Download className="mr-2 size-4" />
        Export
      </Button>
    </div>
  )
}
