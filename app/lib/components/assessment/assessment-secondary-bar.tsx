import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { ActiveAssessment } from '@/types'
import { BookOpen, GraduationCap, FileText, Users, CheckCircle2, QrCode } from 'lucide-react'
import { cn } from '@/app/lib/utils/utils'

export interface AssessmentSecondaryBarProps {
  assessment: ActiveAssessment
  totalStudents: number
  /** Number of submissions considered "complete" for progress (e.g. shared count). */
  completedCount: number
  onAssessmentHandout: () => void
  /** Whether the handout action is disabled (e.g. assessment not live). */
  handoutDisabled?: boolean
  className?: string
}

function formatAssessmentType(type: string | undefined): string {
  if (!type) return '—'
  return type.charAt(0).toUpperCase() + type.slice(1).replaceAll('_', ' ')
}

export function AssessmentSecondaryBar({
  assessment,
  totalStudents,
  completedCount,
  onAssessmentHandout,
  handoutDisabled = false,
  className,
}: AssessmentSecondaryBarProps) {
  const progressMax = totalStudents > 0 ? totalStudents : 1
  const progressValue = Math.min(completedCount, progressMax)

  // Reference: minimal pills (icon + text), vertical dividers, no heavy borders
  const segmentClass =
    'flex items-center gap-1.5 text-sm text-foreground'

  const divider = <div className="h-4 w-px shrink-0 bg-border" aria-hidden />

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/40 px-4 py-3',
        className
      )}
      data-testid="assessment-secondary-bar"
    >
      <div className="flex flex-wrap items-center gap-0">
        {/* Grade */}
        {assessment.grade != null && (
          <>
            <div className={cn(segmentClass, 'pr-4')} data-testid="secondary-bar-grade">
              <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
              <span>Grade {assessment.grade}</span>
            </div>
            {divider}
          </>
        )}

        {/* Subject */}
        {assessment.subject && (
          <>
            <div className={cn(segmentClass, assessment.grade == null ? 'pr-4' : 'px-4')} data-testid="secondary-bar-subject">
              <BookOpen className="size-4 shrink-0 text-muted-foreground" />
              <span>{assessment.subject}</span>
            </div>
            {divider}
          </>
        )}

        {/* Assessment Type */}
        <div className={cn(segmentClass, 'px-4')} data-testid="secondary-bar-type">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span>{formatAssessmentType(assessment.type)}</span>
        </div>

        {/* Students count */}
        {divider}
        <div className={cn(segmentClass, 'px-4')} data-testid="secondary-bar-students">
          <Users className="size-4 shrink-0 text-muted-foreground" />
          <span>{totalStudents} Students</span>
        </div>

        {/* Progress: checkmark + thin bar + ratio (reference: thin bar, dark fill, 2/8 to the right) */}
        {divider}
        <div
          className="flex items-center gap-2 pl-4"
          data-testid="secondary-bar-progress"
          role="group"
          aria-label={`Progress: ${completedCount} of ${totalStudents} submissions`}
        >
          <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
          <div className="flex w-20 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground/80 transition-all duration-300"
                style={{
                  width: `${progressMax > 0 ? (progressValue / progressMax) * 100 : 0}%`,
                }}
                role="progressbar"
                aria-valuenow={progressValue}
                aria-valuemin={0}
                aria-valuemax={progressMax}
              />
            </div>
            <span className="shrink-0 text-sm tabular-nums text-foreground">
              {completedCount}/{totalStudents}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onAssessmentHandout}
        disabled={handoutDisabled}
        className="shrink-0 bg-background"
        data-testid="secondary-bar-handout-button"
      >
        <QrCode className="mr-2 size-4" />
        Assessment Handout
      </Button>
    </div>
  )
}
