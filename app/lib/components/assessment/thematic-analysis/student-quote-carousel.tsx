'use client'

import Link from 'next/link'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'
import type { ThematicAnalysisCitation } from '@/types'
import { getStudentDisplayName } from '@/app/lib/utils/student-display-name'

interface StudentQuoteCarouselProps {
  citations: ThematicAnalysisCitation[]
  assessmentId: string
}

const MAX_QUOTES = 5

function getStudentResponseHref(
  assessmentId: string,
  citation: ThematicAnalysisCitation,
): string | null {
  if (citation.assessmentRecordId) {
    return `/workspace/assessments/${assessmentId}/${citation.assessmentRecordId}`
  }
  return null
}

function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  return trimmed
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
  ]
  let hash = 0
  for (const char of name) {
    hash = (char.codePointAt(0) ?? 0) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function StudentQuoteCarousel({
  citations,
  assessmentId,
}: StudentQuoteCarouselProps) {
  const limitedCitations = citations.slice(0, MAX_QUOTES)

  if (limitedCitations.length === 0) return null

  return (
    <Carousel
      opts={{ align: 'start', loop: false }}
      className="mx-auto w-full max-w-full"
    >
      <CarouselContent className="-ml-2">
        {limitedCitations.map((citation) => {
          const responseHref = getStudentResponseHref(assessmentId, citation)
          const displayName = getStudentDisplayName({
            showRealNames: true,
            learnerName: citation.learnerName,
            learnerId: citation.learnerId,
          })
          const cardClassName =
            'rounded-lg border bg-amber-50/50 p-4 transition-colors hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          const nameClassName =
            'text-sm font-medium text-foreground group-hover:underline'

          const cardInner = (
            <>
              <div className="mb-3 text-sm italic text-foreground/80">
                {citation.highlights.length > 0 ? (
                  <span>&ldquo;{citation.highlights[0]}&rdquo;</span>
                ) : (
                  <span className="text-muted-foreground">No quote available</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${getAvatarColor(displayName)}`}
                >
                  {getInitials(displayName)}
                </div>
                <span className={nameClassName}>{displayName}</span>
              </div>
            </>
          )

          return (
            <CarouselItem
              key={citation.id}
              className="basis-1/2 pl-2"
            >
              {responseHref ? (
                <Link
                  href={responseHref}
                  className={`group block ${cardClassName}`}
                  aria-label={`View full response for ${displayName}`}
                >
                  {cardInner}
                </Link>
              ) : (
                <div className={cardClassName}>{cardInner}</div>
              )}
            </CarouselItem>
          )
        })}
      </CarouselContent>
      {limitedCitations.length > 2 && (
        <>
          <CarouselPrevious className="-left-4" />
          <CarouselNext className="-right-4" />
        </>
      )}
    </Carousel>
  )
}
