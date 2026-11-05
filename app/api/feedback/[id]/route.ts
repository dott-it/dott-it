import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkFeedbackTenantAccess,
  feedbackNotFoundResponse,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'
import type { Feedback } from '@/app/types/api/feedback.api'

type SectionInput = {
  type: string
  section: string
  content: string
  used?: boolean | null
  discarted?: boolean | null
  order?: number
  aiSuggestionsId?: string | null
  originalSectionId?: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const access = await checkFeedbackTenantAccess(authResult.auth, id)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const fb = await prisma.feedback.findUnique({
      where: { id },
      include: { feedbackSections: true },
    })

    if (!fb) {
      return feedbackNotFoundResponse('Feedback not found')
    }

    return NextResponse.json(fb)
  } catch (error) {
    console.error('API(feedback [id] GET):', error)
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        message: 'Failed to fetch feedback',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const access = await checkFeedbackTenantAccess(authResult.auth, id)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const body = (await request.json()) as Partial<Feedback>
    const { feedbackSections, ...feedbackData } = body ?? {}

    const existing = await prisma.feedback.findUnique({ where: { id } })
    if (!existing) {
      return feedbackNotFoundResponse('Feedback not found')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const fb = await tx.feedback.update({
        where: { id },
        data: {
          ...feedbackData,
        },
      })

      if (Array.isArray(feedbackSections)) {
        await tx.feedbackSection.deleteMany({ where: { feedbackId: fb.id } })
        if (feedbackSections.length > 0) {
          await tx.feedbackSection.createMany({
            data: feedbackSections.map((s: SectionInput) => ({
              feedbackId: fb.id,
              type: String(s.type ?? ''),
              section: String(s.section ?? ''),
              content: String(s.content ?? ''),
              used: s.used ?? false,
              discarted: s.discarted ?? false,
              originalSectionId: s.originalSectionId,
              order: s.order,
              aiSuggestionsId: s.aiSuggestionsId ?? null,
            })),
          })
        }
      }

      const reloaded = await tx.feedback.findUnique({
        where: { id: fb.id },
        include: { feedbackSections: true },
      })
      return reloaded!
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('API(feedback [id] PATCH):', error)
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        message: 'Failed to update feedback',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const access = await checkFeedbackTenantAccess(authResult.auth, id)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const existingFeedback = await prisma.feedback.findUnique({ where: { id } })
    if (!existingFeedback) {
      return feedbackNotFoundResponse('Feedback not found')
    }

    await prisma.feedbackSection.deleteMany({ where: { feedbackId: id } })
    await prisma.feedback.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API(feedback [id] DELETE):', error)
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        message: 'Failed to delete feedback',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
