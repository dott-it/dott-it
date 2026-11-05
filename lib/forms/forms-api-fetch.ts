import { GoogleApiRequestError, googleApiJson } from '@/lib/library/export/google-api-fetch'
import type {
  CreateFormResponse,
  FormCreateItem,
  FormCreationRequest,
} from './types/forms'

const FORMS_API_BASE = 'https://forms.googleapis.com/v1'
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

function flattenTitle(value: string): string {
  return value.replaceAll(/\r\n|\r|\n/g, ' ').replaceAll(/\s+/g, ' ').trim()
}

/**
 * Rename the Form's Drive file. Belts-and-suspenders if create left "Untitled form"
 * despite documentTitle (Drive name can diverge from Forms metadata).
 */
async function renameFormDriveFile(
  accessToken: string,
  formId: string,
  name: string,
): Promise<void> {
  await googleApiJson(
    accessToken,
    `${DRIVE_API_BASE}/files/${formId}?supportsAllDrives=true&fields=id,name`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    },
  )
}

/**
 * Create a Google Form + items (questions / images) using raw fetch.
 * Prefer this in Next.js route handlers — googleapis/gaxios hits undici gzip bugs
 * ("incorrect header check") without Accept-Encoding: identity.
 */
export async function createFormWithQuestionsViaFetch(
  accessToken: string,
  formRequest: FormCreationRequest,
  items: FormCreateItem[],
): Promise<CreateFormResponse> {
  const title = flattenTitle(formRequest.title)

  // documentTitle (Drive file name) is writable only on create; title alone leaves "Untitled form".
  // description requires batchUpdate.
  const created = await googleApiJson<CreateFormResponse>(
    accessToken,
    `${FORMS_API_BASE}/forms`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        info: {
          title,
          documentTitle: title,
        },
      }),
    },
  )

  if (!created.formId) {
    throw new GoogleApiRequestError('Form created but no formId returned', 500)
  }

  const requests: Array<Record<string, unknown>> = []

  // Required for native File upload questions (UI disables them without sign-in/email).
  requests.push({
    updateSettings: {
      settings: { emailCollectionType: 'VERIFIED' },
      updateMask: 'emailCollectionType',
    },
  })

  if (formRequest.description?.trim()) {
    requests.push({
      updateFormInfo: {
        info: { description: formRequest.description.trim() },
        updateMask: 'description',
      },
    })
  }

  for (const [index, item] of items.entries()) {
    requests.push({
      createItem: {
        item,
        location: { index },
      },
    })
  }

  if (requests.length > 0) {
    await googleApiJson(
      accessToken,
      `${FORMS_API_BASE}/forms/${created.formId}:batchUpdate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      },
    )
  }

  // Ensure Drive file name matches (in case create ignored documentTitle).
  await renameFormDriveFile(accessToken, created.formId, title)

  // Re-fetch so responderUri is populated after updates.
  return googleApiJson<CreateFormResponse>(
    accessToken,
    `${FORMS_API_BASE}/forms/${created.formId}`,
  )
}
