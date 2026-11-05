import { NextResponse } from 'next/server'
import { userPrisma } from '@/lib/user-prisma'
import { withBackofficeAccess, AuthorizedRequest } from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/tenants/[id]/users
 * Retrieve all users for a specific tenant
 */
async function getTenantUsersHandler(_request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id } = await context.params

    // Check if tenant exists
    const tenant = await userPrisma.tenant.findUnique({
      where: { id },
    })

    if (!tenant) {
      return NextResponse.json<ApiError>(
        {
          error: 'Not found',
          message: 'Tenant not found',
          details: `No tenant found with ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 }
      )
    }

    // Get all users for this tenant
    const users = await userPrisma.user.findMany({
      where: {
        tenantId: id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get additional information from related tables
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        // Check if user is a teacher
        const teacher = await userPrisma.teacher.findUnique({
          where: { userId: user.id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teacherNickname: true,
          },
        })

        // Count learners if user has any
        const learnerCount = await userPrisma.learner.count({
          where: { userId: user.id },
        })

        return {
          ...user,
          teacher: teacher || null,
          learnerCount,
        }
      })
    )

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      users: usersWithDetails,
      total: usersWithDetails.length,
    })
  } catch (error) {
    console.error('API: Error fetching tenant users:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching tenant users',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

export const GET = withBackofficeAccess(getTenantUsersHandler)

