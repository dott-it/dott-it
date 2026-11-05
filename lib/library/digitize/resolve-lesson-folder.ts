import { googleApiJson } from '@/lib/library/export/google-api-fetch'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

/**
 * Resolve the lesson Drive folder by reading the handout file parent.
 * Drive index stores files only — folder IDs come from the API at digitize time.
 */
export async function resolveLessonFolderId(
  accessToken: string,
  handoutDriveFileId: string,
): Promise<string> {
  const meta = await googleApiJson<{ parents?: string[] }>(
    accessToken,
    `${DRIVE_API_BASE}/files/${handoutDriveFileId}?fields=parents&supportsAllDrives=true`,
  )

  const parentId = meta.parents?.[0]
  if (!parentId) {
    throw new Error(`Handout ${handoutDriveFileId} has no parent folder on Drive`)
  }

  return parentId
}
