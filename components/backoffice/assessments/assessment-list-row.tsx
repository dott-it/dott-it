'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/app/lib/components/ui/feedback'
import { assessmentBrowseContextLine } from '@/lib/assessment-browse'
import type { ActiveAssessment, AssessmentStatus } from '@/types'

interface AssessmentListRowProps {
  assessment: ActiveAssessment
  basePath?: string
}

export function AssessmentListRow({
  assessment,
  basePath = '/backoffice/assessments',
}: AssessmentListRowProps) {
  const lessonNumber =
    typeof assessment.lessonNumber === 'number'
      ? assessment.lessonNumber
      : assessment.template?.lessonNumber
  const contextLine = assessmentBrowseContextLine(assessment)

  return (
    <Link
      href={`${basePath}/${assessment.id}`}
      className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{assessment.title}</p>
          <StatusBadge status={assessment.status as AssessmentStatus} />
        </div>
        {assessment.description ? (
          <p className="line-clamp-1 text-sm text-muted-foreground">{assessment.description}</p>
        ) : null}
        {contextLine ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">{contextLine}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {assessment.type ? <Badge variant="secondary">{assessment.type}</Badge> : null}
        {assessment.subject ? <Badge variant="outline">{assessment.subject}</Badge> : null}
        {assessment.unitCode ? <Badge variant="outline">Unit {assessment.unitCode}</Badge> : null}
        {typeof lessonNumber === 'number' ? (
          <Badge variant="outline">Lesson {lessonNumber}</Badge>
        ) : null}
        {typeof assessment.grade === 'number' ? (
          <Badge variant="secondary">Grade {assessment.grade}</Badge>
        ) : null}
      </div>
    </Link>
  )
}
