import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkAssessmentRecordTenantAccess,
  feedbackNotFoundResponse,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const { searchParams } = new URL(request.url)
    const assessmentRecordId = searchParams.get('assessmentRecordId')

    if (!assessmentRecordId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'assessmentRecordId query parameter is required.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const access = await checkAssessmentRecordTenantAccess(
      authResult.auth,
      assessmentRecordId,
    )
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { assessmentRecordId },
      include: { feedbackSections: true },
      orderBy: { id: 'desc' },
    })

    const formatted = feedbacks.map((fb) => ({
      id: fb.id,
      assessmentRecordId: fb.assessmentRecordId,
      status: fb.status,
      feedbackSections: fb.feedbackSections.map((s) => ({
        id: s.id,
        type: s.type,
        section: s.section,
        content: s.content,
      })),
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('API(feedback GET):', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch feedback',
        message: 'Unable to retrieve feedback records.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'QUERY_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('🚀 POST /api/feedback called')
  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const body = (await request.json()) as {
      assessmentRecordId?: string
      status?: string
      feedbackSections?: Array<{
        type: string
        section: string
        content: string
        order?: number
        used?: boolean | null
        discarted?: boolean | null
      }>
    }
    const { assessmentRecordId, status, feedbackSections } = body ?? {}

    if (!assessmentRecordId || typeof assessmentRecordId !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'assessmentRecordId is required and must be a string.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const access = await checkAssessmentRecordTenantAccess(
      authResult.auth,
      assessmentRecordId,
    )
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'status is required and must be a string.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    if (
      feedbackSections !== undefined &&
      Array.isArray(feedbackSections) &&
      feedbackSections.length === 0
    ) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'feedbackSections cannot be an empty array.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const created = await prisma.feedback.create({
      data: {
        assessmentRecordId,
        status,
        feedbackSections: feedbackSections?.length
          ? {
              create: feedbackSections.map((s, index) => ({
                type: String(s.type ?? ''),
                section: String(s.section ?? ''),
                content: String(s.content ?? ''),
                order: s.order ?? index,
                used: s.used ?? true,
                discarted: s.discarted ?? false,
              })),
            }
          : undefined,
      },
      include: { feedbackSections: true },
    })

    const formatted = {
      id: created.id,
      assessmentRecordId: created.assessmentRecordId,
      status: created.status,
      feedbackSections: created.feedbackSections.map((s) => ({
        id: s.id,
        type: s.type,
        section: s.section,
        content: s.content,
      })),
    }

    return NextResponse.json(formatted, { status: 201 })
  } catch (error) {
    console.error('API(feedback POST):', error)
    return NextResponse.json(
      {
        error: 'Failed to create feedback',
        message: 'Unable to create feedback record.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'CREATE_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  console.log('🧹 DELETE /api/feedback - Starting bulk delete')

  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const body = (await request.json()) as { assessmentRecordId: string }
    const { assessmentRecordId } = body ?? {}

    if (!assessmentRecordId) {
      return NextResponse.json(
        {
          error: 'INVALID_REQUEST',
          message: 'Missing assessmentRecordId',
          details: 'assessmentRecordId is required',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const access = await checkAssessmentRecordTenantAccess(
      authResult.auth,
      assessmentRecordId,
    )
    if (access === 'not_found') {
      return feedbackNotFoundResponse('Assessment record not found')
    }
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    const result = await prisma.$transaction(async (tx) => {
      const feedbacks = await tx.feedback.findMany({
        where: { assessmentRecordId },
        select: { id: true },
      })

      const feedbackIds = feedbacks.map((f) => f.id)

      if (feedbackIds.length > 0) {
        const usedAiSuggestions = await tx.feedbackSection.findMany({
          where: {
            feedbackId: {
              in: feedbackIds,
            },
            aiSuggestionsId: {
              not: null,
            },
          },
          select: { aiSuggestionsId: true },
        })

        const aiSuggestionsIds = usedAiSuggestions
          .map((s) => s.aiSuggestionsId)
          .filter((id): id is string => id !== null)

        if (aiSuggestionsIds.length > 0) {
          await tx.aiSuggestions.updateMany({
            where: {
              id: {
                in: aiSuggestionsIds,
              },
            },
            data: {
              used: false,
            },
          })
        }

        await tx.feedbackSection.deleteMany({
          where: {
            feedbackId: {
              in: feedbackIds,
            },
            aiSuggestionsId: null,
          },
        })

        const deletedFeedbacks = await tx.feedback.deleteMany({
          where: { assessmentRecordId },
        })

        return { ...deletedFeedbacks, restoredAiSuggestions: aiSuggestionsIds.length }
      }

      return { count: 0, restoredAiSuggestions: 0 }
    })

    console.log(
      '🧹 Deleted feedbacks:',
      result.count,
      'Restored AI suggestions:',
      result.restoredAiSuggestions,
    )
    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      restoredAiSuggestions: result.restoredAiSuggestions,
    })
  } catch (error) {
    console.error('API(feedback DELETE):', error)
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        message: 'Failed to delete feedbacks',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
