import type {
  ThematicAnalysisLLMOutput,
  ThematicAnalysisLLMItem,
} from '@/app/types'

export interface StudentResponseInput {
  id: string
  answers: Array<{ title: string; value: string }>
}

/**
 * Form metadata / PII fields that must not be sent to the thematic LLM.
 * Intentionally narrow: do not match legitimate questions that merely contain
 * the substring "name" (e.g. "Name three examples", "chemical name of…").
 */
export function isExcludedThematicAnswerTitle(title: string): boolean {
  const normalized = title.toLowerCase().trim()
  if (!normalized) return true

  if (normalized.includes('hour')) return true
  if (normalized.includes('student name')) return true
  if (normalized.includes('please write your name')) return true

  // Standalone name-collection labels only (exact field titles).
  return /^(first\s+name|last\s+name|full\s+name|name)$/i.test(normalized)
}

/**
 * Maps LLM `student_id` back to the canonical learner id we sent in the prompt.
 * Models often return "1", "2", or "Student 1" instead of the full id string.
 */
export function resolveCitationLearnerId(
  rawStudentId: string,
  orderedLearnerIds: readonly string[],
): string {
  const trimmed = rawStudentId?.trim() ?? ''
  if (orderedLearnerIds.length === 0) {
    return trimmed
  }

  if (trimmed && orderedLearnerIds.includes(trimmed)) {
    return trimmed
  }

  for (const id of orderedLearnerIds) {
    if (trimmed.includes(id)) {
      return id
    }
  }

  const asNumber = Number.parseInt(trimmed, 10)
  if (
    !Number.isNaN(asNumber) &&
    asNumber >= 1 &&
    asNumber <= orderedLearnerIds.length
  ) {
    return orderedLearnerIds[asNumber - 1]!
  }

  const studentLabel = /^student\s*(\d+)$/i.exec(trimmed)
  if (studentLabel) {
    const n = Number.parseInt(studentLabel[1], 10)
    if (n >= 1 && n <= orderedLearnerIds.length) {
      return orderedLearnerIds[n - 1]!
    }
  }

  return trimmed
}

export function buildStudentResponseList(
  responses: StudentResponseInput[],
): string {
  return responses
    .map((student, index) => {
      const answersText = student.answers
        .filter(
          (a) =>
            a.value &&
            typeof a.value === 'string' &&
            a.value.trim() !== '' &&
            !isExcludedThematicAnswerTitle(a.title),
        )
        .map((a) => `  (${a.title}): ${a.value}`)
        .join('\n')
      return `--- Student ${index + 1} (id: ${student.id}) ---\n${answersText}`
    })
    .join('\n\n')
}

function isThemeType(value: unknown): value is ThematicAnalysisLLMItem['type'] {
  return value === 'strength' || value === 'need'
}

function parseCitation(
  value: unknown,
): ThematicAnalysisLLMItem['citations'][number] | null {
  if (!value || typeof value !== 'object') return null
  const citation = value as Record<string, unknown>

  if (typeof citation.student_id !== 'string' || !citation.student_id.trim()) {
    return null
  }
  if (typeof citation.annotation !== 'string') return null

  const highlights = Array.isArray(citation.highlights)
    ? citation.highlights.filter(
        (highlight): highlight is string => typeof highlight === 'string',
      )
    : []

  return {
    student_id: citation.student_id,
    highlights,
    annotation: citation.annotation,
  }
}

function parseThemeItem(value: unknown): ThematicAnalysisLLMItem | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>

  if (!isThemeType(item.type)) return null
  if (typeof item.title !== 'string' || !item.title.trim()) return null
  if (typeof item.description !== 'string') return null

  const citations = Array.isArray(item.citations)
    ? item.citations
        .map((value) => parseCitation(value))
        .filter(
          (citation): citation is NonNullable<typeof citation> =>
            citation !== null,
        )
    : []

  return {
    type: item.type,
    title: item.title,
    description: item.description,
    citations,
  }
}

export function parseThematicAnalysisResponse(
  raw: string,
): ThematicAnalysisLLMOutput {
  let cleaned = raw.trim()
  if (cleaned.includes('```json')) {
    cleaned = cleaned.replace(/```json\s*/, '').replace(/\s*```/, '')
  }
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```\s*/, '').replace(/\s*```/, '')
  }

  const parsed: unknown = JSON.parse(cleaned)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Thematic analysis response must be a JSON object')
  }

  const record = parsed as Record<string, unknown>
  const thematicAnalysis = Array.isArray(record.thematic_analysis)
    ? record.thematic_analysis
        .map((value) => parseThemeItem(value))
        .filter((item): item is ThematicAnalysisLLMItem => item !== null)
    : []

  const summary =
    typeof record.summary === 'string' ? record.summary : ''

  return {
    thematic_analysis: thematicAnalysis,
    summary,
  }
}
