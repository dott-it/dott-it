'use client'

import Link from 'next/link'
import { Loading, SimplePageHeader } from '@/app/lib/components/ui/layout'
import { AssessmentListTable } from '@/app/lib/components/assessment/assessment-list-table'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'

export default function PriorYearAssessmentsPage() {
  const { data: assessments = [], isLoading, error } = assessmentQueries.getAssessments.useQuery({
    variables: { schoolYear: 'prior' },
    refetchInterval: 75_000,
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
      <div className="flex items-start justify-between gap-4">
        <SimplePageHeader
          title="Prior years"
          description="Assessments from previous school years"
        />
        <Link
          href="/workspace"
          className="shrink-0 pt-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to current year
        </Link>
      </div>

      <AssessmentListTable
        assessments={assessments}
        emptyTitle="No prior-year assessments"
        emptyDescription="There are no assessments from previous school years yet."
      />
    </div>
  )
}
