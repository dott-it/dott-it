import { GoogleApiRequestError, googleApiJson } from './google-api-fetch'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PDF_MIME = 'application/pdf'
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

/** Google Docs Editors mime types that require /export instead of alt=media. */
const GOOGLE_EXPORT_MAP: Record<string, { exportMime: string; extension: string }> = {
  'application/vnd.google-apps.document': { exportMime: DOCX_MIME, extension: '.docx' },
  'application/vnd.google-apps.spreadsheet': { exportMime: XLSX_MIME, extension: '.xlsx' },
  'application/vnd.google-apps.presentation': { exportMime: PPTX_MIME, extension: '.pptx' },
  'application/vnd.google-apps.drawing': { exportMime: PDF_MIME, extension: '.pdf' },
}

function driveAuthHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    // Avoid gzip decompression issues with Next.js/undici in route handlers.
    'Accept-Encoding': 'identity',
  }
}

async function fetchDriveBinary(
  accessToken: string,
  url: string,
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const response = await fetch(url, { headers: driveAuthHeaders(accessToken) })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new GoogleApiRequestError(
      message || `Failed to download Drive file (${response.status})`,
      response.status,
    )
  }

  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
  }
}

export async function downloadDriveFileBytes(
  accessToken: string,
  driveFileId: string,
): Promise<{ bytes: ArrayBuffer; contentType: string; fileName?: string; extension?: string }> {
  const meta = await googleApiJson<{ name?: string; mimeType?: string }>(
    accessToken,
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?fields=name,mimeType&supportsAllDrives=true`,
  )

  const mimeType = meta.mimeType ?? 'application/octet-stream'
  const exportConfig = GOOGLE_EXPORT_MAP[mimeType]

  if (exportConfig) {
    const exportUrl = new URL(`https://www.googleapis.com/drive/v3/files/${driveFileId}/export`)
    exportUrl.searchParams.set('mimeType', exportConfig.exportMime)
    const downloaded = await fetchDriveBinary(accessToken, exportUrl.toString())
    return {
      ...downloaded,
      contentType: exportConfig.exportMime,
      fileName: meta.name,
      extension: exportConfig.extension,
    }
  }

  const mediaUrl = new URL(`https://www.googleapis.com/drive/v3/files/${driveFileId}`)
  mediaUrl.searchParams.set('alt', 'media')
  mediaUrl.searchParams.set('supportsAllDrives', 'true')
  const downloaded = await fetchDriveBinary(accessToken, mediaUrl.toString())
  return {
    ...downloaded,
    fileName: meta.name,
  }
}

const GOOGLE_PDF_EXPORT_MIMES = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.drawing',
])

/**
 * PDF bytes for in-app Quick look (Google Docs Editors → export; native PDF → media).
 * Binary uploaded Office files cannot be exported to PDF via Drive alone.
 */
export async function downloadDriveFilePdfBytes(
  accessToken: string,
  driveFileId: string,
): Promise<{ bytes: ArrayBuffer; fileName?: string }> {
  const meta = await googleApiJson<{ name?: string; mimeType?: string }>(
    accessToken,
    `https://www.googleapis.com/drive/v3/files/${driveFileId}?fields=name,mimeType&supportsAllDrives=true`,
  )

  const mimeType = meta.mimeType ?? 'application/octet-stream'

  if (mimeType === PDF_MIME) {
    const mediaUrl = new URL(`https://www.googleapis.com/drive/v3/files/${driveFileId}`)
    mediaUrl.searchParams.set('alt', 'media')
    mediaUrl.searchParams.set('supportsAllDrives', 'true')
    const downloaded = await fetchDriveBinary(accessToken, mediaUrl.toString())
    return { bytes: downloaded.bytes, fileName: meta.name }
  }

  if (GOOGLE_PDF_EXPORT_MIMES.has(mimeType)) {
    const exportUrl = new URL(`https://www.googleapis.com/drive/v3/files/${driveFileId}/export`)
    exportUrl.searchParams.set('mimeType', PDF_MIME)
    const downloaded = await fetchDriveBinary(accessToken, exportUrl.toString())
    return { bytes: downloaded.bytes, fileName: meta.name }
  }

  throw new GoogleApiRequestError(
    `Cannot preview ${mimeType} as PDF (Drive file ${driveFileId})`,
    415,
  )
}

export function sanitizeDownloadFileName(name: string): string {
  const trimmed = name.trim() || 'material'
  const unsafe = new Set(String.raw`<>:"/\|?*`)
  return [...trimmed]
    .map((char) => {
      const code = char.codePointAt(0) ?? 0
      if (code <= 0x1F || unsafe.has(char)) {
        return '_'
      }
      return char
    })
    .join('')
    .slice(0, 180)
}

/** HTTP headers must be Latin-1 ByteStrings; put Unicode only in filename*. */
export function contentDispositionHeader(
  filename: string,
  disposition: 'attachment' | 'inline' = 'attachment',
): string {
  const cleaned = sanitizeDownloadFileName(filename).replaceAll('"', '')
  const asciiFallback = [...cleaned]
    .map((char) => ((char.codePointAt(0) ?? 0) <= 0xFF ? char : '_'))
    .join('')
    .replaceAll(/_+/g, '_')
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`
}

export function driveFileViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}

export function ensureFileExtension(name: string, fallbackExtension = '.docx'): string {
  if (/\.[a-z0-9]{2,5}$/i.test(name)) {
    return name
  }
  return `${name}${fallbackExtension}`
}

export function withPreferredExtension(name: string, preferredExtension?: string): string {
  if (!preferredExtension) {
    return ensureFileExtension(name)
  }
  const sanitized = sanitizeDownloadFileName(name)
  if (/\.[a-z0-9]{2,5}$/i.test(sanitized)) {
    return sanitized.replace(/\.[a-z0-9]{2,5}$/i, preferredExtension)
  }
  return `${sanitized}${preferredExtension}`
}
