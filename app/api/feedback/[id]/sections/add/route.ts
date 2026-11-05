import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/assessmentDB'
import { prisma } from '@/lib/prisma'
import {
  checkFeedbackTenantAccess,
  feedbackNotFoundResponse,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'

type FeedbackWithSections = Prisma.FeedbackGetPayload<{
  include: { feedbackSections: true }
}>

function formatFeedbackResponse(id: string, updatedFeedback: FeedbackWithSections) {
  return {
    id: updatedFeedback.id,
    assessmentRecordId: updatedFeedback.assessmentRecordId,
    status: updatedFeedback.status,
    feedbackSections: updatedFeedback.feedbackSections.map((s) => ({
      id: s.id,
      type: s.type,
      section: s.section,
      content: s.content,
      aiSuggestionsId: s.aiSuggestionsId ?? null,
      originalSectionId: s.originalSectionId ?? null,
      used: s.used ?? true,
      order: s.order,
      discarted: s.discarted ?? false,
      feedbackId: id,
    })),
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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
      type: string
      section: string
      content: string
      aiSuggestionsId?: string
      originalSectionId?: string
      used?: boolean
      discarted?: boolean
    }
    const { type, section, content, aiSuggestionsId, originalSectionId, used, discarted } = body ?? {}
    const sectionValue = String(section ?? type ?? '').trim()
    const typeValue = String(type ?? '').trim()
    // Empty content is allowed: rematerializing a completed snapshot can include blank rows.
    // Callers that need non-empty teacher notes should validate before POST.
    const contentValue = String(content ?? '').trim()

    if (!typeValue) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'type is required.',
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

    const originalKey =
      originalSectionId != null && String(originalSectionId).trim() !== ''
        ? String(originalSectionId).trim()
        : null

    const updatedFeedback = await prisma.$transaction(async (tx): Promise<FeedbackWithSections | null> => {
      if (originalKey) {
        const existingSection = await tx.feedbackSection.findFirst({
          where: { feedbackId: id, originalSectionId: originalKey },
        })
        if (existingSection) {
          return tx.feedback.findUnique({
            where: { id },
            include: { feedbackSections: true },
          })
        }
      }

      const lastSection = await tx.feedbackSection.findFirst({
        where: { feedbackId: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      const nextOrder = (lastSection?.order ?? -1) + 1

      await tx.feedbackSection.create({
        data: {
          feedbackId: id,
          type: typeValue,
          section: sectionValue || typeValue,
          content: contentValue,
          order: nextOrder,
          aiSuggestionsId: aiSuggestionsId ?? null,
          originalSectionId: originalKey,
          used: used ?? true,
          discarted: discarted ?? false,
        },
      })

      return tx.feedback.findUnique({
        where: { id },
        include: { feedbackSections: true },
      })
    })

    if (!updatedFeedback) {
      return NextResponse.json(
        {
          error: 'UNEXPECTED_ERROR',
          message: 'Feedback not found after update',
          type: 'UNEXPECTED_ERROR',
          retryable: true,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(formatFeedbackResponse(id, updatedFeedback), { status: 200 })
  } catch (error) {
    console.error('API(feedback section add POST):', error)
    return NextResponse.json(
      {
        error: 'Failed to add feedback section',
        message: 'Unable to add feedback section.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'CREATE_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
