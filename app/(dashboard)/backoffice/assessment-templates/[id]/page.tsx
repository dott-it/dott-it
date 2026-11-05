'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { AssessmentTemplateDetailsSection } from '@/app/lib/components/assessment'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { Loading } from '@/app/lib/components/ui/layout'
import { assessmentTemplateQueries } from '@/app/lib/services/assessment-templates/assessment-template.queries'
import { BackofficeTemplateActions } from '@/components/backoffice/assessment-templates/backoffice-template-actions'
import { BackofficeEmptyState } from '@/components/backoffice/common/backoffice-empty-state'
import { BackofficeTemplateUsageCard } from '@/components/backoffice/assessment-templates/backoffice-template-usage-card'
import { successOrThrow } from '@/utils/result'
import { getAssessmentTemplate } from '@/app/lib/services/assessment-templates/assessment-template.service'

type UsageAssessment = {
  id: string
  status: string
  assignedAt: string | null
  dueAt: string | null
  title: string
  numberOfQuestions: number
}

const USAGE_PAGE_SIZE = 5

export default function AssessmentTemplateDetailPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const templateId = params.id as string

  const {
    data: template,
    isLoading,
    error,
    isFetching,
  } = assessmentTemplateQueries.detail.useQuery({
    variables: { id: templateId, limit: USAGE_PAGE_SIZE },
    enabled: Boolean(templateId),
  })

  const [usageAssessments, setUsageAssessments] = useState<UsageAssessment[]>([])
  const [usageHasMore, setUsageHasMore] = useState(false)
  const [usageNextCursor, setUsageNextCursor] = useState<string | undefined>()
  const [isLoadingMoreUsage, setIsLoadingMoreUsage] = useState(false)

  const duplicateTemplateMutation = assessmentTemplateQueries.duplicate.useMutation({
    onSuccess: async (newTemplate) => {
      await queryClient.invalidateQueries({
        queryKey: assessmentTemplateQueries.getKey(),
      })
      router.push(`/backoffice/assessment-templates/${newTemplate.id}`)
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : 'Failed to duplicate template'
      alert(message)
    },
  })

  const deleteTemplateMutation = assessmentTemplateQueries.delete.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: assessmentTemplateQueries.getKey(),
      })
      router.push('/backoffice?tab=templates')
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : 'Failed to delete template'
      alert(message)
    },
  })

  useEffect(() => {
    if (!template) {
      setUsageAssessments([])
      setUsageHasMore(false)
      setUsageNextCursor(undefined)
      return
    }

    setUsageAssessments(template.assessments ?? [])
    setUsageHasMore(Boolean(template.assessmentPagination?.hasMore))
    setUsageNextCursor(template.assessmentPagination?.nextCursor ?? undefined)
  }, [template])

  const pageTitle = useMemo(() => {
    if (template?.title) {
      return template.title
    }

    if (isLoading) {
      return 'Loading Template...'
    }

    return 'Template Not Found'
  }, [isLoading, template?.title])

  const breadcrumbItems = useMemo(() => {
    if (template?.title) {
      return [{ label: template.title, isLast: true }]
    }
    return [{ label: 'Template', isLast: true }]
  }, [template?.title])

  const handleDuplicate = () => {
    if (!templateId || duplicateTemplateMutation.isPending) {
      return
    }
    duplicateTemplateMutation.mutate({ id: templateId })
  }

  const handleDelete = () => {
    if (!templateId || deleteTemplateMutation.isPending) {
      return
    }

    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    deleteTemplateMutation.mutate({ id: templateId })
  }

  const handleLoadMoreUsage = useCallback(async () => {
    if (!templateId || !usageNextCursor) {
      return
    }

    setIsLoadingMoreUsage(true)
    try {
      const result = await getAssessmentTemplate({
        id: templateId,
        cursor: usageNextCursor,
        limit: USAGE_PAGE_SIZE,
      })

      const data = successOrThrow(result)
      setUsageAssessments((prev) => [...prev, ...(data.assessments ?? [])])
      setUsageHasMore(Boolean(data.assessmentPagination?.hasMore))
      setUsageNextCursor(data.assessmentPagination?.nextCursor ?? undefined)
    } catch (loadError) {
      // eslint-disable-next-line no-console
      console.error('Error loading more assessments for template usage:', loadError)
      alert('Unable to load more assessments created from this template.')
    } finally {
      setIsLoadingMoreUsage(false)
    }
  }, [templateId, usageNextCursor])

  const showEmptyState = !isLoading && (!template || error)

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title={pageTitle}
        subtitle={
          template
            ? 'View and manage template information'
            : 'Review template details or return to the backoffice'
        }
        breadcrumbItems={breadcrumbItems}
      />

      {template && (
        <BackofficeTemplateActions
          templateId={templateId}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          isDeleting={deleteTemplateMutation.isPending}
          isDuplicating={duplicateTemplateMutation.isPending}
        />
      )}

      {isLoading && (
        <div className="flex justify-center">
          <Loading variant="assessment" />
        </div>
      )}

      {showEmptyState && (
        <BackofficeEmptyState
          title="Template not found"
          message="The template you're looking for doesn't exist."
        />
      )}

      {template && !isLoading && (
        <>
          <AssessmentTemplateDetailsSection template={template} />

          <BackofficeTemplateUsageCard
            usageStats={template.usageStats}
            assessments={usageAssessments}
            hasMore={usageHasMore}
            isLoading={isLoading && usageAssessments.length === 0}
            isFetching={isFetching && usageAssessments.length > 0}
            isLoadingMore={isLoadingMoreUsage}
            onLoadMore={handleLoadMoreUsage}
          />
        </>
      )}
    </div>
  )
}
