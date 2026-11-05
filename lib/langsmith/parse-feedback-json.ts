import type { PromptResponse } from '@/app/types/langsmith/prompt-response'

/**
 * Pull the feedback object out of a model reply. The model often wraps JSON in
 * prose or a markdown fence, which makes a raw JSON.parse fail and leaves the
 * student with an empty suggestion row.
 */
export function parseModelFeedbackJson(raw: string): PromptResponse | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = (fenced?.[1] ?? trimmed).trim()
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start === -1 || end <= start) return null

  try {
    const parsed: unknown = JSON.parse(body.slice(start, end + 1))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as PromptResponse
  } catch {
    return null
  }
}
