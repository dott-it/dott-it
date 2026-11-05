import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../layout/card'
import { Typography } from '../typography'
import { Assessment } from '@/types'
import { formatDateShort, cn } from '@/app/lib/utils/utils'
import { Calendar, Users } from 'lucide-react'

interface AssessmentCardProps {
  assessment: Assessment
  href?: string
  className?: string
}

export function AssessmentFeedbackCard({
  assessment,
  href,
  className,
}: AssessmentCardProps) {
  const readyForReview = assessment.submissionStatus?.readyForReview ?? 0
  const inProgress = assessment.submissionStatus?.inProgress ?? 0
  const shared = assessment.submissionStatus?.shared ?? 0

  const card = (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-200 hover:shadow-md',
        href && 'cursor-pointer hover:border-border/80',
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-1 text-lg font-semibold transition-colors group-hover:text-primary">
            {assessment.title}
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            {assessment.unitName}
            {assessment.grade === undefined || assessment.grade === null
              ? ''
              : ` • Grade ${assessment.grade}`}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status counts — colors aligned with StatusFilterSidebar */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={cn(
              'flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center',
              'bg-blue-50 dark:bg-blue-950/20',
            )}
            data-testid="assessment-card-status-ready-for-review"
          >
            <Typography variant="caption" className="leading-tight text-muted-foreground" component="span">
              Ready for Review
            </Typography>
            <Typography variant="body1" fontWeight="bold" className="tabular-nums" component="span">
              {readyForReview}
            </Typography>
          </div>
          <div
            className={cn(
              'flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center',
              'bg-yellow-50 dark:bg-yellow-950/20',
            )}
            data-testid="assessment-card-status-in-progress"
          >
            <Typography variant="caption" className="leading-tight text-muted-foreground" component="span">
              In Progress
            </Typography>
            <Typography variant="body1" fontWeight="bold" className="tabular-nums" component="span">
              {inProgress}
            </Typography>
          </div>
          <div
            className={cn(
              'flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-center',
              'bg-green-50 dark:bg-green-950/20',
            )}
            data-testid="assessment-card-status-shared"
          >
            <Typography variant="caption" className="leading-tight text-muted-foreground" component="span">
              Shared
            </Typography>
            <Typography variant="body1" fontWeight="bold" className="tabular-nums" component="span">
              {shared}
            </Typography>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="size-3" />
              <Typography variant="body2" color="muted" component="span">
                {assessment.studentCount || assessment.totalRecords} students
              </Typography>
            </div>
            {assessment.closeDate && (
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <Typography variant="body2" color="muted" component="span">
                  Due {formatDateShort(assessment.closeDate)}
                </Typography>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {card}
      </Link>
    )
  }

  return card
}
