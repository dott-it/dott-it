import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { StatusBadge, SmartDate } from '@/app/lib/components/ui/feedback'
import { AssessmentStatus } from '@/types'
import { Typography } from '@/app/lib/components/ui/typography'
import { Assessment } from '@/types'
import { Calendar, Users } from 'lucide-react'

interface AssessmentCardProps {
  assessment: Assessment
  basePath?: string
}

export function calculateProgressWidth(assessment: Assessment): string {
  if (assessment.totalRecords <= 0) {
    return '0%'
  }

  const completedRecords = assessment.totalRecords - (assessment.pendingRecords || 0)
  const progressPercentage = (completedRecords / assessment.totalRecords) * 100
  return `${Math.max(0, Math.min(100, progressPercentage))}%`
}

export function AssessmentCard({ assessment, basePath = '/workspace/assessments' }: AssessmentCardProps) {
  return (
    <Link href={`${basePath}/${assessment.id}`} className="block h-full">
      <Card className="h-full transition-all duration-200 hover:border-border/80 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{assessment.title}</CardTitle>
              <CardDescription>{assessment.unitName}</CardDescription>
            </div>
            <StatusBadge status={assessment.status as AssessmentStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="size-3 text-muted-foreground" />
              <Typography variant="body2" color="muted" component="span">
                Due: <SmartDate date={assessment.dueDate || new Date()} variant="relative" />
              </Typography>
            </div>
            <div className="flex items-center gap-1">
              <Users className="size-3 text-muted-foreground" />
              <Typography variant="body2" color="muted" component="span">
                {assessment.totalRecords} total
              </Typography>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Typography variant="caption" component="span">
                Progress
              </Typography>
              <Typography variant="caption" component="span">
                {assessment.pendingRecords} pending
              </Typography>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: calculateProgressWidth(assessment),
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
