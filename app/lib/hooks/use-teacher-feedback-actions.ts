'use client'

import { useCallback, useRef } from 'react'
import { type QueryClient, useQueryClient } from '@tanstack/react-query'
import type { AssessmentRecord, FeedbackSection } from '@/app/types'
import type { CreateFeedbackSectionData } from '@/app/types/api/feedback-section'
import type { Feedback } from '@/app/types/api/feedback.api'
import { feedbackQueries } from '@/app/lib/services/feedback/feedback.queries'
import { feedbackSectionQueries } from '@/app/lib/services/feedback-section/feedback-section.queries'
import { assessmentRecordsQueries } from '@/app/lib/services/assessment-records/assessment-records.queries'
import { pickCanonicalPendingFeedback } from '@/app/lib/feedback/resolve-canonical-pending-feedback'
import { getLatestCompletedFeedbackSections } from '@/app/lib/feedback/export-preview-feedback'
import {
  aiTemplateDisplayListKey,
  shouldShowPendingFeedbackSection,
} from '@/app/lib/feedback/merge-feedback-sections'
import {
  OPTIMISTIC_SECTION_ID_PREFIX,
  FeedbackEditNotPersistedError,
  isOptimisticFeedbackSectionId,
  resolvePendingSectionIdAfterSnapshotSeed,
  shouldKeepAiTemplateAfterBodyEdit,
  shouldKeepDraftAfterSectionContentEdit,
  shouldKeepDraftSectionAfterAiTemplateEdit,
} from '@/app/lib/feedback/resolve-pending-section-after-snapshot'

/**
 * Client-only section ids (never sent to the API as persisted keys):
 * - `dott-opt-*` — rows shown while append/replace POSTs are in flight
 * - `dott-opt-snap-*` — full completed-feedback snapshot seeded into pending during re-open
 */

function appendOptimisticFeedbackSectionToCache(
  queryClient: QueryClient,
  assessmentRecordId: string,
  pendingFeedbackId: string,
  section: FeedbackSection,
) {
  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev?.feedbacks) return prev
    return {
      ...prev,
      feedbacks: prev.feedbacks.map((fb) => {
        if (fb.id !== pendingFeedbackId) return fb
        const existing = fb.feedbackSections ?? []
        const filtered = existing.filter((s) => {
          if (!s.id?.startsWith(OPTIMISTIC_SECTION_ID_PREFIX)) return true
          const sameSource =
            (Boolean(section.originalSectionId) &&
              s.originalSectionId === section.originalSectionId) ||
            (Boolean(section.aiSuggestionsId) && s.aiSuggestionsId === section.aiSuggestionsId)
          return !sameSource
        })
        return { ...fb, feedbackSections: [...filtered, section] }
      }),
    }
  })
}

function stripOptimisticFeedbackSections(sections: FeedbackSection[] | undefined): FeedbackSection[] {
  return (sections ?? []).filter((s) => !s.id?.startsWith(OPTIMISTIC_SECTION_ID_PREFIX))
}

function dedupeFeedbackSectionsById(sections: FeedbackSection[] | undefined): FeedbackSection[] {
  const list = sections ?? []
  const seen = new Set<string>()
  const out: FeedbackSection[] = []
  for (const s of list) {
    const id = s.id
    if (id != null && id !== '') {
      if (seen.has(id)) continue
      seen.add(id)
    }
    out.push(s)
  }
  return out
}

function normalizePendingFeedbackSections(sections: FeedbackSection[] | undefined): FeedbackSection[] {
  return dedupeFeedbackSectionsById(stripOptimisticFeedbackSections(sections))
}

const SNAPSHOT_OPTIMISTIC_ID_MARKER = `${OPTIMISTIC_SECTION_ID_PREFIX}snap-`

/** True while we are re-seeding pending from a completed snapshot (client-only rows). */
function isSnapshotOptimisticSectionId(id: string | undefined): boolean {
  return Boolean(id?.startsWith(SNAPSHOT_OPTIMISTIC_ID_MARKER))
}

/**
 * Show the full completed snapshot in the UI immediately while we persist rows in the background.
 * Avoids clearing the draft and re-rendering sections one network round-trip at a time.
 */
function seedSnapshotIntoPendingCacheOptimistic(
  queryClient: QueryClient,
  assessmentRecordId: string,
  pendingId: string,
  snapshotSections: FeedbackSection[],
) {
  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev?.feedbacks) return prev
    return {
      ...prev,
      feedbacks: prev.feedbacks.map((fb) => {
        if (fb.id !== pendingId) return fb
        const existing = fb.feedbackSections ?? []
        const withoutStaleSnapshot = existing.filter((s) => !isSnapshotOptimisticSectionId(s.id))
        const optimisticRows: FeedbackSection[] = snapshotSections.map((s, idx) => ({
          ...s,
          id: `${SNAPSHOT_OPTIMISTIC_ID_MARKER}${idx}-${globalThis.crypto.randomUUID()}`,
          feedbackId: pendingId,
        }))
        return { ...fb, feedbackSections: [...withoutStaleSnapshot, ...optimisticRows] }
      }),
    }
  })
}

function mergeFeedbackIntoAssessmentRecordCache(
  queryClient: QueryClient,
  assessmentRecordId: string,
  feedbackPatch: Feedback,
) {
  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev) return prev
    const list = [...(prev.feedbacks ?? [])]
    const i = list.findIndex((f) => f.id === feedbackPatch.id)
    if (i === -1) {
      list.push({
        ...feedbackPatch,
        feedbackSections: normalizePendingFeedbackSections(feedbackPatch.feedbackSections),
      })
    } else {
      const prevFb = list[i]
      const nextSections =
        feedbackPatch.feedbackSections === undefined
          ? normalizePendingFeedbackSections(prevFb.feedbackSections)
          : normalizePendingFeedbackSections(feedbackPatch.feedbackSections)
      list[i] = { ...prevFb, ...feedbackPatch, feedbackSections: nextSections }
    }
    return { ...prev, feedbacks: list }
  })
}

function removeFeedbackSectionFromAssessmentRecordCache(
  queryClient: QueryClient,
  assessmentRecordId: string,
  sectionId: string,
) {
  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev?.feedbacks) return prev
    return {
      ...prev,
      feedbacks: prev.feedbacks.map((fb) =>
        fb.status === 'pending'
          ? {
              ...fb,
              feedbackSections: fb.feedbackSections?.filter((s) => s.id !== sectionId) ?? [],
            }
          : fb,
      ),
    }
  })
}

/** After PATCH on an AI-owned template row: update nested template + draft copies (same as server cascade). */
function mergeAiTemplateFeedbackSectionIntoAssessmentRecordCache(
  queryClient: QueryClient,
  assessmentRecordId: string,
  updatedSection: FeedbackSection,
  previousTemplate?: Pick<FeedbackSection, 'content' | 'type'>,
) {
  const templateId = updatedSection.id
  if (!templateId) return

  const previousKey =
    previousTemplate == null
      ? null
      : aiTemplateDisplayListKey({
          type: previousTemplate.type ?? updatedSection.type,
          content: previousTemplate.content ?? '',
        } as FeedbackSection)

  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev) return prev

    const studentAnswers = (prev.studentAnswers ?? []).map((sa) => ({
      ...sa,
      aiSuggestions: (sa.aiSuggestions ?? []).map((ai) => {
        const mapped = (ai.feedback ?? []).map((s) =>
          s.id === templateId
            ? ({ ...s, ...updatedSection, id: templateId } as FeedbackSection)
            : s,
        )
        // Drop client-only AI ghosts that still show the pre-edit body under another id.
        // (They disappear on full reload; keeping them confuses teachers mid-session.)
        const cleaned =
          previousKey == null
            ? mapped
            : mapped.filter((s) =>
                shouldKeepAiTemplateAfterBodyEdit(s, templateId, previousKey),
              )
        return { ...ai, feedback: cleaned }
      }),
    }))

    const feedbacks = (prev.feedbacks ?? []).map((fb) => {
      const isPending = fb.status === 'pending'
      const mapped = (fb.feedbackSections ?? []).map((s) => {
        const linkedById = String(s.originalSectionId ?? '') === String(templateId)
        // Only rematerialize/link-by-body on pending drafts — never rewrite completed history.
        const linkedByPreviousBody =
          isPending &&
          previousKey != null &&
          (s.originalSectionId == null || String(s.originalSectionId) === '') &&
          aiTemplateDisplayListKey(s) === previousKey
        if (!linkedById && !linkedByPreviousBody) return s
        // Completed: mirror server cascade only for rows already linked by originalSectionId.
        if (!isPending && !linkedById) return s
        return {
          ...s,
          originalSectionId: s.originalSectionId ?? templateId,
          content: updatedSection.content,
          type: updatedSection.type,
          section: updatedSection.section,
          used: true,
        } as FeedbackSection
      })
      // Ghost drop is pending-only so completed export snapshots stay intact in cache.
      if (!isPending || previousKey == null) {
        return { ...fb, feedbackSections: mapped }
      }
      return {
        ...fb,
        feedbackSections: mapped.filter((s) =>
          shouldKeepDraftSectionAfterAiTemplateEdit(s, templateId, previousKey),
        ),
      }
    })

    return { ...prev, studentAnswers, feedbacks }
  })
}

/** Remove pending draft rows that still show a section's pre-edit body after a content PATCH. */
function removeStaleDraftBodiesFromAssessmentRecordCache(
  queryClient: QueryClient,
  assessmentRecordId: string,
  editedSectionId: string,
  previousSection: Pick<FeedbackSection, 'content' | 'type'> | undefined,
) {
  if (previousSection == null) return
  const previousKey = aiTemplateDisplayListKey({
    type: previousSection.type,
    content: previousSection.content ?? '',
  } as FeedbackSection)

  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev?.feedbacks) return prev
    return {
      ...prev,
      feedbacks: prev.feedbacks.map((fb) => {
        if (fb.status !== 'pending') return fb
        return {
          ...fb,
          feedbackSections:
            fb.feedbackSections?.filter((s) =>
              shouldKeepDraftAfterSectionContentEdit(s, editedSectionId, previousKey),
            ) ?? [],
        }
      }),
    }
  })
}

/** Drop AI suggestion rows that still show a pre-edit body under a different id. */
function removeStaleAiTemplateBodiesFromAssessmentRecordCache(
  queryClient: QueryClient,
  assessmentRecordId: string,
  editedTemplateId: string,
  previousSection: Pick<FeedbackSection, 'content' | 'type'> | undefined,
) {
  if (previousSection == null) return
  const previousKey = aiTemplateDisplayListKey({
    type: previousSection.type,
    content: previousSection.content ?? '',
  } as FeedbackSection)

  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev) return prev
    return {
      ...prev,
      studentAnswers: (prev.studentAnswers ?? []).map((sa) => ({
        ...sa,
        aiSuggestions: (sa.aiSuggestions ?? []).map((ai) => ({
          ...ai,
          feedback: (ai.feedback ?? []).filter((s) =>
            shouldKeepAiTemplateAfterBodyEdit(s, editedTemplateId, previousKey),
          ),
        })),
      })),
    }
  })
}

/** Sync AI template text when a linked pending/completed copy is edited. */
function syncAiTemplateContentInAssessmentRecordCache(
  queryClient: QueryClient,
  assessmentRecordId: string,
  templateId: string,
  data: { content?: string; type?: string; section?: string },
) {
  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev) return prev
    return {
      ...prev,
      studentAnswers: (prev.studentAnswers ?? []).map((sa) => ({
        ...sa,
        aiSuggestions: (sa.aiSuggestions ?? []).map((ai) => ({
          ...ai,
          feedback: (ai.feedback ?? []).map((s) =>
            String(s.id) === String(templateId) ? ({ ...s, ...data } as FeedbackSection) : s,
          ),
        })),
      })),
    }
  })
}

function isAiTemplateSelectedInRecord(
  rec: AssessmentRecord | undefined,
  templateId: string,
  template: Pick<FeedbackSection, 'content' | 'type'> | undefined,
): boolean {
  const feedbacks = rec?.feedbacks ?? []
  for (const fb of feedbacks) {
    for (const s of fb.feedbackSections ?? []) {
      if (!shouldShowPendingFeedbackSection(s)) continue
      if (String(s.originalSectionId ?? '') === String(templateId)) return true
    }
  }
  if (template == null) return false
  const key = aiTemplateDisplayListKey(template as FeedbackSection)
  for (const fb of feedbacks) {
    for (const s of fb.feedbackSections ?? []) {
      if (!shouldShowPendingFeedbackSection(s)) continue
      const ty = String(s.type ?? '').trim().toLowerCase()
      if (ty !== 'strength' && ty !== 'suggestion' && ty !== 'improvement') continue
      if (aiTemplateDisplayListKey(s) === key) return true
    }
  }
  return false
}

function findAiTemplateInRecord(
  rec: AssessmentRecord | undefined,
  templateId: string,
): FeedbackSection | undefined {
  for (const sa of rec?.studentAnswers ?? []) {
    for (const ai of sa.aiSuggestions ?? []) {
      const hit = (ai.feedback ?? []).find((s) => String(s.id) === String(templateId))
      if (hit) return hit
    }
  }
  return undefined
}

function findSectionWithOwningFeedback(
  feedbacks: Feedback[] | undefined,
  sectionId: string,
): { feedback: Feedback; section: FeedbackSection } | undefined {
  for (const fb of feedbacks ?? []) {
    const section = fb.feedbackSections?.find((s) => s.id === sectionId)
    if (section != null) return { feedback: fb, section }
  }
  return undefined
}

function patchFeedbackSectionInAssessmentRecordCache(
  queryClient: QueryClient,
  assessmentRecordId: string,
  sectionId: string,
  data: { content?: string; type?: string; section?: string },
) {
  const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
    id: assessmentRecordId,
  })
  queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
    if (!prev?.feedbacks) return prev
    return {
      ...prev,
      feedbacks: prev.feedbacks.map((fb) => ({
        ...fb,
        feedbackSections:
          fb.feedbackSections?.map((s) => (s.id === sectionId ? { ...s, ...data } : s)) ?? [],
      })),
    }
  })
}

interface UseTeacherFeedbackActionsOptions {
  assessmentRecordId: string
  record: AssessmentRecord | null | undefined
}

export function useTeacherFeedbackActions({
  assessmentRecordId,
  record,
}: UseTeacherFeedbackActionsOptions) {
  const queryClient = useQueryClient()
  /** When true, the append POST succeeded but the user already removed the optimistic row — delete the persisted row. */
  const appendCancelledByOptimisticId = useRef(new Map<string, boolean>())
  /** Serialize append mutations to avoid duplicate rows before the server idempotency layer runs. */
  const appendChainRef = useRef(Promise.resolve())
  /** Deduplicate concurrent `ensurePendingFeedbackId` calls (e.g. double toggle). */
  const ensurePendingInFlightRef = useRef<Promise<string> | null>(null)
  /** Await in-flight completed→pending snapshot seeding before mapping ids for update/delete. */
  const snapshotSeedInFlightRef = useRef<Promise<void> | null>(null)

  const createFeedbackMutation = feedbackQueries.createFeedback.useMutation()
  const appendFeedbackSectionMutation = feedbackQueries.appendFeedbackSection.useMutation()
  const updateFeedbackSectionMutation = feedbackSectionQueries.updateFeedbackSection.useMutation()
  const deleteFeedbackSectionMutation = feedbackSectionQueries.deleteFeedbackSection.useMutation()

  const invalidateAssessmentRecord = useCallback(() => {
    const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
      id: assessmentRecordId,
    })
    void queryClient.invalidateQueries({ queryKey: options.queryKey })
    void queryClient.invalidateQueries({ queryKey: assessmentRecordsQueries.getKey() })
  }, [assessmentRecordId, queryClient])

  const getPendingFeedbackId = useCallback(() => {
    return pickCanonicalPendingFeedback(record?.feedbacks)?.id
  }, [record?.feedbacks])

  const ensurePendingFeedbackId = useCallback(async () => {
    const existing = getPendingFeedbackId()
    if (existing) return existing

    if (ensurePendingInFlightRef.current) {
      return ensurePendingInFlightRef.current
    }

    const createdPromise = (async () => {
      const created = await createFeedbackMutation.mutateAsync({
        assessmentRecordId,
        status: 'pending',
      })
      mergeFeedbackIntoAssessmentRecordCache(queryClient, assessmentRecordId, created)
      return created.id
    })()

    ensurePendingInFlightRef.current = createdPromise
    try {
      return await createdPromise
    } finally {
      ensurePendingInFlightRef.current = null
    }
  }, [
    assessmentRecordId,
    createFeedbackMutation,
    getPendingFeedbackId,
    queryClient,
  ])

  const copyCompletedSnapshotIntoEmptyPending = useCallback(
    async (pendingId: string) => {
      const runSeedIfNeeded = async () => {
        const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
          id: assessmentRecordId,
        })
        const rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
        const pending = pickCanonicalPendingFeedback(rec?.feedbacks)
        if (pending?.id !== pendingId) return

        // Ignore client-only snapshot rows — they do not mean seeding finished.
        const realVisible = (pending.feedbackSections ?? []).filter(
          (s) =>
            shouldShowPendingFeedbackSection(s) && !isOptimisticFeedbackSectionId(s.id),
        )
        if (realVisible.length > 0) return

        const snapshot = getLatestCompletedFeedbackSections(rec?.feedbacks)
        if (snapshot.length === 0) return

        const ordered = [...snapshot].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        seedSnapshotIntoPendingCacheOptimistic(queryClient, assessmentRecordId, pendingId, ordered)

        let lastUpdated: Feedback | undefined
        try {
          for (const s of ordered) {
            lastUpdated = await appendFeedbackSectionMutation.mutateAsync({
              feedbackId: pendingId,
              type: s.type,
              section: s.section?.trim() ? s.section : String(s.type ?? 'comment'),
              content: s.content ?? '',
              aiSuggestionsId: s.aiSuggestionsId ?? undefined,
              originalSectionId: s.originalSectionId ?? undefined,
              used: s.used !== false,
              discarted: s.discarted === true,
            })
          }
          if (lastUpdated) {
            mergeFeedbackIntoAssessmentRecordCache(queryClient, assessmentRecordId, lastUpdated)
          }
        } catch (err) {
          invalidateAssessmentRecord()
          throw err
        }
      }

      if (snapshotSeedInFlightRef.current) {
        // Propagate failure to concurrent waiters (do not swallow).
        await snapshotSeedInFlightRef.current
        // After the in-flight seed settles, re-check — still empty ⇒ retry.
        await runSeedIfNeeded()
        return
      }

      const seedPromise = runSeedIfNeeded()
      snapshotSeedInFlightRef.current = seedPromise
      try {
        await seedPromise
      } finally {
        if (snapshotSeedInFlightRef.current === seedPromise) {
          snapshotSeedInFlightRef.current = null
        }
      }
    },
    [
      appendFeedbackSectionMutation,
      assessmentRecordId,
      invalidateAssessmentRecord,
      queryClient,
    ],
  )

  const ensurePendingPickForAiTemplate = useCallback(
    async (template: FeedbackSection) => {
      const templateId = template.id
      if (templateId == null || String(templateId) === '') return

      const pendingId = await ensurePendingFeedbackId()
      const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
        id: assessmentRecordId,
      })
      const rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
      const pending = pickCanonicalPendingFeedback(rec?.feedbacks)
      const alreadyLinked = (pending?.feedbackSections ?? []).some(
        (s) =>
          shouldShowPendingFeedbackSection(s) &&
          String(s.originalSectionId ?? '') === String(templateId),
      )
      if (alreadyLinked) return

      // Append only this pick — do NOT seed the full completed snapshot (that reintroduces stale rows).
      const updated = await appendFeedbackSectionMutation.mutateAsync({
        feedbackId: pendingId,
        type: template.type,
        section: template.section || template.type,
        content: template.content ?? '',
        aiSuggestionsId: template.aiSuggestionsId ?? undefined,
        originalSectionId: templateId,
        used: true,
        discarted: false,
      })
      mergeFeedbackIntoAssessmentRecordCache(queryClient, assessmentRecordId, updated)
    },
    [
      appendFeedbackSectionMutation,
      assessmentRecordId,
      ensurePendingFeedbackId,
      queryClient,
    ],
  )

  const addAiSection = useCallback(
    async (aiSection: FeedbackSection) => {
      const run = async () => {
        const pendingId = await ensurePendingFeedbackId()
        await copyCompletedSnapshotIntoEmptyPending(pendingId)

        const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
          id: assessmentRecordId,
        })
        const recAfter = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
        const pendingAfter = pickCanonicalPendingFeedback(recAfter?.feedbacks)
        const visibleAfter = (pendingAfter?.feedbackSections ?? []).filter((s) =>
          shouldShowPendingFeedbackSection(s),
        )
        if (
          aiSection.id != null &&
          String(aiSection.id) !== '' &&
          visibleAfter.some((s) => String(s.originalSectionId ?? '') === String(aiSection.id))
        ) {
          return
        }

        const optimisticId = `${OPTIMISTIC_SECTION_ID_PREFIX}${globalThis.crypto.randomUUID()}`
        const optimisticSection: FeedbackSection = {
          id: optimisticId,
          feedbackId: pendingId,
          type: aiSection.type,
          section: aiSection.section || aiSection.type,
          content: aiSection.content,
          aiSuggestionsId: aiSection.aiSuggestionsId ?? null,
          originalSectionId: aiSection.id ?? null,
          used: true,
          discarted: false,
          order: 999_999,
        }
        appendOptimisticFeedbackSectionToCache(
          queryClient,
          assessmentRecordId,
          pendingId,
          optimisticSection,
        )
        appendCancelledByOptimisticId.current.set(optimisticId, false)
        try {
          const updated = await appendFeedbackSectionMutation.mutateAsync({
            feedbackId: pendingId,
            type: aiSection.type,
            section: aiSection.section || aiSection.type,
            content: aiSection.content,
            aiSuggestionsId: aiSection.aiSuggestionsId ?? undefined,
            originalSectionId: aiSection.id,
            used: true,
            discarted: false,
          })
          if (appendCancelledByOptimisticId.current.get(optimisticId)) {
            appendCancelledByOptimisticId.current.delete(optimisticId)
            const sections = updated.feedbackSections ?? []
            const created = sections
              .filter(
                (s) =>
                  (aiSection.id != null && s.originalSectionId === aiSection.id) ||
                  (Boolean(aiSection.aiSuggestionsId) &&
                    s.aiSuggestionsId === aiSection.aiSuggestionsId),
              )
              .sort((a, b) => (b.order ?? 0) - (a.order ?? 0))[0]
            if (created?.id) {
              await deleteFeedbackSectionMutation.mutateAsync({ id: created.id })
              removeFeedbackSectionFromAssessmentRecordCache(
                queryClient,
                assessmentRecordId,
                created.id,
              )
            }
            invalidateAssessmentRecord()
            return updated
          }
          appendCancelledByOptimisticId.current.delete(optimisticId)
          mergeFeedbackIntoAssessmentRecordCache(queryClient, assessmentRecordId, updated)
          return updated
        } catch (err) {
          appendCancelledByOptimisticId.current.delete(optimisticId)
          removeFeedbackSectionFromAssessmentRecordCache(
            queryClient,
            assessmentRecordId,
            optimisticId,
          )
          invalidateAssessmentRecord()
          throw err
        }
      }

      const next = appendChainRef.current.then(() => run())
      appendChainRef.current = next.then(
        () => {},
        () => {},
      )
      return next
    },
    [
      appendFeedbackSectionMutation,
      assessmentRecordId,
      copyCompletedSnapshotIntoEmptyPending,
      ensurePendingFeedbackId,
      invalidateAssessmentRecord,
      queryClient,
      deleteFeedbackSectionMutation,
    ],
  )

  const addCustomSection = useCallback(
    async (data: CreateFeedbackSectionData) => {
      const run = async () => {
        const pendingId = await ensurePendingFeedbackId()
        await copyCompletedSnapshotIntoEmptyPending(pendingId)
        const updated = await appendFeedbackSectionMutation.mutateAsync({
          feedbackId: pendingId,
          type: data.type,
          section: data.section?.trim() ? data.section : data.type,
          content: data.content,
          used: data.used ?? true,
          discarted: data.discarted ?? false,
        })
        mergeFeedbackIntoAssessmentRecordCache(queryClient, assessmentRecordId, updated)
        return updated
      }
      const next = appendChainRef.current.then(() => run())
      appendChainRef.current = next.then(
        () => {},
        () => {},
      )
      return next
    },
    [
      appendFeedbackSectionMutation,
      assessmentRecordId,
      copyCompletedSnapshotIntoEmptyPending,
      ensurePendingFeedbackId,
      queryClient,
    ],
  )

  const removeSection = useCallback(
    async (sectionId: string) => {
      if (sectionId.startsWith(OPTIMISTIC_SECTION_ID_PREFIX)) {
        const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
          id: assessmentRecordId,
        })
        const recBefore = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
        const ownerBefore = findSectionWithOwningFeedback(recBefore?.feedbacks, sectionId)

        appendCancelledByOptimisticId.current.set(sectionId, true)
        removeFeedbackSectionFromAssessmentRecordCache(
          queryClient,
          assessmentRecordId,
          sectionId,
        )

        // Snapshot optimistic rows are replaced by real ids when seed finishes — delete the mapped row.
        if (isSnapshotOptimisticSectionId(sectionId) && ownerBefore?.section) {
          if (snapshotSeedInFlightRef.current) {
            await snapshotSeedInFlightRef.current
          }
          const recAfter = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
          const mapped = resolvePendingSectionIdAfterSnapshotSeed(recAfter, ownerBefore.section)
          if (mapped) {
            await deleteFeedbackSectionMutation.mutateAsync({ id: mapped })
            removeFeedbackSectionFromAssessmentRecordCache(
              queryClient,
              assessmentRecordId,
              mapped,
            )
          }
        }
        return
      }

      let idToDelete = sectionId
      const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
        id: assessmentRecordId,
      })
      let rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
      const owner = findSectionWithOwningFeedback(rec?.feedbacks, sectionId)

      if (owner?.feedback.status === 'completed') {
        if (snapshotSeedInFlightRef.current) {
          await snapshotSeedInFlightRef.current
          rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
        }
        const pendingId = await ensurePendingFeedbackId()
        await copyCompletedSnapshotIntoEmptyPending(pendingId)
        rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
        const mapped = resolvePendingSectionIdAfterSnapshotSeed(rec, owner.section)
        if (mapped) idToDelete = mapped
      }

      if (isOptimisticFeedbackSectionId(idToDelete)) {
        return
      }

      await deleteFeedbackSectionMutation.mutateAsync({ id: idToDelete })
      removeFeedbackSectionFromAssessmentRecordCache(queryClient, assessmentRecordId, idToDelete)
    },
    [
      assessmentRecordId,
      copyCompletedSnapshotIntoEmptyPending,
      deleteFeedbackSectionMutation,
      ensurePendingFeedbackId,
      queryClient,
    ],
  )

  const updateSection = useCallback(
    async (
      sectionId: string,
      data: { content?: string; type?: string; section?: string },
    ) => {
      const options = assessmentRecordsQueries.getAssessmentRecord.getOptions({
        id: assessmentRecordId,
      })
      let rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
      let sourceSection = findSectionWithOwningFeedback(rec?.feedbacks, sectionId)?.section
      let idToUpdate = sectionId
      const previousAiTemplate = findAiTemplateInRecord(rec, sectionId)
      const wasAiTemplateSelected =
        previousAiTemplate != null &&
        isAiTemplateSelectedInRecord(rec, sectionId, previousAiTemplate)
      const preserveSelectedUsed =
        sourceSection == null ? undefined : sourceSection.used !== false

      // Client-only rows: update cache immediately, then wait for seed/append and PATCH the real id.
      if (isOptimisticFeedbackSectionId(sectionId)) {
        patchFeedbackSectionInAssessmentRecordCache(
          queryClient,
          assessmentRecordId,
          sectionId,
          data,
        )
        if (snapshotSeedInFlightRef.current) {
          await snapshotSeedInFlightRef.current
        }
        await appendChainRef.current.catch(() => {})
        rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
        if (sourceSection) {
          const mapped = resolvePendingSectionIdAfterSnapshotSeed(rec, sourceSection)
          if (mapped) {
            idToUpdate = mapped
          } else {
            // Seed may not have started yet (user edited snapshot rows mid-flight before owner was pending).
            const pending = pickCanonicalPendingFeedback(rec?.feedbacks)
            const snapshot = getLatestCompletedFeedbackSections(rec?.feedbacks)
            if (pending?.id && snapshot.length > 0) {
              await copyCompletedSnapshotIntoEmptyPending(pending.id)
              rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
              const remapped = resolvePendingSectionIdAfterSnapshotSeed(rec, sourceSection)
              if (remapped) idToUpdate = remapped
            }
          }
        }
        if (isOptimisticFeedbackSectionId(idToUpdate)) {
          // Roll back the optimistic cache edit and fail loudly so the editor stays open + toast fires.
          if (sourceSection) {
            patchFeedbackSectionInAssessmentRecordCache(
              queryClient,
              assessmentRecordId,
              sectionId,
              {
                content: sourceSection.content,
                type: sourceSection.type,
                section: sourceSection.section,
              },
            )
          } else {
            invalidateAssessmentRecord()
          }
          throw new FeedbackEditNotPersistedError()
        }
      } else {
        const owner = findSectionWithOwningFeedback(rec?.feedbacks, sectionId)
        sourceSection = owner?.section

        if (owner?.feedback.status === 'completed') {
          if (snapshotSeedInFlightRef.current) {
            await snapshotSeedInFlightRef.current
            rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
          }
          // After export there may be no pending draft — create one, then rematerialize.
          const pendingId = await ensurePendingFeedbackId()
          await copyCompletedSnapshotIntoEmptyPending(pendingId)
          rec = queryClient.getQueryData<AssessmentRecord>(options.queryKey)
          const mapped =
            sourceSection == null
              ? undefined
              : resolvePendingSectionIdAfterSnapshotSeed(rec, sourceSection)
          if (mapped) idToUpdate = mapped
        }
      }

      if (isOptimisticFeedbackSectionId(idToUpdate)) {
        throw new FeedbackEditNotPersistedError()
      }

      const patchData: {
        content?: string
        type?: string
        section?: string
        used?: boolean
      } = { ...data }
      // Keep prior selection (used flag) when rematerializing / editing draft rows.
      if (preserveSelectedUsed !== undefined) {
        patchData.used = preserveSelectedUsed
      }

      const updatedRow = await updateFeedbackSectionMutation.mutateAsync({
        id: idToUpdate,
        data: patchData,
      })
      const isAiTemplateRow =
        updatedRow.aiSuggestionsId != null &&
        String(updatedRow.aiSuggestionsId) !== '' &&
        (updatedRow.feedbackId == null || String(updatedRow.feedbackId) === '')

      if (isAiTemplateRow) {
        mergeAiTemplateFeedbackSectionIntoAssessmentRecordCache(
          queryClient,
          assessmentRecordId,
          updatedRow as FeedbackSection,
          previousAiTemplate,
        )
        // Keep selection via originalSectionId without reseeding completed snapshot (avoids ghost rows).
        if (wasAiTemplateSelected) {
          await ensurePendingPickForAiTemplate(updatedRow as FeedbackSection)
          // Append/mergeFeedback may reintroduce stale pending bodies from the server —
          // run cleanup again so the pre-edit text does not linger until reload.
          mergeAiTemplateFeedbackSectionIntoAssessmentRecordCache(
            queryClient,
            assessmentRecordId,
            updatedRow as FeedbackSection,
            previousAiTemplate,
          )
        }
        return
      }

      const previousDraftBody =
        sourceSection == null
          ? undefined
          : { content: sourceSection.content, type: sourceSection.type }

      queryClient.setQueryData(options.queryKey, (prev: AssessmentRecord | undefined) => {
        if (!prev?.feedbacks) return prev
        return {
          ...prev,
          feedbacks: prev.feedbacks.map((fb) => ({
            ...fb,
            feedbackSections:
              fb.feedbackSections?.map((s) => {
                if (s.id !== idToUpdate && s.id !== sectionId) return s
                return {
                  ...s,
                  ...updatedRow,
                  used:
                    preserveSelectedUsed === true
                      ? true
                      : (updatedRow.used ?? s.used),
                }
              }) ?? [],
          })),
        }
      })

      removeStaleDraftBodiesFromAssessmentRecordCache(
        queryClient,
        assessmentRecordId,
        idToUpdate,
        previousDraftBody,
      )

      // Keep the AI Suggestions list in sync when editing a linked draft copy.
      const linkedTemplateId =
        sourceSection?.originalSectionId ?? updatedRow.originalSectionId ?? undefined
      if (linkedTemplateId != null && String(linkedTemplateId) !== '') {
        syncAiTemplateContentInAssessmentRecordCache(
          queryClient,
          assessmentRecordId,
          String(linkedTemplateId),
          {
            content: data.content,
            type: data.type,
            section: data.section,
          },
        )
        removeStaleAiTemplateBodiesFromAssessmentRecordCache(
          queryClient,
          assessmentRecordId,
          String(linkedTemplateId),
          previousDraftBody,
        )
      }
    },
    [
      assessmentRecordId,
      copyCompletedSnapshotIntoEmptyPending,
      ensurePendingFeedbackId,
      ensurePendingPickForAiTemplate,
      invalidateAssessmentRecord,
      queryClient,
      updateFeedbackSectionMutation,
    ],
  )

  return {
    addAiSection,
    addCustomSection,
    removeSection,
    updateSection,
    pendingFeedbackId: getPendingFeedbackId(),
    isPersisting:
      createFeedbackMutation.isPending ||
      appendFeedbackSectionMutation.isPending ||
      updateFeedbackSectionMutation.isPending ||
      deleteFeedbackSectionMutation.isPending,
  }
}
