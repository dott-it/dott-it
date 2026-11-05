'use client'

import { useCallback, useMemo } from 'react'
import {
  AssessmentHistoryDivider,
  AssessmentHistoryAvatar,
  FeedbackCardsMessage,
  StudentMessage,
  UserMessage,
  AIMessage,
  AssessmentHistoryLoading,
  AssessmentHistoryFooter,
} from './index'
import { StudentResponseSection } from './student-response-section'
import { FeedbackSection as FeedbackSectionComponent } from './feedback-section'
import { PastAttemptsSection } from './past-attempts-section'
import { Button } from '@/components/ui/button'
import { Edit, Download } from 'lucide-react'
import type { Message } from './types'
import { MessageOptions } from './message-options'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { regenerateAiFeedback } from '@/app/lib/services/student-answer/student-answer.service'
import { successOrThrowAsync } from '@/utils/result'
import { assessmentRecordsQueries } from '@/app/lib/services/assessment-records/assessment-records.queries'
import { ActiveAssessment, AssessmentRecord, type FeedbackSection } from '@/app/types'
import type { CreateFeedbackSectionData } from '@/app/types/api/feedback-section'
import { useTeacherFeedbackActions } from '@/app/lib/hooks/use-teacher-feedback-actions'
import {
  aiTemplateDisplayListKey,
  dedupeAiTemplateFeedbackBySectionId,
  shouldShowPendingFeedbackSection,
} from '@/app/lib/feedback/merge-feedback-sections'
import { pickCanonicalPendingFeedback } from '@/app/lib/feedback/resolve-canonical-pending-feedback'
import { latestStudentAnswer } from '@/app/lib/assessment/chronological-student-answers'
import { shouldBumpAssessmentToInProgressOnFeedbackEdit } from '@/app/lib/assessment/record-status-on-teacher-feedback-edit'
import type { ThematicHighlightPhrase } from '@/app/lib/utils/thematic-analysis-response-highlights'
import { toast } from 'sonner'

function sectionLabelFromApiType(nextType: string | undefined): string | undefined {
  if (nextType === 'suggestion' || nextType === 'improvement') return 'suggestion'
  if (nextType === 'comment') return 'comment'
  if (nextType === 'strength') return 'strength'
  return undefined
}

/** All AI template ids that are duplicates of `feedbackSection` (same cluster key, incl. improvement vs suggestion). */
function aiTemplateIdCluster(
  feedbackFromRecord: FeedbackSection[] | undefined,
  feedbackSection: FeedbackSection,
): Set<string> {
  const ids = new Set<string>()
  if (feedbackSection.id != null && feedbackSection.id !== '') {
    ids.add(feedbackSection.id)
  }
  if (!Array.isArray(feedbackFromRecord)) return ids
  const clickKey = aiTemplateDisplayListKey(feedbackSection)
  for (const t of feedbackFromRecord) {
    if (t.id != null && t.id !== '' && aiTemplateDisplayListKey(t) === clickKey) {
      ids.add(t.id)
    }
  }
  return ids
}

interface AssessmentHistoryContainerProps {
  record: AssessmentRecord
  assessment?: ActiveAssessment
  messages: Message[]
  isLoading?: boolean
  showStudentInfo?: boolean
  onFeedbackToggle: (
    feedbackId: string,
    feedbackText: string,
    section: string,
    type: 'strength' | 'suggestion' | 'comment',
    aiSuggestionsId?: string,
  ) => void
  regeneratingMessageId?: string | null
  onRegenerateFeedback?: (messageId?: string) => Promise<void>
  onUpdateMessage?: (messageId: string, updates: Partial<Message>) => void
  onResumeFeedback: (message: Message) => void
  initialFeedbackCards: FeedbackSection[]
  isSavingFeedback?: boolean
  onAddFeedback?: (type: 'strength' | 'suggestion' | 'comment', content?: string) => void
  onReorderCards?: (newOrder: FeedbackSection[]) => void
  onClearAllFeedback: () => void
  /** When omitted, feedback export controls (PDF + history bubble) are hidden. */
  onExportFeedback?: (feedbackSections: FeedbackSection[]) => void
  /** Phrases from thematic analysis to highlight in the student response column. */
  thematicHighlightPhrases?: ThematicHighlightPhrase[]
}

export function AssessmentHistoryContainer({
  record,
  assessment: _assessment,
  messages,
  isLoading = false,
  showStudentInfo = false,
  regeneratingMessageId = null,
  initialFeedbackCards,
  onUpdateMessage: _onUpdateMessage,
  onResumeFeedback,
  onExportFeedback,
  thematicHighlightPhrases,
  isSavingFeedback = false,
  onReorderCards: _onReorderCards,
}: AssessmentHistoryContainerProps) {
  const queryClient = useQueryClient()

  const pendingFeedback = useMemo(
    () => pickCanonicalPendingFeedback(record?.feedbacks),
    [record?.feedbacks],
  )

  const latestAnswer = useMemo(() => latestStudentAnswer(record), [record])

  /** Pending draft if it has visible rows; else parent snapshot (export preview: pending or latest completed). */
  const feedbackSections = useMemo(() => {
    const fromPending = pendingFeedback
      ? (pendingFeedback.feedbackSections ?? []).filter((s) => shouldShowPendingFeedbackSection(s))
      : []
    const sections = fromPending.length > 0 ? fromPending : initialFeedbackCards
    return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [initialFeedbackCards, pendingFeedback])

  const {
    addAiSection,
    addCustomSection,
    removeSection,
    updateSection,
    isPersisting: isTeacherFeedbackPersisting,
  } = useTeacherFeedbackActions({
    assessmentRecordId: record?.id ?? '',
    record,
  })

  const addedFeedbackIds = useMemo(() => new Set<string>(), [])

  const refreshAISuggestionMutation = useMutation({
    mutationFn: (studentAnswerId: string) =>
      successOrThrowAsync(regenerateAiFeedback({ studentAnswerId })),
    onSuccess: (studentAnswer) => {
      const message = messages.find((message) => message.id === studentAnswer.id)
      if (message) {
        message.aiSuggestions = studentAnswer.aiSuggestions
      }
    },
  })

  const updateAssessmentRecordMutation = assessmentRecordsQueries.updateAssessmentRecord.useMutation({
    onSuccess: (updated) => {
      const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({ id: updated.id })
      // Only patch status fields — a full spread would overwrite in-flight feedback edits
      // (studentAnswers / feedbacks) with a stale server snapshot.
      queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) =>
        prev
          ? {
              ...prev,
              status: updated.status,
              updatedAt: updated.updatedAt,
              teacherScore: updated.teacherScore ?? prev.teacherScore,
              details: updated.details ?? prev.details,
            }
          : updated,
      )
      void queryClient.invalidateQueries({
        queryKey: assessmentRecordsQueries.getAssessmentRecordsByAssessment.getOptions({
          assessmentId: updated.assessmentId,
        }).queryKey,
      })
    },
  })

  const handleRegenerateFeedback = async (studentAnswerId: string) => {
    await refreshAISuggestionMutation.mutate(studentAnswerId)
  }

  // Strengths and suggestions from record (database) for display
  const strengthsFromRecord = useMemo(() => {
    const feedback = latestAnswer?.aiSuggestions?.at(-1)?.feedback
    const sorted = feedback ? [...feedback].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []
    const filtered = sorted.filter((f) => f.type === 'strength')
    return dedupeAiTemplateFeedbackBySectionId(filtered)
  }, [latestAnswer])

  const suggestionsFromRecord = useMemo(() => {
    const feedback = latestAnswer?.aiSuggestions?.at(-1)?.feedback
    const sorted = feedback ? [...feedback].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : []
    const filtered = sorted.filter((f) => f.type === 'suggestion' || f.type === 'improvement')
    return dedupeAiTemplateFeedbackBySectionId(filtered)
  }, [latestAnswer])

  /**
   * Template ids considered "selected" for the AI lists. Uses every `studentAnswer` / `aiSuggestions`
   * so picks stay linked after a new submission (new ids) or regeneration; also matches by body+type
   * when `originalSectionId` no longer exists in any AI run.
   */
  const selectedAiSuggestionIds = useMemo(() => {
    const persisted = new Set<string>()
    for (const section of feedbackSections) {
      if (section.originalSectionId != null && String(section.originalSectionId) !== '') {
        persisted.add(String(section.originalSectionId))
      }
    }

    const allTemplates: FeedbackSection[] = []
    for (const sa of record?.studentAnswers ?? []) {
      for (const ai of sa.aiSuggestions ?? []) {
        for (const t of ai.feedback ?? []) {
          if (t?.id == null || String(t.id) === '') continue
          const ty = String(t.type ?? '').trim().toLowerCase()
          if (ty === 'strength' || ty === 'suggestion' || ty === 'improvement') {
            allTemplates.push(t)
          }
        }
      }
    }

    if (allTemplates.length === 0) {
      return persisted
    }

    const keyToTemplateIds = new Map<string, Set<string>>()
    for (const t of allTemplates) {
      const key = aiTemplateDisplayListKey(t)
      let bucket = keyToTemplateIds.get(key)
      if (!bucket) {
        bucket = new Set()
        keyToTemplateIds.set(key, bucket)
      }
      bucket.add(String(t.id))
    }

    const expanded = new Set<string>(persisted)

    for (const id of persisted) {
      const template = allTemplates.find((t) => String(t.id) === id)
      if (!template) continue
      const cluster = keyToTemplateIds.get(aiTemplateDisplayListKey(template))
      if (cluster) {
        for (const x of cluster) expanded.add(x)
      }
    }

    for (const s of feedbackSections) {
      if (s.originalSectionId == null || String(s.originalSectionId) === '') continue
      const oid = String(s.originalSectionId)
      if (allTemplates.some((t) => String(t.id) === oid)) continue
      const cluster = keyToTemplateIds.get(aiTemplateDisplayListKey(s))
      if (cluster) {
        for (const x of cluster) expanded.add(x)
      }
    }

    // Completed snapshot rows may omit `originalSectionId`; still match current AI templates by type+body.
    for (const s of feedbackSections) {
      const ty = String(s.type ?? '').trim().toLowerCase()
      if (ty !== 'strength' && ty !== 'suggestion' && ty !== 'improvement') continue
      const cluster = keyToTemplateIds.get(aiTemplateDisplayListKey(s))
      if (cluster) {
        for (const x of cluster) expanded.add(x)
      }
    }

    return expanded
  }, [feedbackSections, record?.studentAnswers])

  const customStrengths = useMemo(
    () =>
      feedbackSections.filter(
        (s) => !s.originalSectionId && !s.aiSuggestionsId && s.type === 'strength',
      ),
    [feedbackSections],
  )

  const customSuggestions = useMemo(
    () =>
      feedbackSections.filter(
        (s) =>
          !s.originalSectionId &&
          !s.aiSuggestionsId &&
          (s.type === 'suggestion' || s.type === 'improvement'),
      ),
    [feedbackSections],
  )

  const customComments = useMemo(
    () =>
      feedbackSections.filter(
        (s) => !s.originalSectionId && !s.aiSuggestionsId && s.type === 'comment',
      ),
    [feedbackSections],
  )

  // Lovable-style layout: derive last submission message for layout visibility
  const lastSubmissionMessage = useMemo(() => {
    return messages.findLast((m) => m.metadata?.type === 'submission') ?? null
  }, [messages])

  const feedbackLastUpdated = useMemo(() => {
    const latestCompletedMs = () => {
      let latestMs = 0
      for (const fb of record.feedbacks ?? []) {
        if (fb.status !== 'completed') continue
        const u = new Date(fb.updatedAt ?? 0).getTime()
        const c = new Date(fb.completedAt ?? 0).getTime()
        latestMs = Math.max(latestMs, u, c)
      }
      return latestMs
    }

    if (pendingFeedback?.updatedAt) return new Date(pendingFeedback.updatedAt)

    const ms = latestCompletedMs()
    if (ms > 0) return new Date(ms)
    return new Date()
  }, [pendingFeedback, record.feedbacks])

  const handleAddCustomFeedback = useCallback(
    (data: CreateFeedbackSectionData) => {
      void addCustomSection(data).catch(() => {
        // Persist failure is logged in the hook; UI can be extended with toast later
      })
    },
    [addCustomSection],
  )

  const handleUpdateTeacherFeedback = useCallback(
    async (
      sectionId: string,
      data: { content?: string; type?: string; section?: string },
    ) => {
      if (!sectionId) return
      const nextType = data.type
      const sectionLabel = data.section?.trim() || sectionLabelFromApiType(nextType)
      const patch: {
        content?: string
        type?: string
        section?: string
      } = {}
      if (data.content !== undefined) patch.content = data.content
      if (nextType !== undefined) patch.type = nextType
      if (sectionLabel !== undefined) patch.section = sectionLabel
      if (Object.keys(patch).length === 0) return
      if (
        shouldBumpAssessmentToInProgressOnFeedbackEdit(record?.status) &&
        record?.id
      ) {
        updateAssessmentRecordMutation.mutate({
          id: record.id,
          data: { status: 'in_progress' },
        })
      }
      try {
        await updateSection(sectionId, patch)
      } catch (err) {
        const description =
          err instanceof Error && err.message.trim()
            ? err.message
            : 'Please try again.'
        toast.error('Could not save feedback edit', {
          description,
          duration: 4000,
        })
        throw err
      }
    },
    [record?.id, record?.status, updateAssessmentRecordMutation, updateSection],
  )

  const handleAddAllFeedback = (incomingSections: FeedbackSection[]) => {
    const rawTemplates = latestStudentAnswer(record)?.aiSuggestions?.at(-1)?.feedback
    let bumpedStatus = false
    for (const section of incomingSections) {
      const cluster = aiTemplateIdCluster(rawTemplates, section)
      const alreadySelected = feedbackSections.some(
        (s) => Boolean(s.originalSectionId) && cluster.has(s.originalSectionId as string),
      )
      if (alreadySelected) continue
      if (
        !bumpedStatus &&
        shouldBumpAssessmentToInProgressOnFeedbackEdit(record?.status) &&
        record?.id
      ) {
        bumpedStatus = true
        updateAssessmentRecordMutation.mutate({
          id: record.id,
          data: { status: 'in_progress' },
        })
      }
      void addAiSection(section)
    }
  }

  


  const handleFeedbackToggle = (feedbackSection: FeedbackSection) => {
    const feedbackFromRecord = latestStudentAnswer(record)?.aiSuggestions?.at(-1)?.feedback
    const isAiTemplateRow =
      Boolean(feedbackSection.id) &&
      Array.isArray(feedbackFromRecord) &&
      feedbackFromRecord.some(
        (fb) => fb.id === feedbackSection.id || fb.id === feedbackSection.originalSectionId,
      )

    /** AI list rows share the same `aiSuggestionsId`; match only by template id via `originalSectionId`. */
    if (isAiTemplateRow) {
      if (
        shouldBumpAssessmentToInProgressOnFeedbackEdit(record?.status) &&
        record?.id
      ) {
        updateAssessmentRecordMutation.mutate({
          id: record.id,
          data: { status: 'in_progress' },
        })
      }
      const cluster = aiTemplateIdCluster(feedbackFromRecord, feedbackSection)
      const persistedMatches = feedbackSections.filter(
        (s) => Boolean(s.originalSectionId) && cluster.has(s.originalSectionId as string),
      )
      if (persistedMatches.length > 0) {
        void Promise.all(
          persistedMatches.map((s) => (s.id ? removeSection(s.id) : Promise.resolve())),
        )
        return
      }
      void addAiSection(feedbackSection)
      return
    }

    const isPersistedSection = feedbackSections.some((s) => s.id === feedbackSection.id)
    if (isPersistedSection && feedbackSection.id) {
      if (
        shouldBumpAssessmentToInProgressOnFeedbackEdit(record?.status) &&
        record?.id
      ) {
        updateAssessmentRecordMutation.mutate({
          id: record.id,
          data: { status: 'in_progress' },
        })
      }
      void removeSection(feedbackSection.id)
      return
    }

    if (feedbackSection.id) {
      // eslint-disable-next-line no-console -- defensive warn for invalid feedback section
      console.warn(
        'Attempted to toggle feedback section that does not belong to current student:',
        feedbackSection.id,
      )
    }
  }

  const handleClearAllFeedback = () => {
    void Promise.all(
      feedbackSections.map(async (section) => {
        if (!section.id) return
        await removeSection(section.id)
      }),
    )
  }

  return (
    <div className="relative flex min-h-0 flex-col">
      {/* Messages Thread or Lovable layout — page scrolls for Past Attempts; columns scroll independently */}
      <div data-feedback-columns-shell className="min-h-0">
        <div className="space-y-6 px-4 pb-40">
          {lastSubmissionMessage ? (
            <>
              <div
                data-feedback-columns-grid
                className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch"
              >
                <div
                  data-feedback-column="student-response"
                  className="flex max-h-[min(70dvh,36rem)] min-h-0 min-w-0 flex-col overflow-hidden lg:max-h-[var(--feedback-columns-available-height,70dvh)]"
                >
                  <StudentResponseSection
                    record={record}
                    showStudentInfo={showStudentInfo}
                    thematicHighlightPhrases={thematicHighlightPhrases}
                  />
                </div>
                <div
                  data-feedback-column="feedback"
                  className="flex max-h-[min(70dvh,36rem)] min-h-0 min-w-0 flex-col overflow-hidden lg:max-h-[var(--feedback-columns-available-height,70dvh)]"
                >
                  <FeedbackSectionComponent
                    feedbackCards={feedbackSections}
                    strengths={strengthsFromRecord}
                    suggestions={suggestionsFromRecord}
                    customStrengths={customStrengths}
                    customSuggestions={customSuggestions}
                    customComments={customComments}
                    selectedAiSuggestionIds={selectedAiSuggestionIds}
                    lastUpdated={feedbackLastUpdated}
                    record={record}
                    onToggleFeedback={handleFeedbackToggle}
                    onAddFeedback={handleAddCustomFeedback}
                    onUpdateTeacherFeedback={handleUpdateTeacherFeedback}
                    onClearAllFeedback={handleClearAllFeedback}
                    onExportPdf={
                      onExportFeedback ? () => onExportFeedback(feedbackSections) : undefined
                    }
                    isSavingFeedback={isSavingFeedback || isTeacherFeedbackPersisting}
                  />
                </div>
              </div>
              <PastAttemptsSection
                record={record}
                showViewOnlyLabel
                thematicHighlightPhrases={thematicHighlightPhrases}
              />
            </>
          ) : (
            <>
          {/* Date Divider */}
          <AssessmentHistoryDivider date={ new Date(record?.submittedAt).toISOString() || 'Unknown date'} />

          {messages &&
            messages.length > 0 &&
            messages.map((message, index) => (
              <div key={message.id}>
                {/* Divider before student submission messages (except the first one) */}
                {message.metadata?.type === 'submission' && index > 0 && (
                  <div className="w-full mb-6">
                    <AssessmentHistoryDivider
                      date={
                        message.timestamp.toString()
                      }
                    />
                  </div>
                )}

                {/* Date and Time Divider for Teacher Feedback - Same as initial divider */}
                {message.metadata?.type === 'feedback-cards' && message.role === 'user' && (
                  <div className="w-full mb-6">
                    <AssessmentHistoryDivider
                      date={
                        message.timestamp.toString()
                      }
                    />
                  </div>
                )}

                <div
                  data-message
                  className={`flex gap-4 ${
                    message.metadata?.type === 'submission' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {message.metadata?.type === 'submission' && (
                    <AssessmentHistoryAvatar type="student" />
                  )}

                  <div
                    className={`flex flex-1 flex-col gap-2 ${
                      message.metadata?.type === 'submission'
                        ? 'items-start'
                        : 'max-w-[75%] items-end'
                    }`}
                  >
                    {message.metadata?.type === 'submission' && (
                      <div className="flex w-full flex-col gap-4 lg:flex-row">
                        {/* Student message - fixed width */}
                        <div className="w-full lg:w-1/2">
                          <StudentMessage
                            studentName={record?.learnerName || 'Student'}
                            learnerId={record?.learnerId}
                            content={message.content}
                            showStudentInfo={showStudentInfo}
                            initiallyOpen={index === messages.length - 1}
                          />
                        </div>

                        <MessageOptions
                          message={message}
                          onFeedbackToggle={handleFeedbackToggle}
                          addedFeedbackIds={addedFeedbackIds}
                          onAddAllFeedback={handleAddAllFeedback}
                          regenerateFeedback={handleRegenerateFeedback}
                          suggestionsOpenByDefault={index === messages.length - 1}
                        />
                      </div>
                    )}
                    {message.metadata?.type !== 'submission' &&
                      message.role === 'user' &&
                      message.metadata?.type !== 'feedback-cards' && (
                        <UserMessage content={message.content} timestamp={new Date(message.timestamp.toString())} />
                      )}
                    {message.metadata?.type === 'feedback-cards' && message.role === 'user' && (
                      <div className="flex w-full flex-col gap-4 lg:flex-row">
                        {/* Left side container for action bubbles */}
                        <div className="flex w-full flex-col gap-4 lg:w-16 lg:flex-row lg:justify-start">
                          {/* Action bubbles - similar to FeedbackBubbles but for teacher actions */}
                          <div className="flex flex-row justify-center gap-2 lg:w-16 lg:flex-col lg:justify-start">
                            {onExportFeedback ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-full border border-blue-200 bg-blue-100 hover:bg-blue-200 dark:border-blue-800 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                                onClick={() =>
                                  onExportFeedback(message.metadata.eventData?.feedbackSections || [])
                                }
                                title="Export feedback"
                                aria-label="Export feedback"
                              >
                                <Download className="size-5 text-blue-600 dark:text-blue-400" />
                              </Button>
                            ) : null}
                            {/* Edit bubble */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-10 rounded-full border border-purple-200 bg-purple-100 hover:bg-purple-200 dark:border-blue-800 dark:bg-purple-900/30 dark:hover:bg-purple-900/50"
                              onClick={() => {onResumeFeedback(message)}}
                              title="Edit feedback (return to preview)"
                              aria-label="Edit feedback, return to preview"
                            >
                              <Edit className="size-5 text-purple-600 dark:text-purple-400" />
                            </Button>
                          </div>
                        </div>

                        {/* Right side container for feedback message */}
                        <div className="w-full lg:flex-1">
                          <FeedbackCardsMessage feedbackCards={message.metadata.eventData?.feedbackSections || []} />
                        </div>
                      </div>
                    )}
                    {message.metadata?.type !== 'submission' &&
                      message.role !== 'user' &&
                      message.metadata?.type !== 'feedback-cards' && (
                        <AIMessage
                          content={message.content}
                          messageType={
                            message.metadata?.type === 'score-suggestion'
                              ? 'default'
                              : message.metadata?.type
                          }
                          feedbackType={'strength'}
                          isRegenerating={regeneratingMessageId === message.id}
                        />
                      )}
                  </div>

                  {(message.role === 'user' || message.role === 'assistant') &&
                    message.metadata?.type !== 'submission' && (
                      <AssessmentHistoryAvatar
                        type={message.role === 'assistant' ? 'assistant' : 'user'}
                      />
                    )}
                </div>
              </div>
            ))}

            </>
          )}

          {isLoading && <AssessmentHistoryLoading />}
        </div>
      </div>

      {/* Footer only when thread layout (no lastSubmissionMessage); Lovable layout uses FeedbackSection in main content */}
      {!lastSubmissionMessage && (
        <AssessmentHistoryFooter
          studentName={record?.learnerName}
          showStudentInfo={showStudentInfo}
          isLoading={isLoading}
        />
      )}

      {/* Bottom padding to prevent content from being hidden behind fixed footer (when footer is shown) */}
      {!lastSubmissionMessage && <div className="h-16" />}
    </div>
  )
}
