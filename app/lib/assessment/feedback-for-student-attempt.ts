import type { AssessmentRecord, FeedbackSection, StudentAnswer } from '@/types'
import { dedupeAiTemplateFeedbackBySectionId } from '@/app/lib/feedback/merge-feedback-sections'

function teacherSectionsLinkedToSuggestions(
  record: AssessmentRecord,
  aiSuggestionIds: ReadonlySet<string>,
): FeedbackSection[] {
  if (aiSuggestionIds.size === 0) return []
  return (record.feedbacks ?? []).flatMap((fb) =>
    (fb.feedbackSections ?? []).filter(
      (s) =>
        s.discarted !== true &&
        s.aiSuggestionsId != null &&
        String(s.aiSuggestionsId).length > 0 &&
        aiSuggestionIds.has(String(s.aiSuggestionsId)),
    ),
  )
}

function aiRowsFromSuggestions(studentAnswer: StudentAnswer): FeedbackSection[] {
  return (studentAnswer.aiSuggestions ?? []).flatMap((ai) =>
    dedupeAiTemplateFeedbackBySectionId(ai.feedback as FeedbackSection[] | undefined),
  )
}

/** Strengths/suggestions/comments tied to one submission (`aiSuggestions` on that attempt). */
export function feedbackSectionsForStudentAttempt(
  studentAnswer: StudentAnswer,
  record: AssessmentRecord,
): FeedbackSection[] {
  const suggestionIds = new Set((studentAnswer.aiSuggestions ?? []).map((ai) => ai.id))
  const teacher = teacherSectionsLinkedToSuggestions(record, suggestionIds)
  const fromAiBuckets = aiRowsFromSuggestions(studentAnswer)
  const combined = [...teacher, ...fromAiBuckets].filter((s) => s.discarted !== true)
  return dedupeAiTemplateFeedbackBySectionId(combined).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
