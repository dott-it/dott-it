import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth.config'
import { withAuth } from '@/app/api/middleware/authorization.middleware'
import { userPrisma } from '@/lib/user-prisma'
import { isEddoStaffEmail } from '@/lib/spotlight/is-eddo-staff-email'
import { listSpotlightCards } from '@/lib/spotlight/list-spotlight-cards'
import type { ApiError } from '@/app/types'
import type { SpotlightCardsResponse } from '@/types'

export const GET = withAuth(getSpotlightCards)

async function getSpotlightCards(): Promise<
  NextResponse<SpotlightCardsResponse | ApiError>
> {
  try {
    const session = await auth()
    const email = session?.user?.email
    const tenantId = session?.user?.tenantId

    if (!tenantId || !email) {
      return NextResponse.json([])
    }

    const isStaff = isEddoStaffEmail(email)
    const teacher = await userPrisma.teacher.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    })

    if (!isStaff && !teacher) {
      return NextResponse.json([])
    }

    const cards = await listSpotlightCards({
      scopeTeacherId: isStaff ? null : teacher!.id,
      dismissalTeacherId: teacher?.id ?? null,
    })

    return NextResponse.json(cards)
  } catch (error) {
    console.error('API: Unexpected error in spotlight fetch:', error)
    return NextResponse.json(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while loading spotlight cards.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
