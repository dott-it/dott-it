import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/assessmentDB'
import { prisma } from '@/lib/prisma'
import {
  checkFeedbackSectionTenantAccess,
  feedbackNotFoundResponse,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'
import {
  parseFeedbackSectionWhitelistPatch,
  shouldCascadePendingCopies,
  withOriginalAiContentSnapshot,
} from '@/app/lib/feedback/ai-feedback-section-update'

/** Prisma P2025: record not found — avoid importing @prisma/client in route bundle. */
function isPrismaRecordNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2025'
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireWorkspaceAuth(req)
    if (!authResult.ok) {
      return authResult.response
    }

    const { id } = await params
    const access = await checkFeedbackSectionTenantAccess(authResult.auth, id)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const section = await prisma.feedbackSection.findUnique({
      where: { id },
    })

    if (!section) {
      return feedbackNotFoundResponse('Feedback section not found')
    }

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error fetching feedback section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireWorkspaceAuth(req)
    if (!authResult.ok) {
      return authResult.response
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Feedback section id is required' }, { status: 400 })
    }

    const access = await checkFeedbackSectionTenantAccess(authResult.auth, id)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const body: unknown = await req.json()
    const parsed = parseFeedbackSectionWhitelistPatch(body)
    if (!parsed) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'No valid fields to update.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const existing = await prisma.feedbackSection.findUnique({ where: { id } })
    if (!existing) {
      return feedbackNotFoundResponse('Feedback section not found')
    }

    const merged = withOriginalAiContentSnapshot({
      section: {
        content: existing.content,
        originalAiContent: existing.originalAiContent,
        feedbackId: existing.feedbackId,
        aiSuggestionsId: existing.aiSuggestionsId,
      },
      patch: parsed,
    })

    const cascade = shouldCascadePendingCopies(existing, merged)
    const updateData = merged as Prisma.FeedbackSectionUpdateInput

    const updatedSection = await prisma.$transaction(async (tx) => {
      const updated = await tx.feedbackSection.update({
        where: { id },
        data: updateData,
      })

      if (cascade) {
        const cascadeData: Prisma.FeedbackSectionUpdateManyMutationInput = {}
        if (merged.content !== undefined) cascadeData.content = updated.content
        if (merged.type !== undefined) cascadeData.type = updated.type
        if (merged.section !== undefined) cascadeData.section = updated.section
        if (Object.keys(cascadeData).length > 0) {
          await tx.feedbackSection.updateMany({
            where: { originalSectionId: id },
            data: cascadeData,
          })
        }
      }

      return updated
    })

    return NextResponse.json(updatedSection)
  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      return feedbackNotFoundResponse('Feedback section not found')
    }
    console.error('Error updating feedback section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireWorkspaceAuth(req)
    if (!authResult.ok) {
      return authResult.response
    }

    const { id } = await params
    const access = await checkFeedbackSectionTenantAccess(authResult.auth, id)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    await prisma.feedbackSection.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (isPrismaRecordNotFoundError(error)) {
      return new NextResponse(null, { status: 204 })
    }
    console.error('Error deleting feedback section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
