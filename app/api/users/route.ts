import { NextResponse } from 'next/server'
import { userPrisma } from '@/lib/user-prisma'
import { withBackofficeAccess, AuthorizedRequest } from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'
import bcrypt from 'bcryptjs'

/**
 * GET /api/users
 * Retrieve all users in the system with their tenant information
 */
async function getUsersHandler(_request: AuthorizedRequest) {
  try {

    const users = await userPrisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        emailVerified: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        active: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the data to include tenant information
    const usersWithTenants = users.map((user) => ({
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
    }))

    return NextResponse.json({
      users: usersWithTenants,
      total: usersWithTenants.length,
    })
  } catch (error) {
    console.error('API: Error fetching users:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching users',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Create a new user in the system
 */
async function createUserHandler(request: AuthorizedRequest) {
  try {
    const body = await request.json()
    const { name, email, password, tenantId, role, active } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Email is required',
          details: 'Please provide an email address for the user',
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Check if user with email already exists
    const existingUser = await userPrisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json<ApiError>(
        {
          error: 'Conflict',
          message: 'User already exists',
          details: `A user with email ${email} already exists`,
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 409 }
      )
    }

    // If tenantId is provided, verify tenant exists
    if (tenantId) {
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

    // Hash password if provided
    let passwordHash: string | undefined
    if (password) {
      passwordHash = bcrypt.hashSync(password, 12)
    }

    // Create the user
    const newUser = await userPrisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: passwordHash || null,
        tenantId: tenantId || null,
        role: role || null,
        emailVerified: null,
        active: active ?? true,
      },
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
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      image: newUser.image,
      emailVerified: newUser.emailVerified,
      tenantId: newUser.tenantId,
      active: newUser.active,
      tenant: newUser.tenant
        ? {
            id: newUser.tenant.id,
            name: newUser.tenant.name,
            slug: newUser.tenant.slug,
          }
        : null,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    }, { status: 201 })
  } catch (error) {
    console.error('API: Error creating user:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while creating the user',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

export const GET = withBackofficeAccess(getUsersHandler)
export const POST = withBackofficeAccess(createUserHandler)
