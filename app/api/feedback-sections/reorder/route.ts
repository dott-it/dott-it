import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  try {
    const { sections } = await req.json()

    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Use a transaction to update all sections atomically
    await prisma.$transaction(
      sections.map(({ id, order }: { id: string; order: number }) =>
        prisma.feedbackSection.update({
          where: { id },
          data: { order },
        }),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API(feedback-sections reorder):', error)
    return NextResponse.json(
      {
        error: 'Failed to reorder feedback sections',
        message: 'Unable to reorder feedback sections.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
