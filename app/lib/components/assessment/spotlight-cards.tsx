'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import {
  Card,
  CardDescription,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  thematicAnalysisProcessingRefetchInterval,
  thematicAnalysisQueries,
} from '@/app/lib/services/thematic-analysis/thematic-analysis.queries'
import { spotlightQueries } from '@/app/lib/services/spotlight/spotlight.queries'
import type { SpotlightCard as SpotlightCardData } from '@/types'
import { cn } from '@/app/lib/utils/utils'

function formatHoursLabel(hours: string[]): string | null {
  if (hours.length === 0) return null
  return hours.join(', ')
}

function SpotlightAnalysisStatus({
  status,
  isWaitingForStart,
}: {
  status: SpotlightCardData['thematicStatus'] | string | null | undefined
  isWaitingForStart: boolean
}) {
  if (status === 'processing' || isWaitingForStart) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="spotlight-status-running">
        Thematic analysis running…
      </p>
    )
  }

  if (status === 'completed') {
    return (
      <p className="text-sm text-muted-foreground" data-testid="spotlight-status-ready">
        Analysis ready
      </p>
    )
  }

  return (
    <p className="text-sm text-muted-foreground" data-testid="spotlight-status-available">
      Analysis Available
    </p>
  )
}

function SpotlightCardItem({ card }: { card: SpotlightCardData }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [forcePoll, setForcePoll] = useState(false)
  const hoursLabel = formatHoursLabel(card.hours)

  const shouldPoll = forcePoll || card.thematicStatus === 'processing'
  const { data: analysis } = thematicAnalysisQueries.getThematicAnalysis.useQuery({
    variables: { assessmentId: card.assessmentId },
    enabled: shouldPoll,
    refetchInterval: (query) =>
      thematicAnalysisProcessingRefetchInterval(query.state.data?.status),
  })

  const liveStatus = analysis?.status ?? card.thematicStatus
  const analysisComplete = liveStatus === 'completed'

  const { mutate: dismiss, isPending: isDismissing } =
    spotlightQueries.dismissSpotlight.useMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: spotlightQueries.getSpotlightCards.getKey(),
        })
      },
      onError: (error) => {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Please try again.'
        toast.error('Failed to dismiss spotlight', { description: message })
      },
    })

  const { mutate: triggerAnalysis, isPending: isAnalyzing } =
    thematicAnalysisQueries.triggerAnalysis.useMutation({
      onSuccess: (data) => {
        setForcePoll(true)
        queryClient.setQueryData(
          thematicAnalysisQueries.getThematicAnalysis.getKey({
            assessmentId: card.assessmentId,
          }),
          data,
        )
        void queryClient.invalidateQueries({
          queryKey: spotlightQueries.getSpotlightCards.getKey(),
        })
      },
      onError: (error) => {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Please try again.'
        toast.error('Failed to run analysis', { description: message })
      },
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: thematicAnalysisQueries.getThematicAnalysis.getKey({
            assessmentId: card.assessmentId,
          }),
        })
        void queryClient.invalidateQueries({
          queryKey: spotlightQueries.getSpotlightCards.getKey(),
        })
      },
    })

  const analysisBusy =
    isAnalyzing || liveStatus === 'processing'

  return (
    <Card
      className="relative"
      data-testid="spotlight-card"
      data-assessment-id={card.assessmentId}
    >
      <button
        type="button"
        aria-label={`Dismiss spotlight for ${card.title}`}
        className={cn(
          'absolute right-3 top-3 rounded-md p-1 text-muted-foreground',
          'hover:bg-muted hover:text-foreground',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
        disabled={isDismissing}
        onClick={() => dismiss({ assessmentId: card.assessmentId })}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-4 p-6 pr-12">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <CardTitle className="line-clamp-2 text-base font-semibold">
              {card.title}
            </CardTitle>
            <CardDescription className="mt-1 space-y-1">
              {hoursLabel ? (
                <span className="block" data-testid="spotlight-hours">
                  {hoursLabel}
                </span>
              ) : null}
              <span className="block" data-testid="spotlight-responses">
                {card.studentResponsesCount} responses
              </span>
            </CardDescription>
          </div>
          <SpotlightAnalysisStatus
            status={liveStatus}
            isWaitingForStart={Boolean(forcePoll || isAnalyzing) && !analysis}
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button.OutlineSmall
            type="button"
            onClick={() =>
              router.push(`/workspace/assessments/${card.assessmentId}`)
            }
          >
            Review
          </Button.OutlineSmall>
          {analysisComplete ? null : (
            <Button.PrimarySmall
              type="button"
              disabled={analysisBusy}
              onClick={() => triggerAnalysis({ assessmentId: card.assessmentId })}
            >
              {analysisBusy ? 'Analyzing…' : 'Analyze'}
            </Button.PrimarySmall>
          )}
        </div>
      </div>
    </Card>
  )
}

export function SpotlightCards({ cards }: { cards: SpotlightCardData[] }) {
  if (cards.length === 0) return null

  return (
    <section className="space-y-3" data-testid="spotlight-section">
      <div className="flex flex-col gap-3">
        {cards.map((card) => (
          <SpotlightCardItem key={card.assessmentId} card={card} />
        ))}
      </div>
    </section>
  )
}
