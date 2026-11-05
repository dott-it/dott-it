'use client'

import { useMemo } from 'react'
import { Clock, Lightbulb, MessageSquare, ThumbsUp } from 'lucide-react'
import type { AssessmentRecord, FeedbackSection } from '@/types'
import { buildAttemptPreviewCards } from '@/app/lib/assessment/build-attempt-preview-cards'
import { cn } from '@/app/lib/utils/utils'

function normFeedbackType(type: string | undefined): string {
  return String(type ?? '')
    .trim()
    .toLowerCase()
}

function isStrengthFeedback(type: string): boolean {
  return normFeedbackType(type) === 'strength'
}

function isCommentFeedback(type: string): boolean {
  return normFeedbackType(type) === 'comment'
}

function FeedbackTypeIcon({ type }: { type: string }) {
  if (isStrengthFeedback(type)) {
    return <ThumbsUp className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden />
  }
  if (isCommentFeedback(type)) {
    return <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
  }
  return <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
}

function FeedbackBullet({ section }: { section: FeedbackSection }) {
  return (
    <li className="flex gap-2.5">
      <FeedbackTypeIcon type={section.type} />
      <span className="text-sm leading-relaxed text-foreground">{section.content}</span>
    </li>
  )
}

export function AttemptHistoryPreviewSection({ record }: { record: AssessmentRecord }) {
  const attemptRichCards = useMemo(() => buildAttemptPreviewCards(record), [record])

  const legacyTimelineRows = useMemo(() => {
    const events = record.assessmentHistory ?? []
    return events.slice(0, 20).map((ev) => ({
      id: ev.id,
      title: ev.eventType.replaceAll('_', ' '),
      at: new Date(ev.timestamp),
    }))
  }, [record.assessmentHistory])

  if (attemptRichCards.length === 0 && legacyTimelineRows.length === 0) {
    return null
  }

  const countBadge = attemptRichCards.length > 0 ? attemptRichCards.length : legacyTimelineRows.length

  return (
    <section>
      <h4 className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Clock className="size-3.5" aria-hidden />
        Attempt History
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums normal-case text-muted-foreground">
          {countBadge}
        </span>
      </h4>

      {attemptRichCards.length > 0 ? (
        <div className="space-y-6">
          {attemptRichCards.map((attempt) => (
            <article
              key={attempt.studentAnswerId}
              className={cn(
                'rounded-xl border border-border bg-card p-4 shadow-sm',
              )}
            >
              <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  {attempt.isPendingReview
                    ? `Submission ${attempt.attemptNumber} (pending review)`
                    : `Attempt ${attempt.attemptNumber}`}
                </span>
                <time dateTime={attempt.createdAt.toISOString()} className="text-xs text-muted-foreground">
                  {attempt.createdAt.toLocaleString()}
                </time>
              </header>

              <div className="space-y-4">
                {attempt.answers.map((answer, idx) => (
                  <div key={`${attempt.studentAnswerId}-q-${idx}`} className="space-y-2">
                    <p className="text-xs leading-snug text-muted-foreground">
                      {answer.title.replaceAll('\n', ' ').trim()}
                    </p>
                    <div
                      className={cn(
                        'rounded-md border border-border/80 bg-muted/25 py-3 pl-4 pr-3 border-l-[4px]',
                        'border-l-sky-400',
                      )}
                    >
                      <p className="text-sm leading-relaxed text-foreground">{answer.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {attempt.feedbackSections.length > 0 && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Feedback{' '}
                    <span className="tabular-nums font-semibold normal-case text-foreground">
                      ({attempt.feedbackSections.length})
                    </span>
                  </p>
                  <ul className="space-y-2.5">
                    {attempt.feedbackSections.map((s, idx) => (
                      <FeedbackBullet key={s.id ?? `${attempt.studentAnswerId}-fb-${idx}`} section={s} />
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {legacyTimelineRows.map((row) => (
            <li
              key={row.id}
              className="flex justify-between gap-4 rounded-md border border-border bg-muted/20 px-3 py-2"
            >
              <span className="font-medium capitalize">{row.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{row.at.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
