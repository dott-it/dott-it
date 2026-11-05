import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  checkAiSuggestionsTenantAccess,
  checkFeedbackSectionIdsTenantAccess,
  checkFeedbackTenantAccess,
  requireWorkspaceAuth,
  tenantAccessToResponse,
} from '@/app/lib/api/feedback-access'
import type { WorkspaceAuthContext } from '@/app/lib/api/workspace-auth'
import { CreateFeedbackSectionParams } from '@/app/types/api/feedback-section'

async function assertListScope(
  auth: WorkspaceAuthContext,
  feedbackId: string | null,
  aiSuggestionsId: string | null,
): Promise<NextResponse | null> {
  if (!feedbackId && !aiSuggestionsId) {
    return NextResponse.json(
      {
        error: 'Validation error',
        message: 'feedbackId or aiSuggestionsId query parameter is required.',
        type: 'VALIDATION_ERROR',
        retryable: false,
      },
      { status: 400 },
    )
  }

  if (feedbackId) {
    const access = await checkFeedbackTenantAccess(auth, feedbackId)
    const response = tenantAccessToResponse(access)
    if (response) return response
  }

  if (aiSuggestionsId) {
    const access = await checkAiSuggestionsTenantAccess(auth, aiSuggestionsId)
    const response = tenantAccessToResponse(access)
    if (response) return response
  }

  return null
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireWorkspaceAuth(req)
    if (!authResult.ok) {
      return authResult.response
    }

    const { searchParams } = new URL(req.url)

    const feedbackId = searchParams.get('feedbackId')
    const aiSuggestionsId = searchParams.get('aiSuggestionsId')
    const type = searchParams.get('type')
    const used = searchParams.get('used')
    const discarted = searchParams.get('discarted')
    const section = searchParams.get('section')
    const orderBy = (searchParams.get('orderBy') as 'order' | 'createdAt' | 'updatedAt') || 'order'
    const orderDirection = (searchParams.get('orderDirection') as 'asc' | 'desc') || 'asc'
    const limit = searchParams.get('limit') ? Number.parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? Number.parseInt(searchParams.get('offset')!) : undefined

    const scopeError = await assertListScope(
      authResult.auth,
      feedbackId,
      aiSuggestionsId,
    )
    if (scopeError) {
      return scopeError
    }

    const where: Record<string, unknown> = {}
    if (feedbackId) where.feedbackId = feedbackId
    if (aiSuggestionsId) where.aiSuggestionsId = aiSuggestionsId
    if (type) where.type = type
    if (used !== null) where.used = used === 'true'
    if (discarted !== null) where.discarted = discarted === 'true'
    if (section) where.section = { contains: section, mode: 'insensitive' }

    const queryOptions: {
      where: Record<string, unknown>
      orderBy: Record<string, 'asc' | 'desc'>
      take?: number
      skip?: number
    } = {
      where,
      orderBy: { [orderBy]: orderDirection },
    }

    if (limit) queryOptions.take = limit
    if (offset) queryOptions.skip = offset

    const feedbackSections = await prisma.feedbackSection.findMany(queryOptions)

    return NextResponse.json(feedbackSections)
  } catch (error) {
    console.error('API(feedback-sections GET):', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch feedback sections',
        message: 'Unable to retrieve feedback sections.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'QUERY_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireWorkspaceAuth(req)
    if (!authResult.ok) {
      return authResult.response
    }

    const data = (await req.json()) as CreateFeedbackSectionParams

    if (!data.type || !data.section || !data.content) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'type, section, and content are required fields.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    if (!data.feedbackId) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'feedbackId is required.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const access = await checkFeedbackTenantAccess(authResult.auth, data.feedbackId)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    let nextOrder = 0
    const lastSection = await prisma.feedbackSection.findFirst({
      where: { feedbackId: data.feedbackId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    nextOrder = (lastSection?.order ?? -1) + 1

    const newSection = await prisma.feedbackSection.create({
      data: {
        feedbackId: data.feedbackId,
        type: data.type,
        section: data.section,
        content: data.content,
        order: data.order ?? nextOrder,
        discarted: data.discarted ?? false,
        used: data.used ?? false,
        aiSuggestionsId: data.aiSuggestionsId,
      },
    })

    return NextResponse.json(newSection, { status: 201 })
  } catch (error) {
    console.error('API(feedback-sections POST):', error)
    return NextResponse.json(
      {
        error: 'Failed to create feedback section',
        message: 'Unable to create feedback section.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'CREATE_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await requireWorkspaceAuth(req)
    if (!authResult.ok) {
      return authResult.response
    }

    const body = (await req.json()) as {
      sections?: Array<{ id: string; data: Record<string, unknown> }>
      reorder?: Array<{ id: string; order: number }>
    }

    const sectionIds: string[] = []
    if (body.sections && Array.isArray(body.sections)) {
      sectionIds.push(...body.sections.map((s) => s.id))
    }
    if (body.reorder && Array.isArray(body.reorder)) {
      sectionIds.push(...body.reorder.map((item) => item.id))
    }

    const access = await checkFeedbackSectionIdsTenantAccess(authResult.auth, sectionIds)
    const accessResponse = tenantAccessToResponse(access)
    if (accessResponse) {
      return accessResponse
    }

    if (body.sections && Array.isArray(body.sections)) {
      const results = await Promise.all(
        body.sections.map(async (section) => {
          return prisma.feedbackSection.update({
            where: { id: section.id },
            data: section.data,
          })
        }),
      )
      return NextResponse.json(results)
    }

    if (body.reorder && Array.isArray(body.reorder)) {
      const results = await Promise.all(
        body.reorder.map(async (item) => {
          return prisma.feedbackSection.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        }),
      )
      return NextResponse.json(results)
    }

    return NextResponse.json({ error: 'Invalid bulk operation' }, { status: 400 })
  } catch (error) {
    console.error('API(feedback-sections PATCH):', error)
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
