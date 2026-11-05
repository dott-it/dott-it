import { googleApiJson } from '@/lib/library/export/google-api-fetch'
import { GoogleAuth } from '@/lib/forms/auth'

const FORMS_API_BASE = 'https://forms.googleapis.com/v1'

export type GoogleFormItemLike = {
  questionItem?: unknown
}

/** Count real questions (excludes page breaks / text items). */
export function countGoogleFormQuestionItems(
  items: GoogleFormItemLike[] | undefined | null,
): number {
  if (!items?.length) {
    return 0
  }
  return items.filter((item) => item.questionItem != null).length
}

/**
 * Load Forms API metadata and return the question count for Workspace attach.
 * Uses the digitize Forms service account (domain-wide delegation when configured).
 */
export async function fetchGoogleFormQuestionCount(formId: string): Promise<number> {
  const auth = new GoogleAuth()
  await auth.authenticate()
  const accessToken = await auth.getAccessToken()
  const form = await googleApiJson<{ items?: GoogleFormItemLike[] }>(
    accessToken,
    `${FORMS_API_BASE}/forms/${encodeURIComponent(formId)}?fields=items`,
  )
  return countGoogleFormQuestionItems(form.items)
}
