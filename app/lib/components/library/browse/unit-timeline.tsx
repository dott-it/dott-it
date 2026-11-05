import { getActiveTimelineLegend, getTimelineMarkerClass } from '@/lib/library/browse'
import type { TimelineSegment, UnitAssessmentShape } from '@/lib/library/browse'
import { cn } from '@/lib/utils'

interface UnitTimelineProps {
  timeline: TimelineSegment[]
  assessmentShape: UnitAssessmentShape
}

function formatAssessmentShapeSummary(shape: UnitAssessmentShape): string {
  const parts = [
    `${shape.lessonCount} ${shape.lessonCount === 1 ? 'lesson' : 'lessons'}`,
    `${shape.opportunityCount} assessment ${shape.opportunityCount === 1 ? 'opportunity' : 'opportunities'}`,
    `${shape.assessmentCount} ${shape.assessmentCount === 1 ? 'assessment' : 'assessments'}`,
    `length: ${shape.totalPacingDays} ${shape.totalPacingDays === 1 ? 'day' : 'days'}`,
  ]

  return parts.join(' · ')
}

export function UnitTimeline({ timeline, assessmentShape }: UnitTimelineProps) {
  if (timeline.length === 0) {
    return null
  }

  const legendEntries = getActiveTimelineLegend(timeline)

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <p className="text-sm text-muted-foreground">
        {formatAssessmentShapeSummary(assessmentShape)}
      </p>

      <div className="flex h-14 w-full overflow-hidden rounded-lg border bg-background">
        {timeline.map((segment) => (
          <a
            key={segment.lessonNumber}
            href={`#lesson-${segment.lessonNumber}`}
            className="relative flex min-w-0 flex-col items-center justify-end border-r border-border/50 px-0.5 pb-1 last:border-r-0 hover:bg-accent/40"
            style={{ flex: segment.widthFraction }}
            title={`Lesson ${segment.lessonNumber}`}
          >
            <div className="mb-1 flex min-h-2.5 items-center justify-center gap-0.5">
              {segment.markers.map((marker, index) => (
                <span
                  key={`${marker.lessonNumber}-${marker.category}-${marker.kind}-${index}`}
                  className={cn('size-2.5', getTimelineMarkerClass(marker.category, marker.kind))}
                  title={
                    marker.kind === 'opportunity'
                      ? `Lesson ${marker.lessonNumber} · Assessment opportunity`
                      : `Lesson ${marker.lessonNumber} · ${marker.category} assessment`
                  }
                />
              ))}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{segment.label}</span>
          </a>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {legendEntries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('size-2.5', entry.className)} aria-hidden />
            <span>{entry.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
