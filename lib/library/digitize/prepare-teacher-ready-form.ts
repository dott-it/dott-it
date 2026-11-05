import { googleApiJson } from '@/lib/library/export/google-api-fetch'
import { descriptionWithoutCurriculumNotice } from './curriculum-example-notice'
import { convertFileUploadItems, listFileResponsePlaceholders } from './convert-file-upload-items'
import { ensureAnyoneWithLinkReader } from './ensure-anyone-with-link-reader'
import { ensureFormPublished } from './ensure-form-published'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const FORMS_API_BASE = 'https://forms.googleapis.com/v1'

export type PrepareTeacherReadyFormResult = {
  status: 'ready'
  formId: string
  converted: number
}

/**
 * Always build a distinct My Drive Form for teacher export (never reuse the preview URL).
 * Converts `[File response]` items to native File upload when present.
 * Never mutates the library preview Form.
 */
export async function prepareTeacherReadyFormCopy(args: {
  accessToken: string
  sourceFormId: string
  formTitle: string
  headed?: boolean
}): Promise<PrepareTeacherReadyFormResult> {
  const placeholders = await listFileResponsePlaceholders(args.accessToken, args.sourceFormId)
  const teacherTitle = `${args.formTitle} — teacher ready`
  const copied = await googleApiJson<{ id?: string; name?: string }>(
    args.accessToken,
    `${DRIVE_API_BASE}/files/${args.sourceFormId}/copy?supportsAllDrives=true&fields=id,name`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: teacherTitle,
        parents: ['root'],
      }),
    },
  )
  if (!copied.id) {
    throw new Error(`Failed to copy Form ${args.sourceFormId} for teacher-ready convert`)
  }

  console.warn(
    `Preparing teacher-ready Form ${copied.id} from preview ${args.sourceFormId}` +
      (placeholders.length > 0
        ? ` (${placeholders.length} file-response item(s))…`
        : ' (no file-response items; copy only)…'),
  )

  await stripCurriculumExampleNotice(args.accessToken, copied.id)

  let formId = copied.id
  let convertedCount = 0
  if (placeholders.length > 0) {
    const converted = await convertFileUploadItems({
      accessToken: args.accessToken,
      formId: copied.id,
      formTitle: copied.name?.trim() || teacherTitle,
      skipPlacement: true,
      headed: args.headed,
    })
    formId = converted.formId || copied.id
    convertedCount = converted.converted
  }

  // Library Open / Quick look need link access; My Drive copies start private to forms@.
  await ensureAnyoneWithLinkReader(args.accessToken, formId)
  // Copied Forms often have empty publishState and fail with “could not publish document”.
  await ensureFormPublished(args.accessToken, formId)

  return {
    status: 'ready',
    formId,
    converted: convertedCount,
  }
}

async function stripCurriculumExampleNotice(accessToken: string, formId: string): Promise<void> {
  const form = await googleApiJson<{ info?: { description?: string } }>(
    accessToken,
    `${FORMS_API_BASE}/forms/${formId}?fields=info.description`,
  )
  const current = form.info?.description ?? ''
  const next = descriptionWithoutCurriculumNotice(current)
  if (next === current.trim()) {
    return
  }
  await googleApiJson(accessToken, `${FORMS_API_BASE}/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          updateFormInfo: {
            info: { description: next },
            updateMask: 'description',
          },
        },
      ],
    }),
  })
}
