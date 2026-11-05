'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Loading, SimplePageHeader } from '@/app/lib/components/ui/layout'
import { AssessmentListTable } from '@/app/lib/components/assessment/assessment-list-table'
import { SpotlightCards } from '@/app/lib/components/assessment/spotlight-cards'
import { assessmentQueries } from '../../lib/services/assesssments/assessment.queries'
import { spotlightQueries } from '@/app/lib/services/spotlight/spotlight.queries'

const REFETCH_INTERVAL_MS = 75_000

export function WorkspaceHomeContent() {
  const {
    data: assessments = [],
    isLoading,
    error,
  } = assessmentQueries.getAssessments.useQuery({
    variables: { schoolYear: 'current' },
    refetchInterval: REFETCH_INTERVAL_MS,
  })

  const {
    data: spotlightCards = [],
    error: spotlightError,
  } = spotlightQueries.getSpotlightCards.useQuery({
    refetchInterval: REFETCH_INTERVAL_MS,
  })

  if (isLoading) {
    return <Loading variant="page" />
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-destructive">Error loading assessments</h1>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SimplePageHeader
        title="Workspace"
        description="Manage your assessments and student responses"
      />

      {spotlightError ? (
        <p className="text-sm text-destructive" data-testid="spotlight-error">
          Could not load Spotlight:{' '}
          {spotlightError instanceof Error ? spotlightError.message : 'Unknown error'}
        </p>
      ) : (
        <SpotlightCards cards={spotlightCards} />
      )}

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">Current school year</h2>
        <Link
          href="/workspace/assessments/prior"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Prior years
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <AssessmentListTable
        assessments={assessments}
        emptyDescription="You have no assessments for the current school year. Contact your coach or eddo point of contact to get started."
      />
    </div>
  )
}
