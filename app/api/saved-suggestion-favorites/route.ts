import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireWorkspaceAuth } from '@/app/lib/api/workspace-auth'
import { normalizeSuggestionFavoritePayload } from '@/app/lib/saved-suggestion-favorite/normalize-suggestion-favorite'

function formatFavorite(row: {
  id: string
  tenantId: string
  ownerUserId: string
  type: string
  section: string
  content: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ownerUserId: row.ownerUserId,
    type: row.type,
    section: row.section,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const rows = await prisma.savedSuggestionFavorite.findMany({
      where: {
        tenantId: authResult.auth.tenantId,
        ownerUserId: authResult.auth.ownerUserId,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(rows.map((row) => formatFavorite(row)))
  } catch (error) {
    console.error('API(saved-suggestion-favorites GET):', error)
    return NextResponse.json(
      {
        error: 'Failed to list favorites',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireWorkspaceAuth(request)
    if (!authResult.ok) {
      return authResult.response
    }

    const body = (await request.json()) as Record<string, unknown>
    const normalized = normalizeSuggestionFavoritePayload({
      type: body.type,
      section: body.section,
      content: body.content,
    })

    if (!normalized.ok) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: normalized.error },
        { status: 400 },
      )
    }

    const row = await prisma.savedSuggestionFavorite.upsert({
      where: {
        tenantId_ownerUserId_type_section_content: {
          tenantId: authResult.auth.tenantId,
          ownerUserId: authResult.auth.ownerUserId,
          type: normalized.value.type,
          section: normalized.value.section,
          content: normalized.value.content,
        },
      },
      create: {
        tenantId: authResult.auth.tenantId,
        ownerUserId: authResult.auth.ownerUserId,
        type: normalized.value.type,
        section: normalized.value.section,
        content: normalized.value.content,
      },
      update: {
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(formatFavorite(row), { status: 201 })
  } catch (error) {
    console.error('API(saved-suggestion-favorites POST):', error)
    return NextResponse.json(
      {
        error: 'Failed to create favorite',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
