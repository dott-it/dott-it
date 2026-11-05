'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MessageSquare, FileText, History, ThumbsUp, Lightbulb, FilePlus } from 'lucide-react'
import { cn } from '@/app/lib/utils/utils'
import {
  exportFeedbackToPDF,
  exportFeedbackToDOC,
} from '@/app/lib/utils/export'
import type { FeedbackExportLayoutOptions } from '@/app/lib/utils/export/pdf/feedback-pdf'
import { toast } from 'sonner'
import { FeedbackSection, CreateFeedbackSectionData } from '@/app/types/api/feedback-section'
import { AssessmentRecord } from '@/app/types'
import { filterAnswersForExport } from '@/app/lib/export/student-answer-filters'
import { assessmentRecordsQueries } from '@/app/lib/services/assessment-records/assessment-records.queries'
import { feedbackQueries } from '@/app/lib/services/feedback/feedback.queries'
import { pickCanonicalPendingFeedback } from '@/app/lib/feedback/resolve-canonical-pending-feedback'
import { AttemptHistoryPreviewSection } from '@/components/ui/assessment-history/attempt-history-preview-section'
import { studentAnswersChronological } from '@/app/lib/assessment/chronological-student-answers'

interface Assessment {
  id: string
  title: string
  unitName?: string
  dueDate?: Date
}

interface FeedbackPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedbackCards: FeedbackSection[]
  studentRecord: AssessmentRecord
  assessment: Assessment
  onReorderCards: (newOrder: FeedbackSection[]) => void
  onAddFeedback: (feedbackSection: CreateFeedbackSectionData) => void
  onDeleteFeedback: (id: string) => void
}

type ExportFormat = 'pdf' | 'doc'

function isStrengthType(type: string): boolean {
  return type === 'strength'
}

function isSuggestionType(type: string): boolean {
  return type === 'suggestion' || type === 'improvement'
}

function isCommentType(type: string): boolean {
  return type === 'comment'
}

function answerBadgeLabel(title: string): string {
  const t = title.replaceAll('\n', ' ').trim()
  if (t.length <= 28) return t
  return `${t.slice(0, 25)}…`
}

export function FeedbackPreviewModal({
  open,
  onOpenChange,
  feedbackCards,
  studentRecord,
  assessment,
  onReorderCards: _onReorderCards,
  onAddFeedback: _onAddFeedback,
  onDeleteFeedback: _onDeleteFeedback,
}: FeedbackPreviewModalProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingDOC, setIsExportingDOC] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')

  const [includeStudentInfo, setIncludeStudentInfo] = useState(true)
  const [includeAssessmentInfo, setIncludeAssessmentInfo] = useState(true)
  const [includeStudentResponse, setIncludeStudentResponse] = useState(true)
  const [includeAttemptHistory, setIncludeAttemptHistory] = useState(true)
  const [includeStrengths, setIncludeStrengths] = useState(true)
  const [includeSuggestions, setIncludeSuggestions] = useState(true)
  const [includeComments, setIncludeComments] = useState(true)

  const updateAssessmentMutation = assessmentRecordsQueries.updateAssessmentRecord.useMutation({
    onSuccess: () => {
      globalThis.location.reload()
    },
  })

  const updateFeedbackMutation = feedbackQueries.updateFeedback.useMutation()

  const filteredStudentAnswers = useMemo(() => {
    const lastAnswerSet = studentRecord?.studentAnswers?.at(-1)
    if (!lastAnswerSet) return []
    return filterAnswersForExport(lastAnswerSet.answers)
  }, [studentRecord])

  const submissionCount = useMemo(
    () => (studentRecord ? studentAnswersChronological(studentRecord).length : 0),
    [studentRecord],
  )
  const historyEvents = studentRecord.assessmentHistory ?? []

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

  const exportLayout: FeedbackExportLayoutOptions = useMemo(
    () => ({
      includeStudentHeader: includeStudentInfo,
      includeAssessmentDetails: includeAssessmentInfo,
    }),
    [includeStudentInfo, includeAssessmentInfo],
  )

  const responseBlockCount = filteredStudentAnswers.length

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

  const answersForExport = useMemo(() => {
    if (!includeStudentResponse) return []
    return filteredStudentAnswers
  }, [includeStudentResponse, filteredStudentAnswers])

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

  /** Sections that are written to PDF/DOC (attempt history is preview-only until export supports it). */
  const hasExportableContent = useMemo(() => {
    if (includeStudentInfo && studentRecord.learnerName) return true
    if (includeAssessmentInfo && assessment.title) return true
    if (answersForExport.length > 0 || exportableFeedbackCards.length > 0) return true
    return false
  }, [
    includeStudentInfo,
    includeAssessmentInfo,
    studentRecord.learnerName,
    assessment.title,
    answersForExport.length,
    exportableFeedbackCards.length,
  ])

  const runPostExportUpdates = async () => {
    const pendingFeedback = pickCanonicalPendingFeedback(studentRecord.feedbacks)
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
        id: studentRecord.id,
        data: { status: 'shared' },
      })
    } catch {
      // Success toast still shown for export
    }
  }

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      await exportFeedbackToPDF(
        exportableFeedbackCards,
        studentRecord,
        assessment,
        answersForExport,
        exportLayout,
      )
      await runPostExportUpdates()
      toast.success('Success! Feedback shared!', {
        description: `Feedback for ${studentRecord.learnerName} has been exported and shared.`,
        duration: 4000,
      })
      onOpenChange(false)
    } catch {
      toast.error('Export failed', {
        description: 'There was an error exporting the feedback. Please try again.',
        duration: 4000,
      })
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportDOC = async () => {
    setIsExportingDOC(true)
    try {
      await exportFeedbackToDOC(
        exportableFeedbackCards,
        studentRecord,
        assessment,
        answersForExport,
        exportLayout,
      )
      await runPostExportUpdates()
      toast.success('Success! Feedback shared!', {
        description: `Feedback for ${studentRecord.learnerName} has been exported and shared.`,
        duration: 4000,
      })
      onOpenChange(false)
    } catch {
      toast.error('Export failed', {
        description: 'There was an error exporting the feedback. Please try again.',
        duration: 4000,
      })
    } finally {
      setIsExportingDOC(false)
    }
  }

  const handlePrimaryExport = () => {
    if (exportFormat === 'pdf') void handleExportPDF()
    else void handleExportDOC()
  }

  const isExporting = isExportingPDF || isExportingDOC
  const exportDisabled = isExporting || !hasExportableContent

  const exportActionLabel = (() => {
    if (isExporting) return 'Exporting…'
    if (exportFormat === 'pdf') return 'Export as PDF'
    return 'Export as DOC'
  })()

  const attemptLabel =
    submissionCount > 0
      ? `${submissionCount}${submissionCount === 1 ? ' submission' : ' submissions'}`
      : '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[min(90vh,880px)] w-[min(96vw,1120px)] max-w-none translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden p-0 sm:rounded-lg',
        )}
      >
        <div className="shrink-0 border-b border-border px-6 pb-4 pt-6 pr-14">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Export Preview
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Review and customize your export
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex min-h-0 flex-1 flex-col divide-y divide-border lg:flex-row lg:divide-x lg:divide-y-0">
          {/* Sidebar */}
          <aside className="flex max-h-[min(40vh,360px)] shrink-0 flex-col gap-8 overflow-y-auto bg-muted/40 p-6 lg:max-h-none lg:w-[min(100%,320px)] lg:max-w-[35%]">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
                Include Sections
              </h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={includeStudentInfo}
                    onCheckedChange={(v) => setIncludeStudentInfo(v === true)}
                    className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <span className="text-sm font-medium">Student Info</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <Checkbox
                    checked={includeAssessmentInfo}
                    onCheckedChange={(v) => setIncludeAssessmentInfo(v === true)}
                    className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <span className="text-sm font-medium">Assessment Info</span>
                </label>

                <div>
                  <label className="flex cursor-pointer items-center gap-3">
                    <Checkbox
                      checked={includeStudentResponse}
                      onCheckedChange={(v) => setIncludeStudentResponse(v === true)}
                      className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium">Student Response</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                      {responseBlockCount}
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
                        className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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
                        className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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
                        className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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
                    className="border-primary data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <History className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">Attempt History</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {historyEvents.length > 0 ? historyEvents.length : submissionCount}
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
              </div>
            </div>
          </aside>

          {/* Preview */}
          <div className="min-w-0 flex-1 overflow-y-auto bg-muted/30 p-6">
            <div className="mx-auto max-w-2xl space-y-8 rounded-lg border border-border bg-background p-8 shadow-sm">
              {includeStudentInfo && (
                <section>
                  <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Student Information
                  </h4>
                  <dl className="space-y-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Name</dt>
                      <dd className="font-medium">{studentRecord.learnerName}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Attempt</dt>
                      <dd className="font-medium">{attemptLabel}</dd>
                    </div>
                    {studentRecord.submittedAt && (
                      <div className="flex gap-2">
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd className="font-medium">
                          {new Date(studentRecord.submittedAt).toLocaleString()}
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
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Title</dt>
                      <dd className="font-medium">{assessment.title}</dd>
                    </div>
                  </dl>
                </section>
              )}

              {includeStudentResponse && (
                <section>
                  <h4 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="size-3.5" />
                    Student Response
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums normal-case text-muted-foreground">
                      {responseBlockCount}
                    </span>
                  </h4>
                  <div className="space-y-4">
                    {filteredStudentAnswers.map((answer, idx) => (
                      <div
                        key={`${answer.questionId}-${idx}`}
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
                    {exportableFeedbackCards.length > 0 && (
                      <div className="space-y-3 pt-2">
                        {exportableFeedbackCards.map((card, idx) => (
                          <div
                            key={card.id ?? idx}
                            className={cn(
                              'rounded-lg border p-3 text-sm',
                              isStrengthType(card.type) && 'border-green-200 bg-green-50/80',
                              isSuggestionType(card.type) && 'border-amber-200 bg-amber-50/80',
                              isCommentType(card.type) && 'border-border bg-muted/40',
                            )}
                          >
                            {card.section ? (
                              <p className="mb-1 text-xs font-medium text-muted-foreground">
                                {card.section}
                              </p>
                            ) : null}
                            <p className="leading-relaxed">{card.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {filteredStudentAnswers.length === 0 && exportableFeedbackCards.length === 0 && (
                      <p className="text-sm text-muted-foreground">No student responses in this export.</p>
                    )}
                  </div>
                </section>
              )}

              {includeAttemptHistory && <AttemptHistoryPreviewSection record={studentRecord} />}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-background px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedFeedbackItemCount} feedback {selectedFeedbackItemCount === 1 ? 'item' : 'items'}{' '}
              selected
            </p>
            <div className="flex items-center justify-end gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
