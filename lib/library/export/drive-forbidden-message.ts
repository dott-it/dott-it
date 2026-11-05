import { GoogleApiRequestError } from './google-api-fetch'

export type LibraryExportDriveErrorCode = 'DRIVE_ACCESS_DENIED' | 'DRIVE_PERMISSION_DENIED'

/** Map Drive 403s to a teacher-facing message (not every 403 is Shared Drive Viewer). */
export function libraryExportDriveForbiddenResponse(error: GoogleApiRequestError): {
  error: string
  code: LibraryExportDriveErrorCode
} {
  const message = error.message.toLowerCase()
  const looksLikeSourceAccess =
    message.includes('shared drive') ||
    message.includes('shareddrive') ||
    message.includes('file not found') ||
    message.includes('not found') ||
    message.includes('insufficient permissions for this file') ||
    message.includes('the user does not have sufficient permissions') ||
    message.includes('caller does not have permission')

  if (looksLikeSourceAccess) {
    return {
      error:
        'Your Google account cannot access the source materials. Ask your admin to grant Viewer access on the OpenSciEd shared drive.',
      code: 'DRIVE_ACCESS_DENIED',
    }
  }

  return {
    error:
      'Google Drive denied a permission change while exporting. Try again, or reconnect Google and export a single assessment.',
    code: 'DRIVE_PERMISSION_DENIED',
  }
}
