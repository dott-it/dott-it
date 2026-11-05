'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { StudentQuoteCarousel } from './student-quote-carousel'
import type { ThematicAnalysisCitation } from '@/types'

interface CitationItemProps {
  citation: ThematicAnalysisCitation
  assessmentId: string
}

export function CitationItem({
  citation,
  assessmentId,
}: CitationItemProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{citation.annotation}</p>
      {citation.highlights.length > 0 && (
        <div className="mt-3">
          <StudentQuoteCarousel
            citations={[citation]}
            assessmentId={assessmentId}
          />
        </div>
      )}
    </div>
  )
}

interface CitationListProps {
  citations: ThematicAnalysisCitation[]
  assessmentId: string
  title: string
  description: string
  itemId: string
}

export function ExpandableCitationItem({
  citations,
  assessmentId,
  title,
  description,
  itemId,
}: CitationListProps) {
  if (citations.length === 0) {
    return (
      <div className="rounded-lg border px-4 py-3">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    )
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={itemId} className="rounded-lg border px-4">
        <AccordionTrigger className="hover:no-underline">
          <div className="text-left">
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-0.5 text-sm font-normal text-muted-foreground">
              {description}
            </p>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pb-2">
            <StudentQuoteCarousel
              citations={citations}
              assessmentId={assessmentId}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
