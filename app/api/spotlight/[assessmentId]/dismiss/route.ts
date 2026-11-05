import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth.config'
import { withAuth } from '@/app/api/middleware/authorization.middleware'
import { userPrisma } from '@/lib/user-prisma'
import { dismissSpotlightCard } from '@/lib/spotlight/dismiss-spotlight'
import { isDottStaffEmail } from '@/lib/spotlight/is-dott-staff-email'
import type { DismissSpotlightResponse } from '@/types'

export const POST = withAuth(dismissSpotlight)

async function dismissSpotlight(
  _request: Request,
  context: { params: Promise<{ assessmentId: string }> },
): Promise<NextResponse<DismissSpotlightResponse | { error: string; message: string }>> {
  try {
    const { assessmentId } = await context.params
    const session = await auth()
    const email = session?.user?.email
    const tenantId = session?.user?.tenantId

    if (!tenantId || !email) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be signed in to dismiss a spotlight card.',
        },
        { status: 401 },
      )
    }

    const isStaff = isDottStaffEmail(email)
    const teacher = await userPrisma.teacher.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    })

    if (!teacher) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: isStaff
            ? 'Staff accounts need a Teacher profile to dismiss spotlight cards.'
            : 'Only teachers can dismiss spotlight cards.',
        },
        { status: 403 },
      )
    }

    const result = await dismissSpotlightCard({
      teacherId: teacher.id,
      tenantId,
      assessmentId,
      isStaff,
    })

    if (!result.ok) {
      if (result.reason === 'not_found') {
        return NextResponse.json(
          {
            error: 'Not found',
            message: 'Assessment not found.',
          },
          { status: 404 },
        )
      }
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You cannot dismiss a spotlight card for this assessment.',
        },
        { status: 403 },
      )
    }

    return NextResponse.json({ ok: true as const })
  } catch (error) {
    console.error('API: Unexpected error dismissing spotlight:', error)
    return NextResponse.json(
      {
        error: 'Unexpected error occurred',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while dismissing the spotlight card.',
      },
      { status: 500 },
    )
  }
}
