import { googleApiJson } from '@/lib/library/export/google-api-fetch'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const FOLDER_MIME = 'application/vnd.google-apps.folder'

export interface CreatedDriveFolder {
  id: string
  webViewLink: string
}

/**
 * Create a Drive folder (e.g. for student file responses that Forms API cannot host).
 */
export async function createDriveFolder(args: {
  accessToken: string
  parentId: string
  name: string
}): Promise<CreatedDriveFolder> {
  const response = await googleApiJson<{ id?: string; webViewLink?: string }>(
    args.accessToken,
    `${DRIVE_API_BASE}/files?fields=id,webViewLink&supportsAllDrives=true`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: args.name,
        mimeType: FOLDER_MIME,
        parents: [args.parentId],
      }),
    },
  )

  if (!response.id) {
    throw new Error(`Failed to create Drive folder: ${args.name}`)
  }

  return {
    id: response.id,
    webViewLink: response.webViewLink ?? `https://drive.google.com/drive/folders/${response.id}`,
  }
}
