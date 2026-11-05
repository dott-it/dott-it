import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireWorkspaceAuth } from '@/app/lib/api/workspace-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }
    const authCtx = authResult.auth

    const { id } = await params
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'id is required' },
        { status: 400 },
      )
    }

    const existing = await prisma.savedSuggestionFavorite.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Favorite not found' }, { status: 404 })
    }

    if (
      existing.tenantId !== authCtx.tenantId ||
      existing.ownerUserId !== authCtx.ownerUserId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Not allowed' }, { status: 403 })
    }

    await prisma.savedSuggestionFavorite.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('API(saved-suggestion-favorites DELETE):', error)
    return NextResponse.json(
      {
        error: 'Failed to delete favorite',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
