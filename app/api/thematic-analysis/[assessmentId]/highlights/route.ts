import { NextRequest, NextResponse } from 'next/server'
import {
  checkAssessmentTenantAccess,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'
import { getStudentHighlightPhrases } from '@/lib/thematic-analysis/get-student-highlight-phrases'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> },
) {
  try {
    const { assessmentId } = await params
    const learnerId = request.nextUrl.searchParams.get('learnerId')?.trim() ?? ''

    if (!learnerId) {
      return NextResponse.json(
        { error: 'learnerId is required' },
        { status: 400 },
      )
    }

    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const access = await checkAssessmentTenantAccess(
      authResult.auth,
      assessmentId,
    )
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const phrases = await getStudentHighlightPhrases({
      assessmentId,
      learnerId,
    })

    return NextResponse.json({ phrases })
  } catch (error) {
    console.error('Error fetching thematic highlight phrases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thematic highlight phrases' },
      { status: 500 },
    )
  }
}
