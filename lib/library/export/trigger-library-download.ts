'use client'

import { toast } from 'sonner'

export class LibraryDownloadAuthRequiredError extends Error {
  constructor(readonly authUrl: string) {
    super('Google authorization required')
    this.name = 'LibraryDownloadAuthRequiredError'
  }
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null
  }

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1])
    } catch {
      return utfMatch[1]
    }
  }

  const plainMatch = /filename="([^"]+)"/i.exec(header)
  return plainMatch?.[1] ?? null
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export async function downloadLibraryMaterialsZip(
  body: Record<string, unknown>,
  fallbackFilename: string,
): Promise<void> {
  const response = await fetch('/api/library/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string
      code?: string
      authUrl?: string
    }
    if (response.status === 401 && data.code === 'GOOGLE_AUTH_REQUIRED' && data.authUrl) {
      throw new LibraryDownloadAuthRequiredError(data.authUrl)
    }
    throw new Error(data.error ?? 'Download failed. Please try again.')
  }

  const blob = await response.blob()
  const filename =
    filenameFromContentDisposition(response.headers.get('Content-Disposition')) ??
    fallbackFilename
  triggerBrowserDownload(blob, filename)

  const fileCountHeader = response.headers.get('X-Dott-Download-File-Count')
  const fileCount = fileCountHeader ? Number(fileCountHeader) : undefined
  toast.success('Download started', {
    description:
      fileCount && Number.isFinite(fileCount)
        ? `${fileCount} file${fileCount === 1 ? '' : 's'} packed into a zip.`
        : 'Materials zip is ready.',
    duration: 6000,
  })
}
