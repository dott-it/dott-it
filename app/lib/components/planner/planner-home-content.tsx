'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Plus } from 'lucide-react'
import { Loading } from '@/app/lib/components/ui/layout'
import { Button } from '@/app/lib/components/ui/buttons'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'
import { LIBRARY_OPENSCI_ED_HREF } from '@/lib/library/browse/library-workspace-nav'
import { ROUTES } from '@/app/lib/constants'
import {
  buildPlannerHome,
  type PlannerPeriod,
} from '@/lib/planner/build-planner-home'
import { SoftClassFilter } from './soft-class-filter'
import { WeekMonthCalendar } from './week-month-calendar'
import { FeedbackWorkQueue } from './feedback-work-queue'
import { PlannerPacingStrip } from './planner-pacing-strip'

const REFETCH_INTERVAL_MS = 75_000

export function PlannerHomeContent() {
  const [period, setPeriod] = useState<PlannerPeriod>('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [classKey, setClassKey] = useState('all')

  const {
    data: assessments = [],
    isLoading,
    error,
  } = assessmentQueries.getAssessments.useQuery({
    variables: { schoolYear: 'current' },
    refetchInterval: REFETCH_INTERVAL_MS,
  })

  const model = useMemo(
    () =>
      buildPlannerHome({
        assessments,
        period,
        anchor,
        classKey,
      }),
    [assessments, period, anchor, classKey],
  )

  const highlightedLessons = useMemo(() => {
    const lessons = new Set<number>()
    for (const event of model.eventsInRange) {
      if (event.lessonNumber != null) lessons.add(event.lessonNumber)
    }
    return [...lessons].sort((a, b) => a - b)
  }, [model.eventsInRange])

  if (isLoading) {
    return <Loading variant="page" />
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-destructive">Error loading plan</h1>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      </div>
    )
  }

  const hasAssessments = assessments.length > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your plan</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Organize this {period}, prepare feedback, and keep unit pacing in view.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.WORKSPACE + '/assessments'}>
              All assessments
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={LIBRARY_OPENSCI_ED_HREF} target="_blank" rel="noopener noreferrer">
              <BookOpen className="size-4" aria-hidden />
              Library
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={ROUTES.ASSESSMENT_CREATE}>
              <Plus className="size-4" aria-hidden />
              New assessment
            </Link>
          </Button>
        </div>
      </div>

      {hasAssessments ? (
        <>
          <SoftClassFilter
            classes={model.softClasses}
            value={classKey}
            onChange={setClassKey}
          />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.9fr)]">
            <WeekMonthCalendar
              period={period}
              anchor={anchor}
              events={model.eventsInRange}
              onPeriodChange={setPeriod}
              onAnchorChange={setAnchor}
            />
            <FeedbackWorkQueue items={model.feedbackQueue} />
          </div>

          <PlannerPacingStrip
            unitCode={model.activeUnitCode}
            grade={model.activeGrade}
            highlightedLessonNumbers={highlightedLessons}
          />
        </>
      ) : (
        <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-foreground">Start with a unit or assessment</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Your calendar fills from assessments you assign. Browse the OpenSciEd library or create
            an assessment to begin planning the week.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href={LIBRARY_OPENSCI_ED_HREF} target="_blank" rel="noopener noreferrer">
                Browse library
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.ASSESSMENT_CREATE}>Create assessment</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
