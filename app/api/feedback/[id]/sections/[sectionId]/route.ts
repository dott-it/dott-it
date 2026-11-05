import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkFeedbackSectionTenantAccess,
  checkFeedbackTenantAccess,
  feedbackNotFoundResponse,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> },
): Promise<NextResponse> {
  console.log('🗑️ DELETE /api/feedback/[id]/sections/[sectionId] called')

  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const { id: feedbackId, sectionId } = await params

    const feedbackAccess = await checkFeedbackTenantAccess(authResult.auth, feedbackId)
    const feedbackAccessResponse = tenantAccessToResponse(feedbackAccess)
    if (feedbackAccessResponse) {
      return feedbackAccessResponse
    }

    const sectionAccess = await checkFeedbackSectionTenantAccess(authResult.auth, sectionId)
    const sectionAccessResponse = tenantAccessToResponse(sectionAccess)
    if (sectionAccessResponse) {
      return sectionAccessResponse
    }

    console.log('🗑️ Deleting feedback section:', { feedbackId, sectionId })

    const section = await prisma.feedbackSection.findFirst({
      where: {
        id: sectionId,
        feedbackId,
      },
    })

    if (!section) {
      return feedbackNotFoundResponse('Feedback section not found')
    }

    await prisma.feedbackSection.delete({
      where: {
        id: sectionId,
      },
    })

    console.log('✅ Feedback section deleted successfully:', sectionId)

    return NextResponse.json({
      message: 'Feedback section deleted successfully',
      deletedSectionId: sectionId,
    })
  } catch (error) {
    console.error('❌ Error deleting feedback section:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete feedback section',
        message: 'Unable to delete feedback section.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'DELETE_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
