import { googleApiJson } from '@/lib/library/export/google-api-fetch'
import { isDottFormNameForAssessment } from './naming'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const FORM_MIME = 'application/vnd.google-apps.form'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const SHORTCUT_MIME = 'application/vnd.google-apps.shortcut'

function escapeDriveQueryValue(value: string): string {
  return value.replaceAll("'", String.raw`\'`)
}

export interface ExistingDottForm {
  formId: string
  name: string
  /** True when the lesson folder only has a shortcut to a My Drive Form. */
  viaShortcut?: boolean
  shortcutId?: string
}

/**
 * Find an existing Dott.it-marked Form (or shortcut to one) in the lesson folder.
 */
export async function findExistingDottForm(
  accessToken: string,
  lessonFolderId: string,
  assessmentTitle: string,
): Promise<ExistingDottForm | null> {
  const q = [
    `'${escapeDriveQueryValue(lessonFolderId)}' in parents`,
    `(mimeType='${FORM_MIME}' or mimeType='${SHORTCUT_MIME}')`,
    'trashed=false',
  ].join(' and ')

  const response = await googleApiJson<{
    files?: Array<{
      id?: string
      name?: string
      mimeType?: string
      shortcutDetails?: { targetId?: string; targetMimeType?: string }
    }>
  }>(
    accessToken,
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,shortcutDetails)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  )

  for (const file of response.files ?? []) {
    if (!file.id || !file.name) {
      continue
    }
    if (!isDottFormNameForAssessment(file.name, assessmentTitle)) {
      continue
    }
    if (file.mimeType === SHORTCUT_MIME) {
      const targetId = file.shortcutDetails?.targetId
      if (!targetId) {
        continue
      }
      return {
        formId: targetId,
        name: file.name,
        viaShortcut: true,
        shortcutId: file.id,
      }
    }
    if (file.mimeType === FORM_MIME) {
      return { formId: file.id, name: file.name }
    }
  }

  return null
}

export function dottFormSiblingFolderNames(formTitle: string): string[] {
  return [`${formTitle} — assets`, `${formTitle} — uploads`, `${formTitle} — student uploads`]
}

async function trashDriveFile(accessToken: string, fileId: string): Promise<void> {
  await googleApiJson(
    accessToken,
    `${DRIVE_API_BASE}/files/${fileId}?supportsAllDrives=true`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trashed: true }),
    },
  )
}

async function findChildFoldersByNames(
  accessToken: string,
  parentId: string,
  names: string[],
): Promise<Array<{ id: string; name: string }>> {
  const wanted = new Set(names)
  const q = [
    `'${escapeDriveQueryValue(parentId)}' in parents`,
    `mimeType='${FOLDER_MIME}'`,
    'trashed=false',
  ].join(' and ')

  const response = await googleApiJson<{ files?: { id?: string; name?: string }[] }>(
    accessToken,
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  )

  const matches: Array<{ id: string; name: string }> = []
  for (const file of response.files ?? []) {
    if (file.id && file.name && wanted.has(file.name)) {
      matches.push({ id: file.id, name: file.name })
    }
  }
  return matches
}

/**
 * Trash an existing Dott.it Form / shortcut and sibling assets/uploads folders so --force replaces cleanly.
 */
export async function trashExistingDottFormArtifacts(args: {
  accessToken: string
  lessonFolderId: string
  formTitle: string
  formId?: string | null
}): Promise<void> {
  // Trash shortcuts in the lesson folder that point at this Form (or share the Dott.it title).
  const shortcutQuery = [
    `'${escapeDriveQueryValue(args.lessonFolderId)}' in parents`,
    `mimeType='${SHORTCUT_MIME}'`,
    'trashed=false',
  ].join(' and ')
  const shortcuts = await googleApiJson<{
    files?: Array<{ id?: string; name?: string; shortcutDetails?: { targetId?: string } }>
  }>(
    args.accessToken,
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(shortcutQuery)}&fields=files(id,name,shortcutDetails)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  )
  for (const file of shortcuts.files ?? []) {
    if (!file.id) {
      continue
    }
    if (
      (args.formId && file.shortcutDetails?.targetId === args.formId) ||
      file.name === args.formTitle
    ) {
      await trashDriveFile(args.accessToken, file.id)
    }
  }

  if (args.formId) {
    await trashDriveFile(args.accessToken, args.formId)
  }

  // Trash a same-named Form still sitting directly in the lesson folder.
  const formQuery = [
    `'${escapeDriveQueryValue(args.lessonFolderId)}' in parents`,
    `mimeType='${FORM_MIME}'`,
    'trashed=false',
  ].join(' and ')
  const listed = await googleApiJson<{ files?: Array<{ id?: string; name?: string }> }>(
    args.accessToken,
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(formQuery)}&fields=files(id,name)&pageSize=50&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  )
  for (const file of listed.files ?? []) {
    if (file.id && file.name === args.formTitle) {
      await trashDriveFile(args.accessToken, file.id)
    }
  }

  const folders = await findChildFoldersByNames(
    args.accessToken,
    args.lessonFolderId,
    dottFormSiblingFolderNames(args.formTitle),
  )
  for (const folder of folders) {
    await trashDriveFile(args.accessToken, folder.id)
  }
}

/**
 * @deprecated Prefer {@link placeFormForLessonFolder}. Moving into a Shared Drive
 * disables native File upload questions.
 */
export async function moveFormToLessonFolder(
  accessToken: string,
  formId: string,
  lessonFolderId: string,
): Promise<void> {
  await placeFormForLessonFolder(accessToken, formId, lessonFolderId)
}

/**
 * Keep the Form in forms@ My Drive (required for File upload) and place a shortcut
 * in the OpenSciEd lesson Shared Drive folder.
 */
export async function placeFormForLessonFolder(
  accessToken: string,
  formId: string,
  lessonFolderId: string,
): Promise<{ formId: string; shortcutId: string; copied: boolean }> {
  const placed = await ensureFormInMyDrive(accessToken, formId)
  const shortcutId = await ensureLessonShortcut(accessToken, placed.formId, lessonFolderId)
  return { formId: placed.formId, shortcutId, copied: placed.copied }
}

/**
 * Ensure a Form lives in the impersonated user's My Drive.
 * Native File upload is unavailable for Forms stored on Shared Drives.
 * If the Form cannot be moved out of a Shared Drive, copies it into My Drive and
 * returns the My Drive form id (caller should prefer that id going forward).
 */
export async function ensureFormInMyDrive(
  accessToken: string,
  formId: string,
): Promise<{ formId: string; copied: boolean }> {
  const meta = await googleApiJson<{ name?: string; parents?: string[]; driveId?: string }>(
    accessToken,
    `${DRIVE_API_BASE}/files/${formId}?fields=name,parents,driveId&supportsAllDrives=true`,
  )
  if (!meta.driveId) {
    return { formId, copied: false }
  }

  try {
    const previousParents = (meta.parents ?? []).join(',')
    const params = new URLSearchParams({
      addParents: 'root',
      supportsAllDrives: 'true',
      fields: 'id,parents,driveId',
    })
    if (previousParents) {
      params.set('removeParents', previousParents)
    }
    await googleApiJson(accessToken, `${DRIVE_API_BASE}/files/${formId}?${params.toString()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    return { formId, copied: false }
  } catch (moveError) {
    console.warn(
      `Could not move Form out of Shared Drive (${(moveError as Error).message}). Copying to My Drive instead…`,
    )
    const copied = await googleApiJson<{ id?: string }>(
      accessToken,
      `${DRIVE_API_BASE}/files/${formId}/copy?supportsAllDrives=true&fields=id`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: meta.name?.trim() || 'Dott.it Form',
          parents: ['root'],
        }),
      },
    )
    if (!copied.id) {
      throw new Error(`Failed to copy Shared Drive Form ${formId} into My Drive`)
    }
    return { formId: copied.id, copied: true }
  }
}

async function ensureLessonShortcut(
  accessToken: string,
  formId: string,
  lessonFolderId: string,
): Promise<string> {
  const form = await googleApiJson<{ name?: string }>(
    accessToken,
    `${DRIVE_API_BASE}/files/${formId}?fields=name&supportsAllDrives=true`,
  )
  const name = form.name?.trim() || 'Dott.it Form'

  const q = [
    `'${escapeDriveQueryValue(lessonFolderId)}' in parents`,
    `mimeType='${SHORTCUT_MIME}'`,
    'trashed=false',
  ].join(' and ')
  const listed = await googleApiJson<{
    files?: Array<{ id?: string; name?: string; shortcutDetails?: { targetId?: string } }>
  }>(
    accessToken,
    `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name,shortcutDetails)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
  )

  for (const file of listed.files ?? []) {
    if (file.id && file.shortcutDetails?.targetId === formId) {
      return file.id
    }
  }

  const created = await googleApiJson<{ id?: string }>(
    accessToken,
    `${DRIVE_API_BASE}/files?supportsAllDrives=true&fields=id`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: SHORTCUT_MIME,
        parents: [lessonFolderId],
        shortcutDetails: { targetId: formId },
      }),
    },
  )
  if (!created.id) {
    throw new Error(`Failed to create lesson-folder shortcut for form ${formId}`)
  }
  return created.id
}
