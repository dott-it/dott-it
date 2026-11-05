import { NextResponse } from 'next/server'
import { userPrisma } from '@/lib/user-prisma'
import { withBackofficeAccess, AuthorizedRequest } from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/users/[id]
 * Retrieve a specific user
 */
async function getUserHandler(_request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id } = await context.params

    const user = await userPrisma.user.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json<ApiError>(
        {
          error: 'Not found',
          message: 'User not found',
          details: `No user found with ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      emailVerified: user.emailVerified,
      tenantId: user.tenantId,
      active: user.active,
      tenant: user.tenant
        ? {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (error) {
    console.error('API: Error fetching user:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching the user',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/[id]
 * Update a user (mainly to change tenant)
 */
async function updateUserHandler(request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { tenantId, role, active } = body

    // Check if user exists
    const existingUser = await userPrisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json<ApiError>(
        {
          error: 'Not found',
          message: 'User not found',
          details: `No user found with ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 }
      )
    }

    // If tenantId is being updated, verify tenant exists
    if (tenantId !== undefined) {
      const tenant = await userPrisma.tenant.findUnique({
        where: { id: tenantId },
      })

      if (!tenant) {
        return NextResponse.json<ApiError>(
          {
            error: 'Not found',
            message: 'Tenant not found',
            details: `No tenant found with ID: ${tenantId}`,
            type: 'NOT_FOUND_ERROR',
            retryable: false,
          },
          { status: 404 }
        )
      }
    }

    // Update the user
    const updateData: {
      tenantId?: string | null
      role?: string | null
      active?: boolean
    } = {}

    if (tenantId !== undefined) {
      updateData.tenantId = tenantId || null
    }

    if (role !== undefined) {
      updateData.role = role || null
    }

    if (active !== undefined) {
      updateData.active = active
    }

    const updatedUser = await userPrisma.user.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      image: updatedUser.image,
      emailVerified: updatedUser.emailVerified,
      tenantId: updatedUser.tenantId,
      active: updatedUser.active,
      tenant: updatedUser.tenant
        ? {
            id: updatedUser.tenant.id,
            name: updatedUser.tenant.name,
            slug: updatedUser.tenant.slug,
          }
        : null,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    })
  } catch (error) {
    console.error('API: Error updating user:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while updating the user',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user
 */
async function deleteUserHandler(_request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id } = await context.params

    // Check if user exists
    const existingUser = await userPrisma.user.findUnique({
      where: { id },
      include: {
        accounts: true,
        sessions: true,
        Learner: true,
        Teacher: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json<ApiError>(
        {
          error: 'Not found',
          message: 'User not found',
          details: `No user found with ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 }
      )
    }

    if (!existingUser.active) {
      return NextResponse.json({
        success: true,
        message: 'User already inactive',
      })
    }

    await userPrisma.user.update({
      where: { id },
      data: {
        active: false,
      },
    })

    await userPrisma.session.deleteMany({
      where: { userId: id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'User deactivated successfully' 
    })
  } catch (error) {
    console.error('API: Error deleting user:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while deleting the user',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

export const GET = withBackofficeAccess(getUserHandler)
export const PATCH = withBackofficeAccess(updateUserHandler)
export const DELETE = withBackofficeAccess(deleteUserHandler)
