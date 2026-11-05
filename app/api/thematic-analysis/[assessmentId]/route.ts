import { after, NextRequest, NextResponse } from 'next/server'
import {
  checkAssessmentTenantAccess,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'
import { findPreferredThematicAnalysis } from '@/lib/thematic-analysis/find-preferred-thematic-analysis'
import { formatThematicAnalysisResponse } from '@/lib/thematic-analysis/format-thematic-analysis-response'
import {
  RunThematicAnalysisError,
  continueThematicAnalysis,
  startThematicAnalysis,
} from '@/lib/thematic-analysis/run-thematic-analysis'

/** Manual POST schedules LLM via after(); align with cron route timeout. */
export const maxDuration = 300

function parseIncludeNames(request: NextRequest): boolean {
  const raw = request.nextUrl.searchParams.get('includeNames')
  return raw === '1' || raw === 'true'
}

async function authorizeThematicAnalysisRequest(
  request: NextRequest,
  assessmentId: string,
) {
  const authResult = await requireWorkspaceAuth(request)
  if (!authResult.ok) {
    return { ok: false as const, response: authResult.response }
  }

  const access = await checkAssessmentTenantAccess(
    authResult.auth,
    assessmentId,
  )
  const accessResponse = tenantAccessToResponse(access)
  if (accessResponse) {
    return { ok: false as const, response: accessResponse }
  }

  return { ok: true as const }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  try {
    const { assessmentId } = await params

    const authorization = await authorizeThematicAnalysisRequest(
      request,
      assessmentId,
    )
    if (!authorization.ok) {
      return authorization.response
    }

    const analysis = await findPreferredThematicAnalysis(assessmentId)

    return NextResponse.json(
      await formatThematicAnalysisResponse(assessmentId, analysis, {
        includeNames: parseIncludeNames(request),
      }),
    )
  } catch (error) {
    console.error('Error fetching thematic analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thematic analysis' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  try {
    const { assessmentId } = await params

    const authorization = await authorizeThematicAnalysisRequest(
      request,
      assessmentId,
    )
    if (!authorization.ok) {
      return authorization.response
    }

    const includeNames = parseIncludeNames(request)
    const started = await startThematicAnalysis(assessmentId, {
      enforceManualCooldown: true,
    })

    after(async () => {
      try {
        await continueThematicAnalysis(started)
      } catch (error) {
        console.error('Background thematic analysis failed:', error)
      }
    })

    return NextResponse.json(
      await formatThematicAnalysisResponse(assessmentId, started.analysis, {
        includeNames,
      }),
      { status: 202 },
    )
  } catch (error) {
    if (error instanceof RunThematicAnalysisError) {
      const statusByCode: Record<RunThematicAnalysisError['code'], number> = {
        assessment_not_found: 404,
        no_responses: 400,
        already_in_progress: 409,
        rate_limited: 429,
        llm_failed: 500,
      }
      const status = statusByCode[error.code] ?? 500
      return NextResponse.json({ error: error.message }, { status })
    }

    console.error('Error triggering thematic analysis:', error)
    return NextResponse.json(
      { error: 'Failed to trigger thematic analysis' },
      { status: 500 },
    )
  }
}
