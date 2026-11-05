'use client'

import type { LibraryExportResponse } from '@/lib/library/export/types'
import type { PackageItemKind } from '@/lib/library/materials/types'

export class LibraryExportAuthRequiredError extends Error {
  constructor(readonly authUrl: string) {
    super('Google authorization required')
    this.name = 'LibraryExportAuthRequiredError'
  }
}

export class LibraryExportRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LibraryExportRequestError'
  }
}

export async function exportLibraryMaterials(args: {
  unitCode: string
  assessmentId: string
  assessmentTitle: string
  kinds: PackageItemKind[]
}): Promise<LibraryExportResponse> {
  const response = await fetch('/api/library/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unitCode: args.unitCode,
      assessmentId: args.assessmentId,
      assessmentTitle: args.assessmentTitle,
      kinds: args.kinds,
    }),
  })

  const data = (await response.json().catch(() => ({}))) as LibraryExportResponse & {
    error?: string
    code?: string
    authUrl?: string
  }

  if (response.status === 401 && data.code === 'GOOGLE_AUTH_REQUIRED' && data.authUrl) {
    throw new LibraryExportAuthRequiredError(data.authUrl)
  }

  if (!response.ok) {
    throw new LibraryExportRequestError(data.error ?? 'Export failed. Please try again.')
  }

  return data
}

export function redirectToGoogleExportAuth(authUrl: string) {
  const returnTo = `${globalThis.location.pathname}${globalThis.location.search}`
  const url = new URL(authUrl, globalThis.location.origin)
  if (!url.searchParams.has('returnTo')) {
    url.searchParams.set('returnTo', returnTo)
  }
  globalThis.location.assign(url.toString())
}
