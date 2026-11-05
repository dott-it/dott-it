import { googleApiJson } from '@/lib/library/export/google-api-fetch'
import { googleFormEmbedUrl } from '@/lib/library/materials/google-form-embed-url'
import { parseGoogleFormId } from '@/lib/library/workspace/parse-google-form'

const FORMS_API_BASE = 'https://forms.googleapis.com/v1'

/**
 * Read-only: resolve the official Google Forms embed URL from responderUri.
 * Does not call setPublishSettings — publish at digitize / prepare-teacher-ready time.
 */
export async function resolveGoogleFormEmbedUrl(
  accessToken: string,
  formUrl: string,
): Promise<{ formId: string; responderUri: string; embedUrl: string }> {
  const formId = parseGoogleFormId(formUrl)
  if (!formId) {
    throw new Error('Form URL must include a Forms API formId (/forms/d/{formId}/…)')
  }

  const form = await googleApiJson<{ responderUri?: string }>(
    accessToken,
    `${FORMS_API_BASE}/forms/${formId}?fields=responderUri`,
  )
  const responderUri = form.responderUri?.trim()
  if (!responderUri?.startsWith('http')) {
    throw new Error(
      `Form ${formId} has no responderUri (publish the Form at digitize time before embedding)`,
    )
  }

  return {
    formId,
    responderUri,
    embedUrl: googleFormEmbedUrl(responderUri),
  }
}
