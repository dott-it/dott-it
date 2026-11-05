import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromRequest, verifyAuthToken } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  console.log('🤖 PATCH /api/ai-suggestions/[id] called')

  try {
    const token = getTokenFromRequest(request)
    const payload = token ? verifyAuthToken(token) : null

    if (!payload) {
      console.log('❌ Authentication failed - returning 401')
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Authentication required.',
          details: 'Missing or invalid auth token',
          type: 'UNEXPECTED_ERROR',
          retryable: false,
        },
        { status: 401 },
      )
    }

    const { id } = await params
    const body = (await request.json()) as {
      used?: boolean
      discarted?: boolean
    }

    console.log('🔍 Updating AI suggestion:', { id, body })

    if (!id) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'AI suggestion ID is required.',
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    // Using the global Prisma client singleton. Do not call $connect()/$disconnect() per-request
    // Check if AI suggestion exists
    const existingSuggestion = await prisma.aiSuggestions.findUnique({
      where: { id },
    })

    if (!existingSuggestion) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'AI suggestion not found',
          details: `No AI suggestion with ID ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 },
      )
    }

    // Update the AI suggestion
    const updatedSuggestion = await prisma.aiSuggestions.update({
      where: { id },
      data: {
        used: body.used,
        discarted: body.discarted,
      },
    })

    console.log('✅ AI suggestion updated successfully:', updatedSuggestion.id)

    return NextResponse.json({
      id: updatedSuggestion.id,
      used: updatedSuggestion.used,
      discarted: updatedSuggestion.discarted,
    })
  } catch (error) {
    console.error('API(ai-suggestions PATCH):', error)
    return NextResponse.json(
      {
        error: 'Failed to update AI suggestion',
        message: 'Unable to update AI suggestion.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UPDATE_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
