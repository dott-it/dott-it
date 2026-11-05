'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { Loading, SimplePageHeader } from '@/app/lib/components/ui/layout'
import { Button } from '@/app/lib/components/ui/buttons'
import { AssessmentListTable } from '@/app/lib/components/assessment/assessment-list-table'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'
import { ROUTES } from '@/app/lib/constants'
import { LIBRARY_OPENSCI_ED_HREF } from '@/lib/library/browse/library-workspace-nav'

const REFETCH_INTERVAL_MS = 75_000

export function AssessmentsListContent() {
  const {
    data: assessments = [],
    isLoading,
    error,
  } = assessmentQueries.getAssessments.useQuery({
    variables: { schoolYear: 'current' },
    refetchInterval: REFETCH_INTERVAL_MS,
  })

  if (isLoading) {
    return <Loading variant="page" />
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
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
        title="Assessments"
        description="All assessments for the current school year"
        actions={[
          { label: 'Back to plan', href: ROUTES.WORKSPACE, variant: 'outline', icon: <ArrowLeft className="size-4" /> },
          { label: 'New assessment', href: ROUTES.ASSESSMENT_CREATE, variant: 'primary', icon: <Plus className="size-4" /> },
        ]}
      />

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
        emptyDescription="You have no assessments for the current school year. Browse the library or create an assessment to get started."
      />

      {assessments.length === 0 ? (
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={LIBRARY_OPENSCI_ED_HREF} target="_blank" rel="noopener noreferrer">
              Browse library
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={ROUTES.ASSESSMENT_CREATE}>Create assessment</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
