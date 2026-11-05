import { NextResponse } from 'next/server'
import { copyUnitToTeacherDrive } from '@/lib/library/export/copy-to-teacher-drive'
import { LibraryFormTeacherReadyMissingError } from '@/lib/library/export/create-form-in-folder'
import { libraryExportDriveForbiddenResponse } from '@/lib/library/export/drive-forbidden-message'
import { checkLibraryFormGenerationRateLimit, recordLibraryFormGenerationRateLimit } from '@/lib/library/export/form-generation-rate-limit'
import { GoogleApiRequestError } from '@/lib/library/export/google-api-fetch'
import { resolveLibraryExportGoogleToken } from '@/lib/library/export/google-export-session'
import { LibraryExportResolveError } from '@/lib/library/export/resolve-export-targets'
import { resolveUnitExportTargets } from '@/lib/library/export/resolve-unit-export-targets'
import { libraryExportReturnToFromRequest } from '@/lib/library/export/safe-return-to'
import type { LibraryUnitExportRequest, LibraryUnitExportResponse } from '@/lib/library/export/types'

export const runtime = 'nodejs'
export const maxDuration = 300

function parseUnitExportRequest(body: unknown): LibraryUnitExportRequest | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const record = body as Record<string, unknown>
  if (typeof record.unitCode !== 'string' || record.unitCode.trim() === '') {
    return null
  }

  return { unitCode: record.unitCode }
}

export async function POST(request: Request) {
  const payload = parseUnitExportRequest(await request.json().catch(() => null))
  if (!payload) {
    return NextResponse.json({ error: 'Invalid unit export request body' }, { status: 400 })
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
    const { assessments } = resolveUnitExportTargets(payload.unitCode)
    const formsToGenerateCount = assessments.reduce(
      (sum, assessment) => sum + (assessment.formsToGenerate?.length ?? 0),
      0,
    )

    if (formsToGenerateCount > 0) {
      const rateKey = googleToken.dottUserId ?? googleToken.email ?? 'anonymous'
      // Unit export can create many Forms — count as one burst against a tighter bucket.
      const rate = checkLibraryFormGenerationRateLimit({
        key: `unit:${rateKey}`,
        limit: 3,
        consume: false,
      })
      if (!rate.allowed) {
        return NextResponse.json(
          {
            error:
              'Form generation rate limit reached for unit export. Try again later, or export a single assessment without Google Form.',
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

    const result = await copyUnitToTeacherDrive({
      accessToken: googleToken.accessToken,
      unitCode: payload.unitCode,
      teacherEmail: googleToken.email,
      assessments,
    })

    if (formsToGenerateCount > 0) {
      const rateKey = googleToken.dottUserId ?? googleToken.email ?? 'anonymous'
      recordLibraryFormGenerationRateLimit({ key: `unit:${rateKey}` })
    }

    const response: LibraryUnitExportResponse = {
      folderUrl: result.folderUrl,
      folderId: result.folderId,
      assessmentCount: result.assessmentCount,
      materialCount: result.materialCount,
      assessments: result.assessments,
      externalLinks: result.externalLinks,
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

    console.error('Library unit export failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to export unit materials to Google Drive',
        code: 'EXPORT_FAILED',
      },
      { status: 500 },
    )
  }
}
