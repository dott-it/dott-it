import { googleApiJson } from '@/lib/library/export/google-api-fetch'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'

/**
 * Share a Drive file so anyone with the link can view (Forms Quick look / Open).
 * Idempotent: ignores an existing anyone-with-link reader permission.
 */
export async function ensureAnyoneWithLinkReader(
  accessToken: string,
  fileId: string,
): Promise<void> {
  try {
    await googleApiJson(
      accessToken,
      `${DRIVE_API_BASE}/files/${fileId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'anyone',
          role: 'reader',
        }),
      },
    )
  } catch (error) {
    const message = (error as Error).message ?? ''
    // Drive returns 403/400 when the permission already exists.
    if (/already exists|duplicate|Condition not met/i.test(message)) {
      return
    }
    throw error
  }
}
