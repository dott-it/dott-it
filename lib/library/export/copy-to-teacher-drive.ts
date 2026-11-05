import { GoogleApiRequestError, googleApiJson } from './google-api-fetch'
import { createAssessmentFormInFolder } from './create-form-in-folder'
import {
  googleFormShortcutContents,
  googleFormShortcutFileName,
} from './google-form-shortcut'
import { getFormsWorkspaceAccessToken } from './impersonated-access-token'
import { FORMS_WORKSPACE_USER } from '@/lib/library/digitize/curriculum-example-notice'
import type {
  DriveCopyTarget,
  ExternalExportLink,
  GenerateFormTarget,
  LibraryExportFileResult,
} from './types'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const FOLDER_MIME = 'application/vnd.google-apps.folder'
const EXPORT_ROOT_FOLDER = 'Dott.it'
const EXPORT_CURRICULUM_FOLDER = 'OpenSciEd'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'

function escapeDriveQueryValue(value: string): string {
  return value.replaceAll("'", String.raw`\'`)
}

function driveUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${DRIVE_API_BASE}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

async function findFolderByName(
  accessToken: string,
  parentId: string,
  name: string,
): Promise<string | null> {
  const response = await googleApiJson<{ files?: { id: string }[] }>(
    accessToken,
    driveUrl('/files', {
      q: `name='${escapeDriveQueryValue(name)}' and '${parentId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`,
      fields: 'files(id)',
      pageSize: '1',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    }),
  )

  return response.files?.[0]?.id ?? null
}

async function createFolder(
  accessToken: string,
  parentId: string,
  name: string,
): Promise<string> {
  const response = await googleApiJson<{ id?: string }>(
    accessToken,
    driveUrl('/files', {
      fields: 'id',
      supportsAllDrives: 'true',
    }),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        parents: [parentId],
      }),
    },
  )

  if (!response.id) {
    throw new Error(`Failed to create Drive folder: ${name}`)
  }

  return response.id
}

async function findOrCreateFolder(
  accessToken: string,
  parentId: string,
  name: string,
): Promise<string> {
  const existing = await findFolderByName(accessToken, parentId, name)
  if (existing) {
    return existing
  }
  return createFolder(accessToken, parentId, name)
}

export async function ensureUnitExportFolder(
  accessToken: string,
  unitCode: string,
): Promise<string> {
  const dottRoot = await findOrCreateFolder(accessToken, 'root', EXPORT_ROOT_FOLDER)
  const curriculumFolder = await findOrCreateFolder(accessToken, dottRoot, EXPORT_CURRICULUM_FOLDER)
  return findOrCreateFolder(accessToken, curriculumFolder, `Unit ${unitCode}`)
}

export async function ensureExportFolder(
  accessToken: string,
  unitCode: string,
  assessmentTitle: string,
): Promise<string> {
  const unitFolder = await ensureUnitExportFolder(accessToken, unitCode)
  return findOrCreateFolder(accessToken, unitFolder, assessmentTitle)
}

function driveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}

function driveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`
}

async function uploadTextFileToFolder(args: {
  accessToken: string
  folderId: string
  fileName: string
  contents: string
}): Promise<{ id: string; name: string; webViewLink?: string }> {
  const boundary = `dott_boundary_${Date.now()}`
  const metadata = JSON.stringify({
    name: args.fileName,
    parents: [args.folderId],
  })
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/plain; charset=UTF-8\r\n\r\n` +
    `${args.contents}\r\n` +
    `--${boundary}--`

  const response = await fetch(
    `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Accept-Encoding': 'identity',
      },
      body,
    },
  )

  const data = (await response.json()) as {
    id?: string
    name?: string
    webViewLink?: string
    error?: { message?: string }
  }

  if (!response.ok || !data.id) {
    throw new Error(data.error?.message ?? `Failed to upload ${args.fileName} to Google Drive`)
  }

  return {
    id: data.id,
    name: data.name ?? args.fileName,
    webViewLink: data.webViewLink,
  }
}

async function copyDriveFileDirect(args: {
  accessToken: string
  folderId: string
  item: DriveCopyTarget
}): Promise<{ id: string; name: string; webViewLink?: string }> {
  const copied = await googleApiJson<{ id?: string; name?: string; webViewLink?: string }>(
    args.accessToken,
    driveUrl(`/files/${args.item.driveFileId}/copy`, {
      fields: 'id,name,webViewLink',
      supportsAllDrives: 'true',
    }),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: args.item.name.replace(/\.(docx|doc|pdf)$/i, ''),
        parents: [args.folderId],
      }),
    },
  )

  if (!copied.id) {
    throw new Error(`Failed to copy ${args.item.label} to Google Drive`)
  }

  return {
    id: copied.id,
    name: copied.name ?? args.item.name,
    webViewLink: copied.webViewLink,
  }
}

/**
 * When the teacher cannot read OpenSciEd Shared Drive sources, copy via forms@
 * (Workspace has Viewer), share with the teacher, then teacher-copy into their folder.
 */
async function copyDriveFileViaFormsWorkspace(args: {
  teacherAccessToken: string
  teacherEmail: string
  teacherFolderId: string
  item: DriveCopyTarget
}): Promise<{ id: string; name: string; webViewLink?: string }> {
  const formsToken = await getFormsWorkspaceAccessToken()
  const stagingName = args.item.name.replace(/\.(docx|doc|pdf)$/i, '')

  const staged = await googleApiJson<{ id?: string; name?: string }>(
    formsToken,
    driveUrl(`/files/${args.item.driveFileId}/copy`, {
      fields: 'id,name',
      supportsAllDrives: 'true',
    }),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: stagingName,
        parents: ['root'],
      }),
    },
  )
  if (!staged.id) {
    throw new Error(`Failed to stage ${args.item.label} as ${FORMS_WORKSPACE_USER}`)
  }

  try {
    await googleApiJson(
      formsToken,
      driveUrl(`/files/${staged.id}/permissions`, {
        supportsAllDrives: 'true',
        sendNotificationEmail: 'false',
      }),
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
    if (!(error instanceof GoogleApiRequestError) || (error.status !== 400 && error.status !== 403)) {
      throw error
    }
  }

  const copied = await googleApiJson<{ id?: string; name?: string; webViewLink?: string }>(
    args.teacherAccessToken,
    driveUrl(`/files/${staged.id}/copy`, {
      fields: 'id,name,webViewLink',
      supportsAllDrives: 'true',
    }),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: stagingName,
        parents: [args.teacherFolderId],
      }),
    },
  )
  if (!copied.id) {
    throw new Error(`Teacher copy of staged ${args.item.label} failed`)
  }

  await googleApiJson(formsToken, driveUrl(`/files/${staged.id}`, { supportsAllDrives: 'true' }), {
    method: 'DELETE',
  }).catch((cleanupError) => {
    console.warn(
      `Could not trash forms@ staging file ${staged.id}: ${(cleanupError as Error).message}`,
    )
  })

  return {
    id: copied.id,
    name: copied.name ?? stagingName,
    webViewLink: copied.webViewLink,
  }
}

async function copyDriveTargetIntoFolder(args: {
  teacherAccessToken: string
  teacherEmail?: string
  folderId: string
  item: DriveCopyTarget
}): Promise<{ id: string; name: string; webViewLink?: string }> {
  try {
    return await copyDriveFileDirect({
      accessToken: args.teacherAccessToken,
      folderId: args.folderId,
      item: args.item,
    })
  } catch (error) {
    if (
      !(error instanceof GoogleApiRequestError) ||
      error.status !== 403 ||
      !args.teacherEmail?.trim()
    ) {
      throw error
    }

    console.warn(
      `Teacher cannot copy ${args.item.driveFileId} (${error.message}); mediating via ${FORMS_WORKSPACE_USER}…`,
    )
    return copyDriveFileViaFormsWorkspace({
      teacherAccessToken: args.teacherAccessToken,
      teacherEmail: args.teacherEmail.trim(),
      teacherFolderId: args.folderId,
      item: args.item,
    })
  }
}

async function copyTargetsIntoFolder(
  accessToken: string,
  folderId: string,
  driveCopies: DriveCopyTarget[],
  externalLinks: ExternalExportLink[],
  formsToGenerate: GenerateFormTarget[] = [],
  generateContext?: { unitCode: string; assessmentId: string; teacherEmail?: string },
): Promise<LibraryExportFileResult[]> {
  const files: LibraryExportFileResult[] = []

  for (const item of driveCopies) {
    const copied = await copyDriveTargetIntoFolder({
      teacherAccessToken: accessToken,
      teacherEmail: generateContext?.teacherEmail,
      folderId,
      item,
    })

    files.push({
      kind: item.kind,
      name: copied.name ?? item.name,
      url: copied.webViewLink ?? driveFileUrl(copied.id),
      action: 'copied',
    })
  }

  for (const link of externalLinks) {
    const fileName = googleFormShortcutFileName(link.label)
    const uploaded = await uploadTextFileToFolder({
      accessToken,
      folderId,
      fileName,
      contents: googleFormShortcutContents(link.label, link.url),
    })

    files.push({
      kind: link.kind,
      name: uploaded.name,
      url: link.url,
      action: 'external-link',
    })
  }

  if (formsToGenerate.length > 0 && generateContext) {
    for (const target of formsToGenerate) {
      const created = await createAssessmentFormInFolder({
        accessToken,
        unitCode: generateContext.unitCode,
        assessmentId: generateContext.assessmentId,
        assessmentTitle: target.assessmentTitle,
        folderId,
        teacherEmail: generateContext.teacherEmail,
      })
      files.push(created)
    }
  }

  return files
}

export async function copyMaterialsToTeacherDrive(args: {
  accessToken: string
  unitCode: string
  assessmentId: string
  assessmentTitle: string
  driveCopies: DriveCopyTarget[]
  externalLinks: ExternalExportLink[]
  formsToGenerate?: GenerateFormTarget[]
  teacherEmail?: string
}): Promise<{ folderId: string; folderUrl: string; files: LibraryExportFileResult[] }> {
  const folderId = await ensureExportFolder(args.accessToken, args.unitCode, args.assessmentTitle)
  const files = await copyTargetsIntoFolder(
    args.accessToken,
    folderId,
    args.driveCopies,
    args.externalLinks,
    args.formsToGenerate ?? [],
    {
      unitCode: args.unitCode,
      assessmentId: args.assessmentId,
      teacherEmail: args.teacherEmail,
    },
  )

  return {
    folderId,
    folderUrl: driveFolderUrl(folderId),
    files,
  }
}

export async function copyUnitToTeacherDrive(args: {
  accessToken: string
  unitCode: string
  teacherEmail?: string
  assessments: Array<{
    assessmentId: string
    assessmentTitle: string
    driveCopies: DriveCopyTarget[]
    externalLinks: ExternalExportLink[]
    formsToGenerate?: GenerateFormTarget[]
  }>
}): Promise<{
  folderId: string
  folderUrl: string
  assessmentCount: number
  materialCount: number
  assessments: Array<{
    assessmentId: string
    assessmentTitle: string
    folderUrl: string
    files: LibraryExportFileResult[]
  }>
  externalLinks: LibraryExportFileResult[]
}> {
  const unitFolderId = await ensureUnitExportFolder(args.accessToken, args.unitCode)
  const assessments: Array<{
    assessmentId: string
    assessmentTitle: string
    folderUrl: string
    files: LibraryExportFileResult[]
  }> = []
  const externalLinks: LibraryExportFileResult[] = []
  let materialCount = 0

  for (const assessment of args.assessments) {
    const assessmentFolderId = await findOrCreateFolder(
      args.accessToken,
      unitFolderId,
      assessment.assessmentTitle,
    )
    const files = await copyTargetsIntoFolder(
      args.accessToken,
      assessmentFolderId,
      assessment.driveCopies,
      assessment.externalLinks,
      assessment.formsToGenerate ?? [],
      {
        unitCode: args.unitCode,
        assessmentId: assessment.assessmentId,
        teacherEmail: args.teacherEmail,
      },
    )

    const folderFiles = files.filter((file) => file.action === 'copied' || file.action === 'created')
    const linkedFiles = files.filter((file) => file.action === 'external-link')
    materialCount += files.length
    externalLinks.push(...linkedFiles)

    assessments.push({
      assessmentId: assessment.assessmentId,
      assessmentTitle: assessment.assessmentTitle,
      folderUrl: driveFolderUrl(assessmentFolderId),
      files: folderFiles,
    })
  }

  return {
    folderId: unitFolderId,
    folderUrl: driveFolderUrl(unitFolderId),
    assessmentCount: assessments.length,
    materialCount,
    assessments,
    externalLinks,
  }
}
