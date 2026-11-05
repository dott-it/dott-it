import { googleApiJson } from '@/lib/library/export/google-api-fetch'
import { ensureFormInMyDrive, placeFormForLessonFolder } from './place-form'
import {
  FILE_RESPONSE_MARKER,
  stripFileResponseHint,
  textHasFileResponseMarker,
} from './file-response-marker'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const FORMS_API_BASE = 'https://forms.googleapis.com/v1'

/** Kept for CLI auth probing; Apps Script cannot create File upload items. */
export const APPS_SCRIPT_FILE_UPLOAD_SCOPES = [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.scriptapp',
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/forms',
]

export interface ConvertFileUploadItemsResult {
  formId: string
  converted: number
  titles: string[]
  uploadFolderId?: string
  uploadFolderUrl?: string
  method?: 'forms-api' | 'playwright-ui'
}

type FormItemSnapshot = {
  itemId?: string
  title?: string
  description?: string
  questionItem?: {
    question?: {
      questionId?: string
      required?: boolean
      fileUploadQuestion?: unknown
    }
  }
}
type FormSnapshot = { items?: FormItemSnapshot[] }

interface FileResponsePlaceholder {
  index: number
  itemId?: string
  questionId?: string
  title: string
  description: string
  required: boolean
}

/**
 * Replace `[File response]` paragraph items with native File upload.
 * Forms API cannot create fileUploadQuestion; uses Playwright Forms UI.
 */
export async function convertFileUploadItemsOnForm(
  accessToken: string,
  formId: string,
  options?: { headed?: boolean; lessonFolderId?: string },
): Promise<ConvertFileUploadItemsResult> {
  const file = await googleApiJson<{ name?: string; parents?: string[]; driveId?: string }>(
    accessToken,
    `${DRIVE_API_BASE}/files/${formId}?fields=name,parents,driveId&supportsAllDrives=true`,
  )
  const lessonFolderId =
    options?.lessonFolderId?.trim() ||
    // If the Form is still on a Shared Drive, its parent is the lesson folder.
    (file.driveId ? file.parents?.[0] : undefined)
  if (!lessonFolderId) {
    throw new Error(
      `Form ${formId} needs a lesson folder id (pass lessonFolderId). Native File upload Forms live in My Drive with a lesson-folder shortcut.`,
    )
  }
  return convertFileUploadItems({
    accessToken,
    formId,
    formTitle: file.name?.trim() || 'Eddo Form',
    lessonFolderId,
    headed: options?.headed,
  })
}

export async function convertFileUploadItems(args: {
  accessToken: string
  formId: string
  formTitle: string
  /** Required unless skipPlacement is set (Form already in My Drive). */
  lessonFolderId?: string
  headed?: boolean
  /**
   * When true, do not create lesson shortcuts / uploads folders.
   * Use for forms@-owned staging copies before transfer to a teacher.
   */
  skipPlacement?: boolean
}): Promise<ConvertFileUploadItemsResult> {
  const placeholders = await listFileResponsePlaceholderItems(args.accessToken, args.formId)
  if (placeholders.length === 0) {
    return {
      formId: args.formId,
      converted: 0,
      titles: [],
    }
  }

  let formId = args.formId
  if (args.skipPlacement) {
    const ensured = await ensureFormInMyDrive(args.accessToken, formId)
    formId = ensured.formId
    if (ensured.copied) {
      console.warn(`Working on My Drive copy ${formId} (Shared Drive original left in place)`)
    }
  } else {
    if (!args.lessonFolderId?.trim()) {
      throw new Error('convertFileUploadItems requires lessonFolderId unless skipPlacement is set')
    }
    // Native File upload only works when the Form lives in My Drive (not a Shared Drive).
    const placed = await placeFormForLessonFolder(
      args.accessToken,
      formId,
      args.lessonFolderId,
    )
    formId = placed.formId
    if (placed.copied) {
      console.warn(`Working on My Drive copy ${formId} (Shared Drive original left in place)`)
    }
  }

  // File upload is disabled in the Forms UI unless the form collects email / requires sign-in.
  await ensureFormCollectsVerifiedEmail(args.accessToken, formId)

  const method: 'forms-api' | 'playwright-ui' = 'playwright-ui'
  console.warn('Converting [File response] items via Playwright Forms UI (out of process)…')
  const { convertFileUploadItemsViaPlaywrightProcess } = await import(
    './convert-file-upload-playwright-process'
  )

  let titles = placeholders.map((item) => item.title)
  let convertedTotal = 0
  let ui = await convertFileUploadItemsViaPlaywrightProcess({
    formId,
    titles,
    headed: args.headed,
  })
  convertedTotal += ui.converted

  let remaining = await listFileResponsePlaceholders(args.accessToken, formId)
  if (remaining.length > 0 && convertedTotal > 0) {
    console.warn(
      `Playwright left ${remaining.length} [File response] item(s); retrying convert pass…`,
    )
    titles = remaining
    ui = await convertFileUploadItemsViaPlaywrightProcess({
      formId,
      titles,
      headed: args.headed,
    })
    convertedTotal += ui.converted
    remaining = await listFileResponsePlaceholders(args.accessToken, formId)
  }

  if (convertedTotal === 0 && remaining.length > 0) {
    throw new Error(
      'Playwright UI conversion changed 0 items. Re-run with --headed or refresh Forms UI login (--forms-ui-login).',
    )
  }

  const uploads = await countNativeFileUploads(args.accessToken, formId)
  if (remaining.length > 0) {
    throw new Error(
      `File-upload conversion left ${remaining.length} [File response] item(s) after ${method} ` +
        `(native uploads now: ${uploads}).`,
    )
  }

  return {
    formId,
    converted: placeholders.length,
    titles: placeholders.map((item) => item.title),
    method,
  }
}

export async function listFileResponsePlaceholders(
  accessToken: string,
  formId: string,
): Promise<string[]> {
  const items = await listFileResponsePlaceholderItems(accessToken, formId)
  return items.map((item) => item.title)
}

async function countNativeFileUploads(accessToken: string, formId: string): Promise<number> {
  const form = await googleApiJson<FormSnapshot>(accessToken, `${FORMS_API_BASE}/forms/${formId}`)
  return (form.items ?? []).filter((item) => item.questionItem?.question?.fileUploadQuestion)
    .length
}

async function listFileResponsePlaceholderItems(
  accessToken: string,
  formId: string,
): Promise<FileResponsePlaceholder[]> {
  const form = await googleApiJson<FormSnapshot>(accessToken, `${FORMS_API_BASE}/forms/${formId}`)
  return (form.items ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (item.questionItem?.question?.fileUploadQuestion) {
        return false
      }
      return (
        textHasFileResponseMarker(item.title) || textHasFileResponseMarker(item.description)
      )
    })
    .map(({ item, index }) => ({
      index,
      itemId: item.itemId,
      questionId: item.questionItem?.question?.questionId,
      title: item.title?.trim() || FILE_RESPONSE_MARKER,
      description: stripFileResponseHint(item.description),
      required: item.questionItem?.question?.required !== false,
    }))
}

async function ensureFormCollectsVerifiedEmail(
  accessToken: string,
  formId: string,
): Promise<void> {
  const form = await googleApiJson<{ settings?: { emailCollectionType?: string } }>(
    accessToken,
    `${FORMS_API_BASE}/forms/${formId}?fields=settings`,
  )
  if (form.settings?.emailCollectionType === 'VERIFIED') {
    return
  }
  await googleApiJson(accessToken, `${FORMS_API_BASE}/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          updateSettings: {
            settings: { emailCollectionType: 'VERIFIED' },
            updateMask: 'emailCollectionType',
          },
        },
      ],
    }),
  })
}
