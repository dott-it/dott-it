'use client'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import {
  thematicAnalysisProcessingRefetchInterval,
  thematicAnalysisQueries,
} from '@/app/lib/services/thematic-analysis/thematic-analysis.queries'
import { ThematicAnalysisHeader } from './thematic-analysis-header'
import { ThematicAnalysisEmpty } from './thematic-analysis-empty'
import { ThematicAnalysisSkeleton } from './thematic-analysis-skeleton'
import { ThemeAccordion } from './theme-accordion'

interface ThematicAnalysisTabProps {
  assessmentId: string
  hasResponses: boolean
  responsesCount?: number
}

export function ThematicAnalysisTab({
  assessmentId,
  hasResponses,
  responsesCount = 0,
}: ThematicAnalysisTabProps) {
  const queryClient = useQueryClient()
  // Always request display names; server still gates on name salt.
  const includeNames = true

  const {
    data: analysis,
    isLoading,
    isError,
    refetch,
  } = thematicAnalysisQueries.getThematicAnalysis.useQuery({
    variables: { assessmentId, includeNames },
    enabled: hasResponses,
    refetchInterval: (query) =>
      thematicAnalysisProcessingRefetchInterval(query.state.data?.status),
  })

  const invalidateAnalysisQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: thematicAnalysisQueries.getThematicAnalysis.getKey({
        assessmentId,
        includeNames,
      }),
    })
  }

  const { mutate: triggerAnalysis, isPending: isRerunning } =
    thematicAnalysisQueries.triggerAnalysis.useMutation({
      onSuccess: (data) => {
        // Seed cache with the 202 processing payload so poll starts immediately.
        queryClient.setQueryData(
          thematicAnalysisQueries.getThematicAnalysis.getKey({
            assessmentId,
            includeNames,
          }),
          data,
        )
      },
      onError: (error) => {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Please try again.'
        toast.error('Failed to run analysis', { description: message })
      },
      // Always refetch so a timeout/error still enters processing poll if the
      // server accepted the run before the client gave up.
      onSettled: () => {
        invalidateAnalysisQueries()
      },
    })

  const runAnalysis = () =>
    triggerAnalysis({ assessmentId, includeNames })

  const displayResponsesCount =
    analysis?.responsesCount ?? responsesCount

  if (!hasResponses) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ThematicAnalysisEmpty variant="no-responses" />
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <ThematicAnalysisSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (isRerunning || analysis?.status === 'processing') {
    return (
      <Card>
        <CardContent className="pt-6">
          <ThematicAnalysisEmpty variant="generating" />
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-6 pt-6">
          <ThematicAnalysisHeader
            responsesCount={displayResponsesCount}
            onRerun={() => {
              void refetch()
              runAnalysis()
            }}
            isRerunning={isRerunning}
            hasExistingAnalysis={false}
          />
          <ThematicAnalysisEmpty variant="failed" />
        </CardContent>
      </Card>
    )
  }

  if (analysis?.status === 'failed') {
    return (
      <Card>
        <CardContent className="space-y-6 pt-6">
          <ThematicAnalysisHeader
            responsesCount={displayResponsesCount}
            onRerun={runAnalysis}
            isRerunning={isRerunning}
            hasExistingAnalysis={false}
          />
          <ThematicAnalysisEmpty variant="failed" />
        </CardContent>
      </Card>
    )
  }

  if (!analysis || analysis.items.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-6 pt-6">
          <ThematicAnalysisHeader
            responsesCount={displayResponsesCount}
            onRerun={runAnalysis}
            isRerunning={isRerunning}
            hasExistingAnalysis={false}
          />
          <ThematicAnalysisEmpty variant="ready" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <ThematicAnalysisHeader
          responsesCount={displayResponsesCount}
          onRerun={runAnalysis}
          isRerunning={isRerunning}
          hasExistingAnalysis={true}
        />
        <ThemeAccordion
          items={analysis.items}
          assessmentId={assessmentId}
        />
      </CardContent>
    </Card>
  )
}
