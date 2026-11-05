import { NextRequest, NextResponse } from 'next/server'
import { googleFormEmbedUrl } from '@/lib/library/materials/google-form-embed-url'
import { isIngestedLibraryGoogleFormUrl } from '@/lib/library/materials/is-ingested-library-form-url'
import { parseGoogleFormId } from '@/lib/library/workspace/parse-google-form'

export const runtime = 'nodejs'

/**
 * Build an embeddable URL for a catalog library Form (Quick look iframe).
 *
 * Read-only: no workspace token and no Forms publish/settings mutations.
 * Curriculum Forms must already be published at digitize time.
 */
export async function GET(request: NextRequest) {
  const formUrl = request.nextUrl.searchParams.get('formUrl')?.trim()
  if (!formUrl?.startsWith('https://')) {
    return NextResponse.json(
      { error: 'formUrl query param must be an https library Form URL' },
      { status: 400 },
    )
  }

  if (!isIngestedLibraryGoogleFormUrl(formUrl)) {
    return NextResponse.json(
      { error: 'formUrl is not a known OpenSciEd library Form', code: 'FORM_NOT_IN_CATALOG' },
      { status: 403 },
    )
  }

  const formId = parseGoogleFormId(formUrl)
  if (!formId) {
    return NextResponse.json(
      { error: 'formUrl must include a Forms API formId (/forms/d/{formId}/…)' },
      { status: 400 },
    )
  }

  return NextResponse.json(
    {
      formId,
      responderUri: formUrl,
      embedUrl: googleFormEmbedUrl(formUrl),
    },
    {
      headers: { 'Cache-Control': 'public, max-age=300' },
    },
  )
}
