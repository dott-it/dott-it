'use client'

import React, { useMemo } from 'react'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import type { AssessmentRecord, StudentAnswer } from '@/app/types'
import { studentAnswersChronological } from '@/app/lib/assessment/chronological-student-answers'
import { cn } from '@/app/lib/utils/utils'
import { getQuestionLabel, getTitleSuffix } from './student-response-labels'
import { filterAnswersForExport } from '@/app/lib/export/student-answer-filters'
import {
  buildHtmlWithThematicHighlights,
  type ThematicHighlightPhrase,
} from '@/app/lib/utils/thematic-analysis-response-highlights'

interface AnswerBlock {
  title: string
  value: string
  questionLabel: string
  titleSuffix: string
}

function toAnswerBlocks(answers: unknown): AnswerBlock[] {
  const rows = filterAnswersForExport(answers)
  return rows.map((a, index) => ({
    title: a.title,
    value: a.value ?? '',
    questionLabel: getQuestionLabel(a.title, index),
    titleSuffix: getTitleSuffix(a.title),
  }))
}

function formatAttemptDate(date: Date | string): string {
  const d = new Date(date)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${weekday} ${time}`
}

export interface StudentResponseSectionProps {
  record: AssessmentRecord
  showStudentInfo?: boolean
  /** When provided, show this attempt (1-based). Otherwise pick best default (see component logic). */
  attemptIndex?: number
  /** When true, use smaller min-height (e.g. in Past Attempts) so the card does not force a large content area. */
  compact?: boolean
  /** Verbatim phrases from thematic analysis to highlight (orange = need, green = strength). */
  thematicHighlightPhrases?: ThematicHighlightPhrase[]
}

export function StudentResponseSection({
  record,
  showStudentInfo: _showStudentInfo = false,
  attemptIndex: attemptIndexProp,
  compact = false,
  thematicHighlightPhrases,
}: StudentResponseSectionProps) {
  const { attemptLabel, blocks } = useMemo(() => {
    const chronological = studentAnswersChronological(record)
    const total = chronological.length

    const tryAnswer = (sa: StudentAnswer | undefined, attemptNum: number) => {
      if (!sa) return null
      const blocks = toAnswerBlocks(sa.answers)
      if (blocks.length === 0) return null
      return {
        attemptLabel: `Attempt ${attemptNum} of ${total} • ${formatAttemptDate(sa.createdAt)}`,
        blocks,
      }
    }

    if (typeof attemptIndexProp === 'number' && attemptIndexProp >= 1 && attemptIndexProp <= total) {
      const picked = tryAnswer(chronological[attemptIndexProp - 1], attemptIndexProp)
      if (picked) return picked
      return { attemptLabel: null, blocks: [] as AnswerBlock[] }
    }

    // Prefer most recent submission for the main column (aligns with AI templates from latestStudentAnswer).
    const order = new Set<number>()
    const push = (i: number) => {
      if (i >= 0 && i < total) order.add(i)
    }
    for (let i = total - 1; i >= 0; i--) push(i)

    for (const i of order) {
      const picked = tryAnswer(chronological[i], i + 1)
      if (picked) return picked
    }

    return { attemptLabel: null, blocks: [] as AnswerBlock[] }
  }, [record, attemptIndexProp])

  if (attemptLabel && blocks.length > 0) {
    return (
      <Card
        className={cn(
          'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border shadow-sm',
          compact ? 'min-h-[200px]' : 'min-h-0',
        )}
      >
        <div className="flex shrink-0 flex-col justify-start border-b border-border bg-secondary/30 px-6 py-1.5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-2 leading-tight">
            <h2 className="font-serif text-sm font-semibold shrink-0 text-foreground leading-tight">Student Response</h2>
            <span className="text-muted-foreground shrink-0" aria-hidden> · </span>
            <span className="min-w-0 truncate text-sm text-muted-foreground leading-snug" title={attemptLabel}>{attemptLabel}</span>
          </div>
        </div>
        <CardContent
          data-scroll-region="student-response"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-6"
        >
          <div className="space-y-6">
            {blocks.map((block, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="inline-flex shrink-0 items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {block.questionLabel}
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{block.titleSuffix}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/50 p-4">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-foreground [&_mark]:no-underline"
                    dangerouslySetInnerHTML={{
                      __html:
                        thematicHighlightPhrases &&
                        thematicHighlightPhrases.length > 0
                          ? buildHtmlWithThematicHighlights(
                              block.value,
                              thematicHighlightPhrases,
                            )
                          : block.value,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if ((record?.studentAnswers?.length ?? 0) > 0) {
    return (
      <Card
        className={cn(
          'flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border shadow-sm',
          compact ? 'min-h-[200px]' : 'min-h-0',
        )}
      >
        <div className="flex shrink-0 flex-col justify-start border-b border-border bg-secondary/30 px-6 py-1.5">
          <h2 className="font-serif text-sm font-semibold text-foreground leading-tight">Student Response</h2>
        </div>
        <CardContent className="flex min-h-0 flex-1 items-center overflow-y-auto p-6">
          <p className="text-sm text-muted-foreground">
            No graded response text is available for this attempt. Try expanding Past Attempts or check that answers were saved for this submission.
          </p>
        </CardContent>
      </Card>
    )
  }

  return null
}
