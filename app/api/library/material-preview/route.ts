import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth.config'
import {
  contentDispositionHeader,
  downloadDriveFilePdfBytes,
  driveFileViewUrl,
  sanitizeDownloadFileName,
} from '@/lib/library/export/download-drive-file'
import { GoogleApiRequestError } from '@/lib/library/export/google-api-fetch'
import {
  LibraryExportResolveError,
  resolveExportTargets,
} from '@/lib/library/export/resolve-export-targets'
import { getLibraryDriveServiceAccountAccessToken } from '@/lib/library/export/service-account-token'
import { isDriveDocumentPreviewKind } from '@/lib/library/materials/library-material-preview-url'
import type { PackageItemKind } from '@/lib/library/materials/types'

export const runtime = 'nodejs'
export const maxDuration = 60

function isPackageItemKind(value: string): value is PackageItemKind {
  return [
    'student-handout',
    'google-form',
    'teacher-guide',
    'answer-key',
    'rubric',
    'guidance-sheet',
  ].includes(value)
}

/**
 * Stream a catalog material as PDF for Quick look (service account + Dott.it session).
 * Requires a signed-in Dott.it user — the public library catalog must not expose answer keys
 * / teacher guides as anonymous PDF downloads via the Drive service account.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Sign in required to preview materials', code: 'AUTH_REQUIRED' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const unitCode = request.nextUrl.searchParams.get('unitCode')?.trim()
  const assessmentId = request.nextUrl.searchParams.get('assessmentId')?.trim()
  const kindParam = request.nextUrl.searchParams.get('kind')?.trim()

  if (!unitCode || !assessmentId || !kindParam || !isPackageItemKind(kindParam)) {
    return NextResponse.json(
      { error: 'unitCode, assessmentId, and kind query params are required' },
      { status: 400 },
    )
  }

  if (!isDriveDocumentPreviewKind(kindParam)) {
    return NextResponse.json(
      { error: `Kind ${kindParam} is not previewable as a document`, code: 'KIND_NOT_PREVIEWABLE' },
      { status: 400 },
    )
  }

  let openInDriveUrl: string | undefined

  try {
    const { driveCopies } = resolveExportTargets({
      unitCode,
      assessmentId,
      kinds: [kindParam],
    })
    const target = driveCopies[0]
    if (!target?.driveFileId) {
      return NextResponse.json(
        { error: 'No Drive file for this material', code: 'KIND_UNAVAILABLE' },
        { status: 404 },
      )
    }

    openInDriveUrl = driveFileViewUrl(target.driveFileId)
    const accessToken = await getLibraryDriveServiceAccountAccessToken()
    const pdf = await downloadDriveFilePdfBytes(accessToken, target.driveFileId)
    const baseName = sanitizeDownloadFileName(pdf.fileName ?? target.name ?? kindParam)
    const filename = baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`

    return new NextResponse(Buffer.from(pdf.bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDispositionHeader(filename, 'inline'),
        'Content-Length': String(pdf.bytes.byteLength),
        // Authenticated sensitive materials — do not cache at CDN/shared caches.
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    if (error instanceof LibraryExportResolveError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === 'ASSESSMENT_NOT_FOUND' ? 404 : 400 },
      )
    }
    if (error instanceof GoogleApiRequestError) {
      if (error.status === 415) {
        return NextResponse.json(
          {
            error:
              'This file type cannot be previewed as a PDF in the browser. Open it in Drive or make a copy instead.',
            code: 'PREVIEW_UNSUPPORTED_TYPE',
            ...(openInDriveUrl ? { openInDriveUrl } : {}),
          },
          { status: 415, headers: { 'Cache-Control': 'no-store' } },
        )
      }

      return NextResponse.json(
        {
          error: error.message,
          code: 'DRIVE_PREVIEW_FAILED',
          ...(openInDriveUrl ? { openInDriveUrl } : {}),
        },
        {
          status: error.status >= 400 && error.status < 600 ? error.status : 502,
          headers: { 'Cache-Control': 'no-store' },
        },
      )
    }
    console.error('Library material preview failed:', error)
    return NextResponse.json({ error: 'Failed to preview material' }, { status: 500 })
  }
}
