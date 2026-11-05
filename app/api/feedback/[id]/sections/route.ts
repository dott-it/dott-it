import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkFeedbackTenantAccess,
  feedbackNotFoundResponse,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  console.log('🚀 POST /api/feedback/[id]/sections called')

  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const { id } = await params

    const access = await checkFeedbackTenantAccess(authResult.auth, id)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const body = (await request.json()) as {
      feedbackSections?: Array<{ type: string; section: string; content: string }>
    }
    const { feedbackSections } = body ?? {}

    if (!feedbackSections || !Array.isArray(feedbackSections)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'feedbackSections is required and must be an array.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const existingFeedback = await prisma.feedback.findUnique({
      where: { id },
      include: { feedbackSections: true },
    })

    if (!existingFeedback) {
      return feedbackNotFoundResponse('Feedback not found')
    }

    await prisma.$transaction(async (tx) => {
      await tx.feedbackSection.deleteMany({
        where: { feedbackId: id },
      })

      if (feedbackSections.length > 0) {
        await tx.feedbackSection.createMany({
          data: feedbackSections.map((s) => ({
            feedbackId: id,
            type: String(s.type ?? ''),
            section: String(s.section ?? ''),
            content: String(s.content ?? ''),
          })),
        })
      }
    })

    const updatedFeedback = await prisma.feedback.findUnique({
      where: { id },
      include: { feedbackSections: true },
    })

    const formatted = {
      id: updatedFeedback!.id,
      assessmentRecordId: updatedFeedback!.assessmentRecordId,
      status: updatedFeedback!.status,
      feedbackSections: updatedFeedback!.feedbackSections.map((s) => ({
        id: s.id,
        type: s.type,
        section: s.section,
        content: s.content,
      })),
    }

    console.log('✅ Feedback sections updated successfully:', formatted.id)
    return NextResponse.json(formatted, { status: 200 })
  } catch (error) {
    console.error('API(feedback sections POST):', error)
    return NextResponse.json(
      {
        error: 'Failed to update feedback sections',
        message: 'Unable to update feedback sections.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UPDATE_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
