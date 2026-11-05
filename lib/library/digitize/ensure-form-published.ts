import { googleApiJson } from '@/lib/library/export/google-api-fetch'

const FORMS_API_BASE = 'https://forms.googleapis.com/v1'

/**
 * Ensure a Form is published and accepting responses (required for viewform / Open).
 * Copied My Drive Forms often start with an empty publishState and fail to open.
 */
export async function ensureFormPublished(accessToken: string, formId: string): Promise<void> {
  await googleApiJson(accessToken, `${FORMS_API_BASE}/forms/${formId}:setPublishSettings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      publishSettings: {
        publishState: {
          isPublished: true,
          isAcceptingResponses: true,
        },
      },
    }),
  })
}
