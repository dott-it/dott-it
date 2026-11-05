import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/lib/components/ui/layout/card'
import { Badge } from '@/app/lib/components/ui/feedback/badge'
import { Button } from '@/app/lib/components/ui/buttons/button'
import { Progress } from '@/app/lib/components/ui/feedback/progress'
import { Assessment } from '@/types'
import { formatDateShort, cn } from '@/app/lib/utils/utils'
import { Calendar, Users, Clock, CheckCircle, AlertTriangle, QrCode, Eye } from 'lucide-react'

interface AssessmentCardProps {
  assessment: Assessment
  onLiveCollectionClick?: (assessment: Assessment) => void
  onDetailsClick?: (assessment: Assessment) => void
  className?: string
}

export function AssessmentCard({
  assessment,
  onLiveCollectionClick,
  onDetailsClick,
  className,
}: AssessmentCardProps) {
  const progressPercent =
    assessment.totalRecords > 0
      ? ((assessment.totalRecords - (assessment.pendingRecords || 0)) / assessment.totalRecords) * 100
      : 0

  const getStatusInfo = () => {
    switch (assessment.status) {
      case 'live': {
        return {
          icon: Clock,
          text: 'Live',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        }
      }
      case 'completed': {
        return {
          icon: CheckCircle,
          text: 'Completed',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        }
      }
      case 'draft': {
        return {
          icon: AlertTriangle,
          text: 'Draft',
          variant: 'outline' as const,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        }
      }
      case 'expired': {
        return {
          icon: AlertTriangle,
          text: 'Expired',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        }
      }
      default: {
        return {
          icon: Clock,
          text: 'Unknown',
          variant: 'outline' as const,
          className: '',
        }
      }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Card
      className={cn('group overflow-hidden transition-all duration-200 hover:shadow-md', className)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
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
          <Badge
            variant={statusInfo.variant}
            className={cn('flex items-center gap-1 ml-2', statusInfo.className)}
          >
            <StatusIcon className="size-3" />
            {statusInfo.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="font-medium text-primary">
              {assessment.totalRecords - (assessment.pendingRecords || 0)}/{assessment.totalRecords}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Statistics */}
        {assessment.submissionStats && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded bg-blue-50 p-2 text-center dark:bg-blue-950/20">
              <div className="font-semibold text-blue-600 dark:text-blue-400">
                {assessment.submissionStats.readyForReview}
              </div>
              <div className="text-muted-foreground">Ready</div>
            </div>
            <div className="rounded bg-yellow-50 p-2 text-center dark:bg-yellow-950/20">
              <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                {assessment.submissionStats.readyForReview}
              </div>
              <div className="text-muted-foreground">Ready for Review</div>
            </div>
            <div className="rounded bg-green-50 p-2 text-center dark:bg-green-950/20">
              <div className="font-semibold text-green-600 dark:text-green-400">
                {assessment.submissionStats.shared}
              </div>
              <div className="text-muted-foreground">Shared</div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="size-3" />
              <span>{assessment.studentCount || assessment.totalRecords} students</span>
            </div>
            {assessment.closeDate && (
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>Due {formatDateShort(assessment.closeDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {assessment.status === 'live' && onLiveCollectionClick && (
            <Button size="sm" onClick={() => onLiveCollectionClick(assessment)} className="flex-1">
              <QrCode className="mr-2 size-3" />
              Live Collection
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDetailsClick?.(assessment)}
            className="flex-1"
          >
            <Eye className="mr-2 size-3" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
