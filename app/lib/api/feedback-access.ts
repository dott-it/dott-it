import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { WorkspaceAuthContext } from '@/app/lib/api/workspace-auth'
import { isBackofficeTenant } from '@/app/lib/api/backoffice-tenant'

export {
  requireWorkspaceAuth,
  workspaceUnauthorizedResponse as feedbackUnauthorizedResponse,
} from '@/app/lib/api/workspace-auth'

export type TenantAccessResult = 'ok' | 'not_found' | 'forbidden'

export function feedbackForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'Access denied.',
      details: 'You do not have access to this resource',
      type: 'FORBIDDEN_ERROR',
      retryable: false,
    },
    { status: 403 },
  )
}

export function feedbackNotFoundResponse(message = 'Resource not found'): NextResponse {
  return NextResponse.json(
    {
      error: 'NOT_FOUND',
      message,
      details: message,
      type: 'NOT_FOUND_ERROR',
      retryable: false,
    },
    { status: 404 },
  )
}

async function allowTenantAccess(
  auth: WorkspaceAuthContext,
  resourceTenantId: string,
): Promise<boolean> {
  if (resourceTenantId === auth.tenantId) return true
  return isBackofficeTenant(auth.tenantId)
}

export async function checkAssessmentTenantAccess(
  auth: WorkspaceAuthContext,
  assessmentId: string,
): Promise<TenantAccessResult> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { tenantId: true },
  })
  if (!assessment) return 'not_found'
  if (await allowTenantAccess(auth, assessment.tenantId)) return 'ok'
  return 'forbidden'
}

export async function checkAssessmentRecordTenantAccess(
  auth: WorkspaceAuthContext,
  assessmentRecordId: string,
): Promise<TenantAccessResult> {
  const record = await prisma.assessmentRecord.findUnique({
    where: { id: assessmentRecordId },
    select: { tenantId: true },
  })
  if (!record) return 'not_found'
  if (await allowTenantAccess(auth, record.tenantId)) return 'ok'
  return 'forbidden'
}

function tenantIdFromFeedback(
  feedback: { AssessmentRecord: { tenantId: string } } | null | undefined,
): string | undefined {
  return feedback?.AssessmentRecord?.tenantId
}

export async function checkFeedbackTenantAccess(
  auth: WorkspaceAuthContext,
  feedbackId: string,
): Promise<TenantAccessResult> {
  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      AssessmentRecord: { select: { tenantId: true } },
    },
  })
  const tenantId = tenantIdFromFeedback(feedback)
  if (!tenantId) return 'not_found'
  if (await allowTenantAccess(auth, tenantId)) return 'ok'
  return 'forbidden'
}

export async function checkFeedbackSectionTenantAccess(
  auth: WorkspaceAuthContext,
  sectionId: string,
): Promise<TenantAccessResult> {
  const section = await prisma.feedbackSection.findUnique({
    where: { id: sectionId },
    select: {
      Feedback: {
        select: {
          AssessmentRecord: { select: { tenantId: true } },
        },
      },
      aiSuggestions: {
        select: {
          studentAnswer: {
            select: {
              assessmentRecord: { select: { tenantId: true } },
            },
          },
        },
      },
    },
  })
  if (!section) return 'not_found'

  // Teacher feedback rows (pending/completed) resolve tenant via Feedback → AssessmentRecord.
  const feedbackTenantId = tenantIdFromFeedback(section.Feedback ?? undefined)
  if (feedbackTenantId) {
    if (await allowTenantAccess(auth, feedbackTenantId)) return 'ok'
    return 'forbidden'
  }

  // AI suggestion template rows have feedbackId=null; resolve via aiSuggestions instead.
  const aiTenantId = section.aiSuggestions?.studentAnswer?.assessmentRecord?.tenantId
  if (aiTenantId) {
    if (await allowTenantAccess(auth, aiTenantId)) return 'ok'
    return 'forbidden'
  }

  return 'not_found'
}

export async function checkAiSuggestionsTenantAccess(
  auth: WorkspaceAuthContext,
  aiSuggestionsId: string,
): Promise<TenantAccessResult> {
  const suggestion = await prisma.aiSuggestions.findUnique({
    where: { id: aiSuggestionsId },
    select: {
      studentAnswer: {
        select: {
          assessmentRecord: { select: { tenantId: true } },
        },
      },
    },
  })
  const tenantId = suggestion?.studentAnswer?.assessmentRecord?.tenantId
  if (!tenantId) return 'not_found'
  if (await allowTenantAccess(auth, tenantId)) return 'ok'
  return 'forbidden'
}

export async function checkFeedbackSectionIdsTenantAccess(
  auth: WorkspaceAuthContext,
  sectionIds: string[],
): Promise<TenantAccessResult> {
  const uniqueIds = [...new Set(sectionIds.filter(Boolean))]
  if (uniqueIds.length === 0) return 'ok'

  const sections = await prisma.feedbackSection.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      Feedback: {
        select: {
          AssessmentRecord: { select: { tenantId: true } },
        },
      },
    },
  })

  if (sections.length !== uniqueIds.length) return 'not_found'

  for (const section of sections) {
    const tenantId = tenantIdFromFeedback(section.Feedback ?? undefined)
    if (!tenantId || !(await allowTenantAccess(auth, tenantId))) {
      return 'forbidden'
    }
  }

  return 'ok'
}

export function tenantAccessToResponse(result: TenantAccessResult): NextResponse | null {
  if (result === 'ok') return null
  if (result === 'not_found') return feedbackNotFoundResponse()
  return feedbackForbiddenResponse()
}
