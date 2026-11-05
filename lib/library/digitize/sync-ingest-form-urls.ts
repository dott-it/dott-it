import { googleApiJson } from '@/lib/library/export/google-api-fetch'
import { listDigitizeTargetsForUnit } from './list-targets'
import { eddoFormTitle } from './naming'
import { findExistingEddoForm } from './place-form'
import { persistGoogleFormUrl } from './persist-form-url'
import { googleFormViewUrlFromFormId } from '@/lib/library/workspace/parse-google-form'

const FORMS_API_BASE = 'https://forms.googleapis.com/v1'

export interface SyncIngestFormUrlResult {
  assessmentId: string
  assessmentTitle: string
  status: 'updated' | 'unchanged' | 'missing-form' | 'failed'
  formUrl?: string
  detail?: string
}

/**
 * For each eligible assessment (optionally limited to a lesson folder), find the
 * Eddo Form already in that lesson folder and write its responderUri into ingest.
 * Supports multiple assessments per lesson — each assessmentId maps to its own Form.
 */
export async function syncIngestFormUrlsFromDrive(args: {
  accessToken: string
  unitCode: string
  lessonFolderId?: string
  force?: boolean
}): Promise<SyncIngestFormUrlResult[]> {
  const targets = await listDigitizeTargetsForUnit({
    accessToken: args.accessToken,
    unitCode: args.unitCode,
    // Include assessments that already have a googleForm in manifest when syncing.
    force: true,
    lessonFolderId: args.lessonFolderId,
  })

  const results: SyncIngestFormUrlResult[] = []

  for (const target of targets) {
    try {
      const existing = await findExistingEddoForm(
        args.accessToken,
        target.lessonFolderId,
        target.assessmentTitle,
      )
      if (!existing) {
        results.push({
          assessmentId: target.assessmentId,
          assessmentTitle: target.assessmentTitle,
          status: 'missing-form',
          detail: `No Eddo Form named like "${eddoFormTitle(target.assessmentTitle)}" in lesson folder`,
        })
        continue
      }

      const form = await googleApiJson<{ responderUri?: string; formId?: string }>(
        args.accessToken,
        `${FORMS_API_BASE}/forms/${existing.formId}`,
      )
      const formUrl = googleFormViewUrlFromFormId(form.formId ?? existing.formId)

      const persisted = persistGoogleFormUrl({
        unitCode: target.unitCode,
        assessmentId: target.assessmentId,
        formUrl,
      })

      results.push({
        assessmentId: target.assessmentId,
        assessmentTitle: target.assessmentTitle,
        status: persisted.updated ? 'updated' : 'unchanged',
        formUrl,
      })
    } catch (error) {
      results.push({
        assessmentId: target.assessmentId,
        assessmentTitle: target.assessmentTitle,
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}
