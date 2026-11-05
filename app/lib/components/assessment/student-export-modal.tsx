'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquare, FileText, History, ThumbsUp, Lightbulb, FilePlus, X } from 'lucide-react'
import {
  exportAssessmentHistoryToPDF,
  exportAssessmentHistoryToDOC,
  exportSingleStudentRubricToPDF,
} from '@/app/lib/utils/export'
import type { ActiveAssessment, AssessmentRecord, FeedbackSection } from '@/types'
import { filterAnswersForExport } from '@/app/lib/export/student-answer-filters'
import { assessmentRecordsQueries } from '@/app/lib/services/assessment-records/assessment-records.queries'
import { feedbackQueries } from '@/app/lib/services/feedback/feedback.queries'
import { toast } from 'sonner'
import { pickCanonicalPendingFeedback } from '@/app/lib/feedback/resolve-canonical-pending-feedback'
import { cn } from '@/app/lib/utils/utils'
import { AttemptHistoryPreviewSection } from '@/components/ui/assessment-history/attempt-history-preview-section'
import {
  getAttemptHistoryPreviewBadgeCount,
} from '@/app/lib/assessment/build-attempt-preview-cards'
import {
  latestStudentAnswer,
  studentAnswersChronological,
} from '@/app/lib/assessment/chronological-student-answers'

export interface StudentExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentRecord: AssessmentRecord
  assessment: ActiveAssessment
  feedbackCards: FeedbackSection[]
}

type ExportFormat = 'pdf' | 'doc' | 'rubric'

function normType(type: string | undefined): string {
  return String(type ?? '')
    .trim()
    .toLowerCase()
}

function isStrengthType(type: string): boolean {
  return normType(type) === 'strength'
}

function isSuggestionType(type: string): boolean {
  const t = normType(type)
  return t === 'suggestion' || t === 'improvement'
}

function isCommentType(type: string): boolean {
  return normType(type) === 'comment'
}

function answerBadgeLabel(title: string): string {
  const t = title.replaceAll('\n', ' ').trim()
  if (t.length <= 28) return t
  return `${t.slice(0, 25)}…`
}

const checkboxClass =
  'border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground'

export function StudentExportModal({
  open,
  onOpenChange,
  assessmentRecord,
  assessment,
  feedbackCards,
}: StudentExportModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingDOC, setIsExportingDOC] = useState(false)
  const [isExportingRubric, setIsExportingRubric] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')

  const [includeStudentInfo, setIncludeStudentInfo] = useState(true)
  const [includeAssessmentInfo, setIncludeAssessmentInfo] = useState(true)
  const [includeStudentResponse, setIncludeStudentResponse] = useState(true)
  const [includeAttemptHistory, setIncludeAttemptHistory] = useState(true)
  const [includeStrengths, setIncludeStrengths] = useState(true)
  const [includeSuggestions, setIncludeSuggestions] = useState(true)
  const [includeComments, setIncludeComments] = useState(true)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const updateFeedbackMutation = feedbackQueries.updateFeedback.useMutation()
  const updateAssessmentMutation = assessmentRecordsQueries.updateAssessmentRecord.useMutation({
    onSuccess: () => {
      toast.success('Success! Feedback shared!', {
        description: `Assessment history for ${assessmentRecord.learnerName} has been exported and shared.`,
        duration: 4000,
      })
      globalThis.location.reload()
    },
  })

  const filteredStudentAnswers = useMemo(() => {
    const lastAnswerSet = latestStudentAnswer(assessmentRecord)
    if (!lastAnswerSet) return []
    return filterAnswersForExport(lastAnswerSet.answers)
  }, [assessmentRecord])

  const submissionCount = useMemo(
    () => studentAnswersChronological(assessmentRecord).length,
    [assessmentRecord],
  )
  const attemptHistoryBadgeCount = useMemo(
    () => getAttemptHistoryPreviewBadgeCount(assessmentRecord),
    [assessmentRecord],
  )

  const strengthCount = useMemo(
    () => feedbackCards.filter((c) => isStrengthType(c.type)).length,
    [feedbackCards],
  )
  const suggestionCount = useMemo(
    () => feedbackCards.filter((c) => isSuggestionType(c.type)).length,
    [feedbackCards],
  )
  const commentCount = useMemo(
    () => feedbackCards.filter((c) => isCommentType(c.type)).length,
    [feedbackCards],
  )

  useEffect(() => {
    if (commentCount === 0) setIncludeComments(false)
  }, [commentCount])

  const exportableFeedbackCards = useMemo(() => {
    if (!includeStudentResponse) return []
    return feedbackCards.filter((card) => {
      if (isStrengthType(card.type)) return includeStrengths
      if (isSuggestionType(card.type)) return includeSuggestions
      if (isCommentType(card.type)) return includeComments
      return false
    })
  }, [
    feedbackCards,
    includeStudentResponse,
    includeStrengths,
    includeSuggestions,
    includeComments,
  ])

  const answersForPreview = useMemo(() => {
    if (!includeStudentResponse) return []
    return filteredStudentAnswers
  }, [includeStudentResponse, filteredStudentAnswers])

  const responseBlockCount = filteredStudentAnswers.length

  const strengthsPreview = useMemo(
    () => exportableFeedbackCards.filter((c) => isStrengthType(c.type)),
    [exportableFeedbackCards],
  )
  const suggestionsPreview = useMemo(
    () => exportableFeedbackCards.filter((c) => isSuggestionType(c.type)),
    [exportableFeedbackCards],
  )
  const commentsPreview = useMemo(
    () => exportableFeedbackCards.filter((c) => isCommentType(c.type)),
    [exportableFeedbackCards],
  )

  const selectedFeedbackItemCount = useMemo(() => {
    if (!includeStudentResponse) return 0
    let n = 0
    if (includeStrengths) n += strengthCount
    if (includeSuggestions) n += suggestionCount
    if (includeComments) n += commentCount
    return n
  }, [
    includeStudentResponse,
    includeStrengths,
    includeSuggestions,
    includeComments,
    strengthCount,
    suggestionCount,
    commentCount,
  ])

  const hasHistoryExportableContent = useMemo(() => {
    if (includeStudentInfo && assessmentRecord.learnerName) return true
    if (includeAssessmentInfo && assessment.title) return true
    if (answersForPreview.length > 0 || exportableFeedbackCards.length > 0) return true
    return false
  }, [
    includeStudentInfo,
    includeAssessmentInfo,
    assessmentRecord.learnerName,
    assessment.title,
    answersForPreview.length,
    exportableFeedbackCards.length,
  ])

  const isBusy = isExportingPDF || isExportingDOC || isExportingRubric

  const applyPostExportUpdates = async () => {
    const pendingFeedback = pickCanonicalPendingFeedback(assessmentRecord.feedbacks)
    if (pendingFeedback) {
      try {
        await updateFeedbackMutation.mutateAsync({
          id: pendingFeedback.id,
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        })
      } catch {
        // Continue with assessment record update
      }
    }
    try {
      await updateAssessmentMutation.mutateAsync({
        id: assessmentRecord.id,
        data: { status: 'shared' },
      })
    } catch {
      // Mutation onSuccess handles toast when update succeeds
    }
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      await exportAssessmentHistoryToPDF(assessmentRecord, assessment)
      await applyPostExportUpdates()
    } catch {
      toast.error('Export failed', {
        description: 'There was an error exporting the assessment history. Please try again.',
        duration: 4000,
      })
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportDOC = async () => {
    setIsExportingDOC(true)
    try {
      await exportAssessmentHistoryToDOC(assessmentRecord, assessment)
      await applyPostExportUpdates()
    } catch {
      toast.error('Export failed', {
        description: 'There was an error exporting the assessment history. Please try again.',
        duration: 4000,
      })
    } finally {
      setIsExportingDOC(false)
    }
  }

  const handleExportRubric = async () => {
    setIsExportingRubric(true)
    try {
      await exportSingleStudentRubricToPDF(assessmentRecord, assessment)
    } catch {
      toast.error('Export failed', {
        description: 'There was an error exporting the rubric. Please try again.',
        duration: 4000,
      })
    } finally {
      setIsExportingRubric(false)
    }
  }

  const handlePrimaryExport = () => {
    if (exportFormat === 'pdf') void handleExportPDF()
    else if (exportFormat === 'doc') void handleExportDOC()
    else void handleExportRubric()
  }

  const exportActionLabel = (() => {
    if (isBusy) {
      if (isExportingPDF) return 'Exporting…'
      if (isExportingDOC) return 'Exporting…'
      if (isExportingRubric) return 'Exporting…'
    }
    if (exportFormat === 'pdf') return 'Export as PDF'
    if (exportFormat === 'doc') return 'Export as DOC'
    return 'Export Rubric as PDF'
  })()

  const exportDisabled =
    isBusy ||
    (exportFormat === 'rubric' ? false : !hasHistoryExportableContent)

  const completedRoundsLabel =
    submissionCount > 0
      ? `${submissionCount} ${submissionCount === 1 ? 'submission' : 'submissions'}`
      : '—'

  if (!open || !mounted) return null

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[10000] min-h-dvh bg-black/80 backdrop-blur-sm"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 z-[10001] flex min-h-dvh items-center justify-center overflow-y-auto p-3 sm:p-4">
        <div
          className="relative flex h-[min(90vh,880px)] w-[min(96vw,1120px)] max-w-none flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-export-preview-title"
      >
        <header className="relative shrink-0 border-b border-border px-6 pb-4 pt-6 pr-14">
          <div className="text-left">
            <h2
              id="student-export-preview-title"
              className="font-serif text-2xl font-semibold tracking-tight text-foreground"
            >
              Export Preview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Review and customize your export</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col divide-y divide-border lg:flex-row lg:divide-x lg:divide-y-0">
          <aside className="flex max-h-[min(40vh,360px)] shrink-0 flex-col gap-8 overflow-y-auto bg-[#F9FAFB] p-6 lg:max-h-none lg:w-[min(100%,320px)] lg:max-w-[35%]">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
                Include Sections
              </h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={includeStudentInfo}
                    onCheckedChange={(v) => setIncludeStudentInfo(v === true)}
                    className={checkboxClass}
                  />
                  <span className="text-sm font-medium">Student Info</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={includeAssessmentInfo}
                    onCheckedChange={(v) => setIncludeAssessmentInfo(v === true)}
                    className={checkboxClass}
                  />
                  <span className="text-sm font-medium">Assessment Info</span>
                </label>

                <div>
                  <label className="flex cursor-pointer items-center gap-3">
                    <Checkbox
                      checked={includeStudentResponse}
                      onCheckedChange={(v) => setIncludeStudentResponse(v === true)}
                      className={checkboxClass}
                    />
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">Student Response</span>
                    <span
                      className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground"
                      title="Number of question blocks in the latest submission (not submission count)"
                    >
                      {responseBlockCount} Qs
                    </span>
                  </label>
                  <div
                    className={cn(
                      'mt-2 space-y-2 border-l border-border pl-6',
                      !includeStudentResponse && 'pointer-events-none opacity-50',
                    )}
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={includeStrengths}
                        disabled={!includeStudentResponse}
                        onCheckedChange={(v) => setIncludeStrengths(v === true)}
                        className={checkboxClass}
                      />
                      <ThumbsUp className="size-4 shrink-0 text-green-600" />
                      <span className="flex-1 text-sm">Strengths</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                        {strengthCount}
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={includeSuggestions}
                        disabled={!includeStudentResponse}
                        onCheckedChange={(v) => setIncludeSuggestions(v === true)}
                        className={checkboxClass}
                      />
                      <Lightbulb className="size-4 shrink-0 text-amber-500" />
                      <span className="flex-1 text-sm">Suggestions</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                        {suggestionCount}
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={includeComments}
                        disabled={!includeStudentResponse || commentCount === 0}
                        onCheckedChange={(v) => setIncludeComments(v === true)}
                        className={checkboxClass}
                      />
                      <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm">Comments</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                        {commentCount}
                      </span>
                    </label>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={includeAttemptHistory}
                    onCheckedChange={(v) => setIncludeAttemptHistory(v === true)}
                    className={checkboxClass}
                  />
                  <History className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">Attempt History</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {attemptHistoryBadgeCount}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
                Export Format
              </h3>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={cn(
                    'w-full rounded-lg border p-4 text-left transition-colors',
                    exportFormat === 'pdf'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background hover:bg-muted/60',
                  )}
                >
                  <div className="text-sm font-semibold">PDF</div>
                  <div
                    className={cn(
                      'mt-0.5 text-xs',
                      exportFormat === 'pdf' ? 'text-primary-foreground/90' : 'text-muted-foreground',
                    )}
                  >
                    Best for sharing
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('doc')}
                  className={cn(
                    'w-full rounded-lg border p-4 text-left transition-colors',
                    exportFormat === 'doc'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background hover:bg-muted/60',
                  )}
                >
                  <div className="text-sm font-semibold">DOC</div>
                  <div
                    className={cn(
                      'mt-0.5 text-xs',
                      exportFormat === 'doc' ? 'text-primary-foreground/90' : 'text-muted-foreground',
                    )}
                  >
                    Editable document
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('rubric')}
                  className={cn(
                    'w-full rounded-lg border p-4 text-left transition-colors',
                    exportFormat === 'rubric'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background hover:bg-muted/60',
                  )}
                >
                  <div className="text-sm font-semibold">Rubric PDF</div>
                  <div
                    className={cn(
                      'mt-0.5 text-xs',
                      exportFormat === 'rubric' ? 'text-primary-foreground/90' : 'text-muted-foreground',
                    )}
                  >
                    Rubric evaluation only
                  </div>
                </button>
              </div>
            </div>
          </aside>

          <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30 p-6">
            <div className="mx-auto max-w-2xl space-y-8 rounded-lg border border-border bg-background p-8 shadow-sm">
              {includeStudentInfo && (
                <section>
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Student Information
                  </h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{assessmentRecord.learnerName || '—'}</dd>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <dt className="text-muted-foreground">Submissions</dt>
                      <dd className="font-medium">{submissionCount}</dd>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <dt className="text-muted-foreground">Completed feedback rounds</dt>
                      <dd className="font-medium">{completedRoundsLabel}</dd>
                    </div>
                    {assessmentRecord.submittedAt && (
                      <div className="flex flex-wrap gap-2">
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd className="font-medium">
                          {new Date(assessmentRecord.submittedAt).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {includeAssessmentInfo && (
                <section>
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Assessment Information
                  </h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <dt className="text-muted-foreground">Title</dt>
                      <dd className="font-medium">{assessment.title}</dd>
                    </div>
                    {assessment.unitName && (
                      <div className="flex flex-wrap gap-2">
                        <dt className="text-muted-foreground">Unit</dt>
                        <dd className="font-medium">{assessment.unitName}</dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {includeStudentResponse && (
                <>
                  <section>
                    <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <FileText className="size-3.5" />
                      Student Response
                      <span
                        className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums normal-case text-muted-foreground"
                        title="Question blocks in the latest submission"
                      >
                        {responseBlockCount} Qs
                      </span>
                    </h4>
                    <div className="space-y-4">
                      {answersForPreview.map((answer, idx) => (
                        <div
                          key={`${answer.questionId ?? 'q'}-${idx}`}
                          className="rounded-lg border border-border bg-card p-4 shadow-sm"
                        >
                          <span className="mb-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {answerBadgeLabel(answer.title)}
                          </span>
                          <p className="mb-2 text-sm font-semibold leading-snug">{answer.title}</p>
                          <div className="border-l-4 border-primary pl-4 text-sm leading-relaxed text-foreground">
                            {answer.value}
                          </div>
                        </div>
                      ))}
                      {answersForPreview.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No student responses in this preview.
                        </p>
                      )}
                    </div>
                  </section>

                  {includeStrengths && strengthsPreview.length > 0 && (
                    <section>
                      <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <ThumbsUp className="size-3.5 text-green-600" />
                        Strengths
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums normal-case text-muted-foreground">
                          {strengthsPreview.length}
                        </span>
                      </h4>
                      <div className="space-y-3">
                        {strengthsPreview.map((card, idx) => (
                          <div
                            key={card.id ?? `s-${idx}`}
                            className="rounded-lg border border-green-200 bg-green-50/80 p-3 text-sm"
                          >
                            <p className="mb-1 text-xs font-semibold text-green-800">
                              {idx + 1}. {String(card.type).toUpperCase()}
                            </p>
                            {card.section ? (
                              <p className="mb-1 text-xs font-medium text-muted-foreground">{card.section}</p>
                            ) : null}
                            <p className="leading-relaxed text-foreground">{card.content}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {includeSuggestions && suggestionsPreview.length > 0 && (
                    <section>
                      <h4 className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Lightbulb className="size-3.5 shrink-0 text-amber-500" />
                        <span>Suggestions for improvement</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums normal-case text-muted-foreground">
                          {suggestionsPreview.length}
                        </span>
                      </h4>
                      <div className="space-y-3">
                        {suggestionsPreview.map((card, idx) => (
                          <div
                            key={card.id ?? `g-${idx}`}
                            className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm"
                          >
                            <p className="mb-1 text-xs font-semibold text-amber-900">
                              {idx + 1}. {String(card.type).toUpperCase()}
                            </p>
                            {card.section ? (
                              <p className="mb-1 text-xs font-medium text-muted-foreground">{card.section}</p>
                            ) : null}
                            <p className="leading-relaxed text-foreground">{card.content}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {includeComments && commentsPreview.length > 0 && (
                    <section>
                      <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <MessageSquare className="size-3.5 text-muted-foreground" />
                        Comments
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums normal-case text-muted-foreground">
                          {commentsPreview.length}
                        </span>
                      </h4>
                      <div className="space-y-3">
                        {commentsPreview.map((card, idx) => (
                          <div
                            key={card.id ?? `c-${idx}`}
                            className="rounded-lg border border-border bg-muted/40 p-3 text-sm"
                          >
                            <p className="mb-1 text-xs font-semibold text-muted-foreground">
                              {idx + 1}. COMMENT
                            </p>
                            {card.section ? (
                              <p className="mb-1 text-xs font-medium text-muted-foreground">{card.section}</p>
                            ) : null}
                            <p className="leading-relaxed text-foreground">{card.content}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {includeAttemptHistory && (
                <AttemptHistoryPreviewSection record={assessmentRecord} />
              )}
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-border bg-background px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedFeedbackItemCount} feedback {selectedFeedbackItemCount === 1 ? 'item' : 'items'}{' '}
              selected
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={exportDisabled}
                onClick={handlePrimaryExport}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <FilePlus className="size-4" />
                {exportActionLabel}
              </Button>
            </div>
          </div>
        </footer>
        </div>
      </div>
    </>,
    document.body,
  )
}
