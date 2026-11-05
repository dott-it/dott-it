import { NextRequest, NextResponse } from 'next/server'
import {
  checkAssessmentTenantAccess,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'
import { refreshLearnerNamesForAssessment } from '@/lib/forms/refresh-learner-names-from-google'

export const maxDuration = 120

/**
 * POST /api/assessments/[id]/refresh-learner-names
 * Re-pull First/Last from the live Google Form and overwrite Learner.name.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: assessmentId } = await params

    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const access = await checkAssessmentTenantAccess(authResult.auth, assessmentId)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const result = await refreshLearnerNamesForAssessment(assessmentId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('refresh-learner-names failed:', error)
    const message = error instanceof Error ? error.message : 'Failed to refresh learner names'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
