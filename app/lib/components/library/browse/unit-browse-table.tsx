'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { filterLessonsForBrowseView } from '@/lib/library/browse'
import type { BrowseViewMode, ResolvedBrowseFocus, UnitBrowseModel } from '@/lib/library/browse'
import { browseActivityElementId } from '@/lib/library/browse'
import { AssessmentRow } from './assessment-row'
import { LessonContextExpand } from './lesson-context-expand'
import { OpportunityRow } from './opportunity-row'
import { OpportunitySummaryRow } from './opportunity-summary-row'

interface UnitBrowseTableProps {
  unit: UnitBrowseModel
  searchQuery: string
  viewMode: BrowseViewMode
  focusTarget?: ResolvedBrowseFocus | null
}

export function UnitBrowseTable({
  unit,
  searchQuery,
  viewMode,
  focusTarget = null,
}: UnitBrowseTableProps) {
  const [expandedLesson, setExpandedLesson] = useState<number | null>(() =>
    focusTarget?.kind === 'opportunity' ? focusTarget.lessonNumber : null,
  )

  const visibleLessons = useMemo(
    () => filterLessonsForBrowseView(unit.lessons, viewMode, searchQuery),
    [unit.lessons, searchQuery, viewMode],
  )

  useEffect(() => {
    if (viewMode === 'assessments-only') {
      setExpandedLesson(null)
    }
  }, [viewMode])

  useEffect(() => {
    if (!focusTarget) {
      return
    }

    if (focusTarget.kind === 'opportunity') {
      setExpandedLesson(focusTarget.lessonNumber)
    }
  }, [focusTarget])

  useEffect(() => {
    if (!focusTarget) {
      return
    }

    if (focusTarget.kind === 'opportunity' && expandedLesson !== focusTarget.lessonNumber) {
      return
    }

    const element = document.querySelector(
      `#${CSS.escape(browseActivityElementId(focusTarget.kind, focusTarget.slug))}`,
    )
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusTarget, expandedLesson])

  const toggleLesson = (lessonNumber: number) => {
    setExpandedLesson((current) => (current === lessonNumber ? null : lessonNumber))
  }

  if (visibleLessons.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        {viewMode === 'assessments-only'
          ? 'No standalone assessments match your search.'
          : 'No lessons match your search.'}
      </p>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead className="w-[32%]">Lesson</TableHead>
            <TableHead>In this lesson</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleLessons.map((lesson) => {
            const expanded = expandedLesson === lesson.lessonNumber
            const showOpportunities = viewMode === 'all'
            const hasAssessments = lesson.assessments.length > 0
            const hasOpportunities = lesson.opportunities.length > 0
            const showSequenceContext =
              viewMode === 'all' && !hasAssessments && !hasOpportunities

            return (
              <TableRow
                key={lesson.lessonNumber}
                id={`lesson-${lesson.lessonNumber}`}
                className="scroll-mt-24"
              >
                <TableCell className="align-top font-medium text-muted-foreground">
                  {String(lesson.lessonNumber).padStart(2, '0')}
                </TableCell>
                <TableCell className="align-top overflow-hidden">
                  <LessonContextExpand
                    lessonNumber={lesson.lessonNumber}
                    topic={lesson.topic}
                    pacingDays={lesson.pacingDays}
                    drivingQuestion={lesson.drivingQuestion}
                  />
                </TableCell>
                <TableCell className="align-top min-w-0">
                  <div className="space-y-0.5">
                    {lesson.assessments.map((assessment) => (
                      <AssessmentRow
                        key={assessment.id}
                        assessment={assessment}
                        grade={unit.grade}
                        unitCode={unit.unitCode}
                        focused={
                          focusTarget?.kind === 'assessment' &&
                          focusTarget.slug === assessment.slug
                        }
                      />
                    ))}

                    {showOpportunities ? (
                      <>
                        <OpportunitySummaryRow
                          count={lesson.opportunities.length}
                          expanded={expanded}
                          onToggle={() => toggleLesson(lesson.lessonNumber)}
                        />
                        {expanded
                          ? lesson.opportunities.map((opportunity) => (
                              <OpportunityRow
                                key={opportunity.id}
                                opportunity={opportunity}
                                grade={unit.grade}
                                unitCode={unit.unitCode}
                                focused={
                                  focusTarget?.kind === 'opportunity' &&
                                  focusTarget.slug === opportunity.slug
                                }
                              />
                            ))
                          : null}
                      </>
                    ) : null}

                    {showSequenceContext ? (
                      <p className="py-1 text-sm italic text-muted-foreground">
                        No assessments in this lesson — sequence context only.
                      </p>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
