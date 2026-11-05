'use client'

import React, { useMemo, useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import type { AssessmentRecord } from '@/app/types'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { getPastAttemptsDisplayList } from '@/app/lib/assessment/past-attempts'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { FeedbackCardsMessage } from './feedback-cards-message'
import { StudentResponseSection } from './student-response-section'
import type { ThematicHighlightPhrase } from '@/app/lib/utils/thematic-analysis-response-highlights'
function formatPastAttemptDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export interface PastAttemptsSectionProps {
  record: AssessmentRecord
  onSelectAttempt?: (attemptIndex: number) => void
  /** After share/export: archive is read-only; label belongs here, not on the main Feedback column. */
  showViewOnlyLabel?: boolean
  thematicHighlightPhrases?: ThematicHighlightPhrase[]
}

export function PastAttemptsSection({
  record,
  onSelectAttempt,
  showViewOnlyLabel = false,
  thematicHighlightPhrases,
}: PastAttemptsSectionProps) {
  const [open, setOpen] = useState(true)

  const pastAttempts = useMemo(() => getPastAttemptsDisplayList(record), [record])

  const [expandedAttemptNumber, setExpandedAttemptNumber] = useState<number | null>(null)

  const handleAttemptClick = (attemptNumber: number) => {
    setExpandedAttemptNumber((prev) => (prev === attemptNumber ? null : attemptNumber))
    onSelectAttempt?.(attemptNumber)
  }

  return (
    <section className="mx-auto max-w-7xl rounded-xl border border-border bg-card shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 p-6 text-left transition-colors hover:bg-secondary/30"
            aria-expanded={open}
            aria-controls="past-attempts-content"
            id="past-attempts-trigger"
          >
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Past Attempts</span>
            {showViewOnlyLabel ? (
              <span className="text-xs font-normal text-muted-foreground">· View only.</span>
            ) : null}
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180"
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent id="past-attempts-content" aria-labelledby="past-attempts-trigger" forceMount className="data-[state=closed]:hidden">
          <div className="border-t border-border px-6 pb-6 pt-2">
            <div className="space-y-2">
              {pastAttempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past attempts yet.</p>
              ) : (
                <div className="space-y-2">
                  {pastAttempts.map((attempt, index) => (
                    <div
                      key={index}
                      className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                        onClick={() => handleAttemptClick(attempt.attemptNumber)}
                        aria-expanded={expandedAttemptNumber === attempt.attemptNumber}
                      >
                        <span className="font-medium text-foreground">
                          Attempt {attempt.attemptNumber}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          — {formatPastAttemptDate(attempt.dateLabel)}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {attempt.count} feedback items
                        </span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expandedAttemptNumber === attempt.attemptNumber ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </button>
                      {expandedAttemptNumber === attempt.attemptNumber && (
                        <div className="border-t border-border bg-muted/20 px-4 py-4">
                          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
                            {/* Left: Student Response */}
                            <div className="min-w-0">
                              <StudentResponseSection
                                record={record}
                                attemptIndex={attempt.attemptNumber}
                                compact
                                thematicHighlightPhrases={thematicHighlightPhrases}
                              />
                            </div>
                            {/* Right: Feedback Submitted */}
                            <Card className="flex min-h-[200px] w-full flex-col overflow-hidden rounded-xl border border-border shadow-sm">
                              <div className="flex min-h-0 flex-row flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/30 px-6 py-1.5">
                                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
                                  <h2 className="font-serif text-sm font-semibold text-foreground leading-tight">
                                    Feedback Submitted
                                  </h2>
                                  <span className="text-muted-foreground" aria-hidden> · </span>
                                  <span className="text-sm text-muted-foreground leading-snug">
                                    {formatPastAttemptDate(attempt.dateLabel)} · {attempt.count} feedback{' '}
                                    {attempt.count === 1 ? 'item' : 'items'}
                                  </span>
                                </div>
                              </div>
                              <CardContent className="min-h-0 flex-1 p-6">
                                {attempt.feedbackSections.length > 0 ? (
                                  <FeedbackCardsMessage
                                    key={attempt.attemptNumber}
                                    feedbackCards={attempt.feedbackSections}
                                  />
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No feedback items for this attempt.
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}
