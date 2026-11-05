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
import { Calendar, FileText, Building2, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AssessmentBackofficeCardProps {
  assessment: Assessment
  basePath?: string
}

export function AssessmentBackofficeCard({ 
  assessment, 
  basePath = '/backoffice/assessments' 
}: AssessmentBackofficeCardProps) {
  const lessonNumber =
    typeof assessment.lessonNumber === 'number'
      ? assessment.lessonNumber
      : assessment.template?.lessonNumber
  const subtitle = backofficeCardSubtitle(assessment)
  const teacherLabel = assessment.teacher?.name?.trim() || assessment.teacher?.email?.trim() || ''
  const hasInfoBadges = Boolean(
    assessment.type ||
      assessment.subject ||
      assessment.unitCode ||
      typeof lessonNumber === 'number' ||
      typeof assessment.grade === 'number',
  )

  return (
    <Link href={`${basePath}/${assessment.id}`} className="block h-full">
      <Card className="h-full transition-all duration-200 hover:border-border/80 hover:shadow-md cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{assessment.title}</CardTitle>
            <CardDescription className="line-clamp-1">
              {subtitle}
            </CardDescription>
          </div>
          <StatusBadge status={assessment.status as AssessmentStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Information */}
        {assessment.template && (
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-muted-foreground shrink-0" />
            <Typography variant="body2" color="muted" className="truncate">
              Template: {assessment.template.title}
            </Typography>
          </div>
        )}

        {/* Dates and Metadata */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="size-3 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <Typography variant="caption" color="muted" component="span" className="block truncate">
                Due: <SmartDate date={assessment.dueDate || new Date(assessment.dueAt)} variant="relative" />
              </Typography>
            </div>
          </div>
          
          {assessment.assignedAt && (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="size-3 text-muted-foreground shrink-0" />
              <Typography variant="caption" color="muted" component="span" className="truncate">
                Created: <SmartDate date={new Date(assessment.assignedAt)} variant="relative" />
              </Typography>
            </div>
          )}

          {assessment.schoolYear ? (
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="size-3 text-muted-foreground shrink-0" />
              <Typography variant="caption" color="muted" component="span" className="truncate">
                School year: {assessment.schoolYear}
              </Typography>
            </div>
          ) : null}

          {teacherLabel ? (
            <div className="flex items-center gap-2 text-xs">
              <GraduationCap className="size-3 text-muted-foreground shrink-0" />
              <Typography variant="caption" color="muted" component="span" className="truncate">
                Teacher: {teacherLabel}
              </Typography>
            </div>
          ) : null}

          {(assessment.tenant || assessment.tenantId) && (
            <div className="flex items-center gap-2 text-xs">
              <Building2 className="size-3 text-muted-foreground shrink-0" />
              <Typography variant="caption" color="muted" component="span" className="truncate">
                Tenant:{' '}
                {assessment.tenant?.name || assessment.tenantId?.slice(0, 8) || 'Unknown'}
              </Typography>
            </div>
          )}
        </div>

        {hasInfoBadges ? (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {assessment.type ? (
              <Badge variant="secondary" className="text-xs">
                {assessment.type}
              </Badge>
            ) : null}
            {assessment.subject ? (
              <Badge variant="outline" className="text-xs">
                {assessment.subject}
              </Badge>
            ) : null}
            {assessment.unitCode ? (
              <Badge variant="outline" className="text-xs">
                Unit {assessment.unitCode}
              </Badge>
            ) : null}
            {typeof lessonNumber === 'number' ? (
              <Badge variant="outline" className="text-xs">
                Lesson {lessonNumber}
              </Badge>
            ) : null}
            {typeof assessment.grade === 'number' ? (
              <Badge variant="secondary" className="text-xs">
                Grade {assessment.grade}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
    </Link>
  )
}

function backofficeCardSubtitle(assessment: Assessment): string {
  const unitCode = (assessment.unitCode ?? '').trim()
  if (unitCode) return `Unit ${unitCode}`
  const label = (assessment.unitName ?? assessment.subject ?? '').trim()
  if (label) return label
  return 'No unit/subject'
}

