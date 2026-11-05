export const TEMPLATE_DRAFT_FETCH_TIMEOUT_MS = 45_000

export type TemplateDraftFields = {
  title: string
  description: string
  subject: string
  type: string
  curriculumTeachersEdition: string
  curriculumAnswerKey: string
  answerKeyWarning?: string | null
}

export type TemplateContentField =
  | 'title'
  | 'description'
  | 'subject'
  | 'type'
  | 'curriculumTeachersEdition'
  | 'curriculumAnswerKey'

export const TEMPLATE_CONTENT_FIELDS: readonly TemplateContentField[] = [
  'title',
  'description',
  'subject',
  'type',
  'curriculumTeachersEdition',
  'curriculumAnswerKey',
] as const

export function isTemplateContentField(field: string): field is TemplateContentField {
  return (TEMPLATE_CONTENT_FIELDS as readonly string[]).includes(field)
}

type ApplyTemplateDraftOptions = {
  isSubject?: (value: string) => boolean
  isType?: (value: string) => boolean
}

/**
 * Merge library draft values into the form without clobbering fields the user
 * already edited (dirty). Empty draft strings fall back to the previous value,
 * except answer key when the draft reports a load warning (prefer the empty
 * draft so a stale key from another lesson is not kept).
 */
export function applyTemplateDraftToForm<T extends Record<TemplateContentField, string>>(
  prev: T,
  draft: TemplateDraftFields,
  dirtyFields: ReadonlySet<TemplateContentField>,
  options: ApplyTemplateDraftOptions = {},
): T {
  const pick = (field: TemplateContentField, draftValue: string): string => {
    if (dirtyFields.has(field)) {
      return prev[field]
    }
    return draftValue || prev[field]
  }

  let subject = pick('subject', draft.subject)
  if (!dirtyFields.has('subject') && draft.subject && options.isSubject && !options.isSubject(draft.subject)) {
    subject = prev.subject
  }

  let type = pick('type', draft.type)
  if (!dirtyFields.has('type') && draft.type && options.isType && !options.isType(draft.type)) {
    type = prev.type
  }

  let curriculumAnswerKey: string
  if (dirtyFields.has('curriculumAnswerKey')) {
    curriculumAnswerKey = prev.curriculumAnswerKey
  } else if (draft.answerKeyWarning) {
    curriculumAnswerKey = draft.curriculumAnswerKey
  } else {
    curriculumAnswerKey = draft.curriculumAnswerKey || prev.curriculumAnswerKey
  }

  return {
    ...prev,
    title: pick('title', draft.title),
    description: pick('description', draft.description),
    subject,
    type,
    curriculumTeachersEdition: pick(
      'curriculumTeachersEdition',
      draft.curriculumTeachersEdition,
    ),
    curriculumAnswerKey,
  }
}

/** Abort a draft fetch after timeout so the form unlocks for manual entry. */
export function abortSignalWithTimeout(
  parent: AbortSignal,
  timeoutMs: number = TEMPLATE_DRAFT_FETCH_TIMEOUT_MS,
): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  parent.addEventListener('abort', onAbort)

  const timer = setTimeout(() => {
    controller.abort(new DOMException('Curriculum draft timed out', 'TimeoutError'))
  }, timeoutMs)

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer)
      parent.removeEventListener('abort', onAbort)
    },
  }
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true
  }
  return false
}

export function isTimeoutAbort(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return true
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return true
  }
  // Some runtimes wrap timeout as AbortError with TimeoutError cause/message
  if (error instanceof Error && /timed out/i.test(error.message)) {
    return true
  }
  return false
}
