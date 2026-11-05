import { findIngestedAssessment } from '@/lib/library/ingest/load-manifest'
import { GoogleApiRequestError, googleApiJson } from '@/lib/library/export/google-api-fetch'
import { getFormsWorkspaceAccessToken } from '@/lib/library/export/impersonated-access-token'
import { FORMS_WORKSPACE_USER } from '@/lib/library/digitize/curriculum-example-notice'
import { dottFormTitle } from '@/lib/library/digitize/naming'
import {
  findExistingDottForm,
  trashExistingDottFormArtifacts,
} from '@/lib/library/digitize/place-form'
import {
  distinctTeacherReadyFormId,
  googleFormViewUrlFromFormId,
  parseGoogleFormId,
} from '@/lib/library/workspace/parse-google-form'
import type { LibraryExportFileResult } from './types'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

/**
 * Library preview Form id (paste-a-link). Null when not digitized yet.
 */
export function resolveCurriculumGoogleFormId(
  unitCode: string,
  assessmentId: string,
): string | null {
  const assessment = findIngestedAssessment(unitCode, assessmentId)
  const formUrl = assessment?.files.googleForm?.trim()
  if (!formUrl) {
    return null
  }
  return parseGoogleFormId(formUrl)
}

/**
 * Teacher-export template Form id (native File upload in forms@ My Drive).
 * Ignores a teacher-ready URL that is identical to the library preview (false positive).
 */
export function resolveTeacherReadyGoogleFormId(
  unitCode: string,
  assessmentId: string,
): string | null {
  const assessment = findIngestedAssessment(unitCode, assessmentId)
  return distinctTeacherReadyFormId(assessment?.files.googleFormTeacherReady, assessment?.files.googleForm)
}

/**
 * Copy a Form as forms@ into My Drive root (no File-upload conversion).
 * Used when the source is already a teacher-ready template.
 */
async function copyAsFormsWorkspaceThenTransfer(args: {
  teacherAccessToken: string
  teacherEmail: string
  teacherFolderId: string
  sourceFormId: string
  formTitle: string
}): Promise<{ formId: string; name: string }> {
  const formsToken = await getFormsWorkspaceAccessToken()

  const staged = await googleApiJson<{ id?: string; name?: string }>(
    formsToken,
    `${DRIVE_API_BASE}/files/${args.sourceFormId}/copy?supportsAllDrives=true&fields=id,name`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: args.formTitle,
        parents: ['root'],
      }),
    },
  )
  if (!staged.id) {
    throw new Error(`Failed to copy teacher-ready Form ${args.sourceFormId} as ${FORMS_WORKSPACE_USER}`)
  }

  console.warn(
    `Copied teacher-ready Form ${staged.id} as ${FORMS_WORKSPACE_USER}; sharing and copying to teacher (no Playwright)…`,
  )

  return deliverConvertedFormToTeacher({
    formsAccessToken: formsToken,
    teacherAccessToken: args.teacherAccessToken,
    teacherEmail: args.teacherEmail,
    teacherFolderId: args.teacherFolderId,
    formId: staged.id,
    formTitle: staged.name?.trim() || args.formTitle,
  })
}

/**
 * Deliver a forms@ staging Form into the teacher's folder.
 *
 * Always share + teacher-owned copy (not ownership transfer): cross-domain transfer
 * and pending-owner acceptance frequently return 403 and abort unit export.
 */
async function deliverConvertedFormToTeacher(args: {
  formsAccessToken: string
  teacherAccessToken: string
  teacherEmail: string
  teacherFolderId: string
  formId: string
  formTitle: string
}): Promise<{ formId: string; name: string }> {
  try {
    await googleApiJson(
      args.formsAccessToken,
      `${DRIVE_API_BASE}/files/${args.formId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'user',
          role: 'writer',
          emailAddress: args.teacherEmail,
        }),
      },
    )
  } catch (error) {
    // Drive returns 403/400 when the writer permission already exists.
    if (!(error instanceof GoogleApiRequestError) || (error.status !== 400 && error.status !== 403)) {
      throw error
    }
  }

  const copied = await googleApiJson<{ id?: string; name?: string }>(
    args.teacherAccessToken,
    `${DRIVE_API_BASE}/files/${args.formId}/copy?supportsAllDrives=true&fields=id,name`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: args.formTitle,
        parents: [args.teacherFolderId],
      }),
    },
  )
  if (!copied.id) {
    throw new Error(`Teacher copy of converted Form ${args.formId} failed`)
  }

  // Best-effort cleanup of the forms@ staging copy.
  await googleApiJson(
    args.formsAccessToken,
    `${DRIVE_API_BASE}/files/${args.formId}?supportsAllDrives=true`,
    { method: 'DELETE' },
  ).catch((cleanupError) => {
    console.warn(
      `Could not trash forms@ staging Form ${args.formId}: ${(cleanupError as Error).message}`,
    )
  })

  // Do not create/reattach File upload folders here. After copy Google shows
  // “Missing File Upload folders” and the teacher (or Forms UI Restore) creates them.
  return { formId: copied.id, name: copied.name?.trim() || args.formTitle }
}

export class LibraryFormTeacherReadyMissingError extends Error {
  readonly code = 'TEACHER_READY_MISSING' as const

  constructor(assessmentTitle: string) {
    super(
      `Teacher-ready Google Form is missing for “${assessmentTitle}”. ` +
        'Digitize with File-upload conversion offline before exporting to Drive ' +
        '(Playwright convert is not run in the request path).',
    )
    this.name = 'LibraryFormTeacherReadyMissingError'
  }
}

/**
 * Place an editable Google Form in the teacher's export folder.
 *
 * Always replaces any previous Dott.it Form in that folder (never reuses).
 * Teacher Drive exports require a pre-converted teacher-ready template (no Playwright).
 * Preview convert / handout digitize stay on the offline digitize CLI.
 */
export async function createAssessmentFormInFolder(args: {
  accessToken: string
  unitCode: string
  assessmentId: string
  assessmentTitle: string
  folderId: string
  /** Google account email for the teacher receiving ownership after convert. */
  teacherEmail?: string
}): Promise<LibraryExportFileResult> {
  const formTitle = dottFormTitle(args.assessmentTitle)

  // Re-export always overwrites the teacher's previous Dott.it Form copy.
  const existing = await findExistingDottForm(
    args.accessToken,
    args.folderId,
    args.assessmentTitle,
  )
  if (existing) {
    await trashExistingDottFormArtifacts({
      accessToken: args.accessToken,
      lessonFolderId: args.folderId,
      formTitle: existing.name || formTitle,
      formId: existing.formId,
    })
  }

  const teacherReadyFormId = resolveTeacherReadyGoogleFormId(args.unitCode, args.assessmentId)
  const teacherEmail = args.teacherEmail?.trim()

  if (!teacherEmail || !teacherReadyFormId) {
    throw new LibraryFormTeacherReadyMissingError(args.assessmentTitle)
  }

  const transferred = await copyAsFormsWorkspaceThenTransfer({
    teacherAccessToken: args.accessToken,
    teacherEmail,
    teacherFolderId: args.folderId,
    sourceFormId: teacherReadyFormId,
    formTitle,
  })
  return {
    kind: 'google-form',
    name: transferred.name,
    url: googleFormViewUrlFromFormId(transferred.formId),
    action: 'copied',
  }
}
