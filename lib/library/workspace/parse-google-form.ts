/**
 * Extract a Google Forms API formId from a Form URL.
 *
 * Accepts `/forms/d/{formId}/…` (edit or viewform).
 * Rejects published responder URLs `/forms/d/e/{publishedId}/…` — that ID is not
 * usable with the Forms API (responses.list / forms.get).
 */
export function parseGoogleFormId(formUrl: string): string | null {
  const trimmed = formUrl.trim()
  if (!trimmed.startsWith('http')) {
    return null
  }

  try {
    const url = new URL(trimmed)
    if (/\/forms\/d\/e\//.test(url.pathname)) {
      return null
    }
    const match = /\/forms\/d\/([^/]+)/.exec(url.pathname)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

/** Canonical student-facing view URL that still embeds the Forms API formId. */
export function googleFormViewUrlFromFormId(formId: string): string {
  return `https://docs.google.com/forms/d/${formId}/viewform`
}

/**
 * Teacher-ready Form id only when it is a distinct copy of the library preview.
 * Same URL / same id is a false positive (skipped convert reused the preview).
 */
export function distinctTeacherReadyFormId(
  readyUrl: string | null | undefined,
  previewUrl: string | null | undefined,
): string | null {
  const readyId = readyUrl?.trim() ? parseGoogleFormId(readyUrl.trim()) : null
  if (!readyId) {
    return null
  }
  const previewId = previewUrl?.trim() ? parseGoogleFormId(previewUrl.trim()) : null
  if (previewId && readyId === previewId) {
    return null
  }
  return readyId
}
