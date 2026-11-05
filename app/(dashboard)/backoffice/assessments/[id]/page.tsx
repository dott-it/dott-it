'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { Loading } from '@/app/lib/components/ui/layout'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'
import { BackofficeAssessmentActions } from '@/components/backoffice/assessments/backoffice-assessment-actions'
import { BackofficeEmptyState } from '@/components/backoffice/common/backoffice-empty-state'
import { BackofficeAssessmentDetailsGrid } from '@/components/backoffice/assessments/backoffice-assessment-details-grid'
import { BackofficeAssessmentInstructions } from '@/components/backoffice/assessments/backoffice-assessment-instructions'
import { formatInstructions } from '../utils/format-instructions'

export default function AssessmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string

  const {
    data: assessment,
    isLoading,
    error,
    refetch,
  } = assessmentQueries.getAssessment.useQuery({
    variables: { id: assessmentId },
    enabled: Boolean(assessmentId),
  })

  const deleteAssessmentMutation = assessmentQueries.deleteAssessment.useMutation({
    onSuccess: () => {
      router.push('/backoffice')
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : 'Failed to delete assessment'
      alert(message)
    },
  })

  const syncResponsesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/assessments/${assessmentId}/sync-responses`, {
        method: 'POST',
      })
      const body = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
        responseCount?: number
      }
      if (!response.ok) {
        throw new Error(body.message || body.error || `Sync failed (${response.status})`)
      }
      return body
    },
    onSuccess: (result) => {
      void refetch()
      const count =
        typeof result.responseCount === 'number' ? ` (${result.responseCount} form responses)` : ''
      alert(`Responses synced successfully.${count}`)
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : 'Failed to sync responses'
      alert(message)
    },
  })

  const pageTitle = useMemo(() => {
    if (assessment?.title) {
      return assessment.title
    }

    if (isLoading) {
      return 'Loading Assessment...'
    }

    return 'Assessment Not Found'
  }, [assessment?.title, isLoading])

  const breadcrumbItems = useMemo(() => {
    if (assessment?.title) {
      return [{ label: assessment.title, isLast: true }]
    }
    return [{ label: 'Assessment', isLast: true }]
  }, [assessment?.title])

  const handleDelete = () => {
    if (!assessmentId || deleteAssessmentMutation.isPending) {
      return
    }

    if (!confirm('Are you sure you want to delete this assessment?')) {
      return
    }

    deleteAssessmentMutation.mutate({ id: assessmentId })
  }

  const showEmptyState = !isLoading && (!assessment || error)

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title={pageTitle}
        subtitle={
          assessment
            ? 'View and manage assessment information'
            : 'Review assessment status or return to the backoffice'
        }
        breadcrumbItems={breadcrumbItems}
      />

      {assessment && (
        <BackofficeAssessmentActions
          assessmentId={assessmentId}
          hasGoogleForm={Boolean(assessment.googleFormId)}
          onDelete={handleDelete}
          isDeleting={deleteAssessmentMutation.isPending}
          onSyncResponses={() => syncResponsesMutation.mutate()}
          isSyncing={syncResponsesMutation.isPending}
        />
      )}

      {isLoading && (
        <div className="flex justify-center">
          <Loading variant="assessment" />
        </div>
      )}

      {showEmptyState && (
        <BackofficeEmptyState
          title="Assessment not found"
          message="The assessment you're looking for doesn't exist or may have been removed."
        />
      )}

      {assessment && !isLoading && (
        <>
          <BackofficeAssessmentDetailsGrid assessment={assessment} />

          {assessment.instructions && (
            <BackofficeAssessmentInstructions
              instructions={assessment.instructions}
              formatInstructions={formatInstructions}
            />
          )}
        </>
      )}
    </div>
  )
}
