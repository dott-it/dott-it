import { NextResponse } from 'next/server'
import { buildMaterialsZip, flattenUnitDownloadEntries } from '@/lib/library/export/build-materials-zip'
import {
  contentDispositionHeader,
  ensureFileExtension,
  sanitizeDownloadFileName,
} from '@/lib/library/export/download-drive-file'
import { GoogleApiRequestError } from '@/lib/library/export/google-api-fetch'
import { resolveLibraryExportGoogleToken } from '@/lib/library/export/google-export-session'
import {
  LibraryExportResolveError,
  resolveExportTargets,
} from '@/lib/library/export/resolve-export-targets'
import { resolveUnitExportTargets } from '@/lib/library/export/resolve-unit-export-targets'
import { libraryExportReturnToFromRequest } from '@/lib/library/export/safe-return-to'
import { findIngestedAssessment } from '@/lib/library/ingest/load-manifest'
import { libraryGoogleFormUrl } from '@/lib/library/materials/library-form-url'
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

function zipResponse(zipBytes: Uint8Array, filename: string, fileCount: number) {
  return new NextResponse(Buffer.from(zipBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': contentDispositionHeader(ensureFileExtension(filename, '.zip')),
      'Content-Length': String(zipBytes.byteLength),
      'X-Eddo-Download-File-Count': String(fileCount),
      'Cache-Control': 'no-store',
    },
  })
}

type AssessmentDownloadBody = {
  mode: 'assessment'
  unitCode: string
  assessmentId: string
  assessmentTitle?: string
  kinds: PackageItemKind[]
}

type UnitDownloadBody = {
  mode: 'unit'
  unitCode: string
}

function parseBody(body: unknown): AssessmentDownloadBody | UnitDownloadBody | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const record = body as Record<string, unknown>
  if (typeof record.unitCode !== 'string' || record.unitCode.trim() === '') {
    return null
  }

  if (record.mode === 'unit') {
    return { mode: 'unit', unitCode: record.unitCode }
  }

  if (record.mode !== 'assessment' && record.mode !== undefined) {
    return null
  }

  if (typeof record.assessmentId !== 'string' || !Array.isArray(record.kinds)) {
    return null
  }

  const kinds = record.kinds.filter(
    (kind): kind is PackageItemKind => typeof kind === 'string' && isPackageItemKind(kind),
  )
  if (kinds.length === 0) {
    return null
  }

  return {
    mode: 'assessment',
    unitCode: record.unitCode,
    assessmentId: record.assessmentId,
    assessmentTitle:
      typeof record.assessmentTitle === 'string' ? record.assessmentTitle : undefined,
    kinds,
  }
}

export async function POST(request: Request) {
  const payload = parseBody(await request.json().catch(() => null))
  if (!payload) {
    return NextResponse.json({ error: 'Invalid download request body' }, { status: 400 })
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
    // Use the teacher's OAuth token so downloads respect the same Drive Viewer ACLs as export.
    const accessToken = googleToken.accessToken

    if (payload.mode === 'unit') {
      const { assessments } = resolveUnitExportTargets(payload.unitCode)
      const entries = flattenUnitDownloadEntries(assessments)
      const formLinks = assessments.flatMap((assessment) => {
        const fromExternal = assessment.externalLinks.map((link) => ({
          folderPath: sanitizeDownloadFileName(assessment.assessmentTitle),
          link,
        }))
        const row = findIngestedAssessment(payload.unitCode, assessment.assessmentId)
        const existingUrl = libraryGoogleFormUrl(row?.files ?? { googleForm: null })?.trim()
        const fromGenerate =
          existingUrl?.startsWith('http') && assessment.formsToGenerate.length > 0
            ? assessment.formsToGenerate.map((target) => ({
                folderPath: sanitizeDownloadFileName(assessment.assessmentTitle),
                link: { kind: target.kind, label: target.label, url: existingUrl },
              }))
            : []
        return [...fromExternal, ...fromGenerate]
      })
      if (entries.length === 0 && formLinks.length === 0) {
        return NextResponse.json(
          { error: 'No downloadable materials for this unit', code: 'UNIT_EXPORT_EMPTY' },
          { status: 400 },
        )
      }

      const { zipBytes, fileCount } = await buildMaterialsZip({
        accessToken,
        entries,
        formLinks,
      })
      return zipResponse(zipBytes, `Unit ${payload.unitCode} materials.zip`, fileCount)
    }

    const { driveCopies, externalLinks, formsToGenerate } = resolveExportTargets({
      unitCode: payload.unitCode,
      assessmentId: payload.assessmentId,
      kinds: payload.kinds,
    })

    if (
      driveCopies.length === 0 &&
      externalLinks.length === 0 &&
      formsToGenerate.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'No downloadable materials for this selection',
          code: 'KIND_UNAVAILABLE',
        },
        { status: 400 },
      )
    }

    const folderName = sanitizeDownloadFileName(
      payload.assessmentTitle || payload.assessmentId,
    )

    // Zip cannot create live Forms — include an existing Form URL as a shortcut when present.
    const formLinksFromGenerate = formsToGenerate.flatMap((target) => {
      const row = findIngestedAssessment(payload.unitCode, payload.assessmentId)
      const url = libraryGoogleFormUrl(row?.files ?? { googleForm: null })?.trim()
      if (!url?.startsWith('http')) {
        return []
      }
      return [{ kind: target.kind, label: target.label, url }]
    })

    const { zipBytes, fileCount } = await buildMaterialsZip({
      accessToken,
      entries: driveCopies.map((target) => ({
        folderPath: folderName,
        target,
      })),
      formLinks: [...externalLinks, ...formLinksFromGenerate].map((link) => ({
        folderPath: folderName,
        link,
      })),
    })

    const zipName = `Unit ${payload.unitCode} - ${folderName || payload.assessmentId} materials.zip`
    return zipResponse(zipBytes, zipName, fileCount)
  } catch (error) {
    if (error instanceof LibraryExportResolveError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }

    if (error instanceof GoogleApiRequestError) {
      console.error('Library material download failed:', error)
      return NextResponse.json(
        {
          error:
            error.status === 403
              ? 'Your Google account cannot access the source materials. Ask your admin to grant Viewer access on the OpenSciEd shared drive.'
              : error.message,
          code: error.status === 403 ? 'DRIVE_ACCESS_DENIED' : 'DOWNLOAD_FAILED',
        },
        { status: error.status === 403 ? 403 : 500 },
      )
    }

    console.error('Library material download failed:', error)
    return NextResponse.json(
      { error: 'Failed to download materials', code: 'DOWNLOAD_FAILED' },
      { status: 500 },
    )
  }
}
