import { NextResponse } from 'next/server'
import { copyMaterialsToTeacherDrive } from '@/lib/library/export/copy-to-teacher-drive'
import { LibraryFormTeacherReadyMissingError } from '@/lib/library/export/create-form-in-folder'
import { libraryExportDriveForbiddenResponse } from '@/lib/library/export/drive-forbidden-message'
import { checkLibraryFormGenerationRateLimit, recordLibraryFormGenerationRateLimit } from '@/lib/library/export/form-generation-rate-limit'
import { GoogleApiRequestError } from '@/lib/library/export/google-api-fetch'
import { resolveLibraryExportGoogleToken } from '@/lib/library/export/google-export-session'
import {
  LibraryExportResolveError,
  resolveExportTargets,
} from '@/lib/library/export/resolve-export-targets'
import { libraryExportReturnToFromRequest } from '@/lib/library/export/safe-return-to'
import type { LibraryExportRequest, LibraryExportResponse } from '@/lib/library/export/types'
import type { PackageItemKind } from '@/lib/library/materials/types'

export const runtime = 'nodejs'
export const maxDuration = 300

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

function parseExportRequest(body: unknown): LibraryExportRequest | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const record = body as Record<string, unknown>
  if (
    typeof record.unitCode !== 'string' ||
    typeof record.assessmentId !== 'string' ||
    typeof record.assessmentTitle !== 'string' ||
    !Array.isArray(record.kinds)
  ) {
    return null
  }

  const kinds = record.kinds.filter((kind): kind is PackageItemKind => typeof kind === 'string' && isPackageItemKind(kind))
  if (kinds.length === 0) {
    return null
  }

  return {
    unitCode: record.unitCode,
    assessmentId: record.assessmentId,
    assessmentTitle: record.assessmentTitle,
    kinds,
  }
}

export async function POST(request: Request) {
  const payload = parseExportRequest(await request.json().catch(() => null))
  if (!payload) {
    return NextResponse.json({ error: 'Invalid export request body' }, { status: 400 })
  }

  const googleToken = await resolveLibraryExportGoogleToken()

  if (!googleToken) {
    const returnTo = libraryExportReturnToFromRequest(request)

    return NextResponse.json(
      {
        error: 'Google authorization required',
        code: 'GOOGLE_AUTH_REQUIRED',
        authUrl: `/api/library/export/auth/google?returnTo=${encodeURIComponent(returnTo)}`,
      },
      { status: 401 },
    )
  }

  try {
    const { driveCopies, externalLinks, formsToGenerate } = resolveExportTargets({
      unitCode: payload.unitCode,
      assessmentId: payload.assessmentId,
      kinds: payload.kinds,
    })

    if (formsToGenerate.length > 0) {
      const rateKey = googleToken.dottUserId ?? googleToken.email ?? 'anonymous'
      const rate = checkLibraryFormGenerationRateLimit({
        key: `assessment:${rateKey}`,
        consume: false,
      })
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error:
              'Form generation rate limit reached. Try again later, or export without Google Form.',
            code: 'FORM_GENERATION_RATE_LIMITED',
            retryAfterSeconds: rate.retryAfterSeconds,
          },
          {
            status: 429,
            headers: { 'Retry-After': String(rate.retryAfterSeconds) },
          },
        )
      }
    }

    const result = await copyMaterialsToTeacherDrive({
      accessToken: googleToken.accessToken,
      unitCode: payload.unitCode,
      assessmentId: payload.assessmentId,
      assessmentTitle: payload.assessmentTitle,
      driveCopies,
      externalLinks,
      formsToGenerate,
      teacherEmail: googleToken.email,
    })

    if (formsToGenerate.length > 0) {
      const rateKey = googleToken.dottUserId ?? googleToken.email ?? 'anonymous'
      recordLibraryFormGenerationRateLimit({ key: `assessment:${rateKey}` })
    }

    const response: LibraryExportResponse = {
      folderUrl: result.folderUrl,
      folderId: result.folderId,
      files: result.files,
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof LibraryExportResolveError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }

    if (error instanceof LibraryFormTeacherReadyMissingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 409 })
    }

    if (error instanceof GoogleApiRequestError && error.status === 403) {
      const body = libraryExportDriveForbiddenResponse(error)
      return NextResponse.json(body, { status: 403 })
    }

    console.error('Library export failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to export materials to Google Drive',
        code: 'EXPORT_FAILED',
      },
      { status: 500 },
    )
  }
}
