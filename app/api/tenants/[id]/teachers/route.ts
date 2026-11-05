import { NextResponse } from 'next/server'
import { userPrisma } from '@/lib/user-prisma'
import { withBackofficeAccess, AuthorizedRequest } from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

export interface TenantTeacher {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  teacherNickname?: string | null
  userId?: string | null
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
  learnerCount: number
  createdAt: string
  updatedAt: string
}

export interface TenantTeachersResponse {
  tenant: {
    id: string
    name: string
    slug: string
  }
  teachers: TenantTeacher[]
  total: number
}

/**
 * GET /api/tenants/[id]/teachers
 * Retrieve all teachers for a specific tenant
 */
async function getTenantTeachersHandler(_request: AuthorizedRequest, context: RouteParams) {
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

    // Get all teachers for this tenant
    const teachers = await userPrisma.teacher.findMany({
      where: {
        tenantId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Get learner count for each teacher
    const teachersWithDetails = await Promise.all(
      teachers.map(async (teacher) => {
        const learnerCount = await userPrisma.learner.count({
          where: { teacherId: teacher.id },
        })

        return {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          teacherNickname: teacher.teacherNickname,
          userId: teacher.userId,
          user: teacher.user
            ? {
                id: teacher.user.id,
                name: teacher.user.name,
                email: teacher.user.email,
                role: teacher.user.role,
              }
            : null,
          learnerCount,
          createdAt: teacher.createdAt.toISOString(),
          updatedAt: teacher.updatedAt.toISOString(),
        }
      })
    )

    return NextResponse.json<TenantTeachersResponse>({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      teachers: teachersWithDetails,
      total: teachersWithDetails.length,
    })
  } catch (error) {
    console.error('API: Error fetching tenant teachers:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching tenant teachers',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenants/[id]/teachers
 * Add a teacher to a tenant (by associating an existing teacher or creating a new one)
 */
async function addTeacherToTenantHandler(request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { teacherId, firstName, lastName, email, teacherNickname, userId } = body

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

    // If teacherId is provided, update existing teacher to this tenant
    if (teacherId) {
      // Check if teacher exists
      const existingTeacher = await userPrisma.teacher.findUnique({
        where: { id: teacherId },
      })

      if (!existingTeacher) {
        return NextResponse.json<ApiError>(
          {
            error: 'Not found',
            message: 'Teacher not found',
            details: `No teacher found with ID: ${teacherId}`,
            type: 'NOT_FOUND_ERROR',
            retryable: false,
          },
          { status: 404 }
        )
      }

      // Update teacher's tenant
      const updatedTeacher = await userPrisma.teacher.update({
        where: { id: teacherId },
        data: { tenantId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      })

      const learnerCount = await userPrisma.learner.count({
        where: { teacherId: updatedTeacher.id },
      })

      return NextResponse.json<TenantTeacher>({
        id: updatedTeacher.id,
        firstName: updatedTeacher.firstName,
        lastName: updatedTeacher.lastName,
        email: updatedTeacher.email,
        teacherNickname: updatedTeacher.teacherNickname,
        userId: updatedTeacher.userId,
        user: updatedTeacher.user
          ? {
              id: updatedTeacher.user.id,
              name: updatedTeacher.user.name,
              email: updatedTeacher.user.email,
              role: updatedTeacher.user.role,
            }
          : null,
        learnerCount,
        createdAt: updatedTeacher.createdAt.toISOString(),
        updatedAt: updatedTeacher.updatedAt.toISOString(),
      }, { status: 200 })
    }

    // Otherwise, create a new teacher for this tenant
    if (!firstName || !lastName) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Missing required fields',
          details: 'firstName and lastName are required when creating a new teacher',
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // If userId is provided, verify user exists
    if (userId) {
      const user = await userPrisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json<ApiError>(
          {
            error: 'Not found',
            message: 'User not found',
            details: `No user found with ID: ${userId}`,
            type: 'NOT_FOUND_ERROR',
            retryable: false,
          },
          { status: 404 }
        )
      }
    }

    // Create new teacher
    const newTeacher = await userPrisma.teacher.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        teacherNickname: teacherNickname || null,
        userId: userId || null,
        tenantId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json<TenantTeacher>({
      id: newTeacher.id,
      firstName: newTeacher.firstName,
      lastName: newTeacher.lastName,
      email: newTeacher.email,
      teacherNickname: newTeacher.teacherNickname,
      userId: newTeacher.userId,
      user: newTeacher.user
        ? {
            id: newTeacher.user.id,
            name: newTeacher.user.name,
            email: newTeacher.user.email,
            role: newTeacher.user.role,
          }
        : null,
      learnerCount: 0,
      createdAt: newTeacher.createdAt.toISOString(),
      updatedAt: newTeacher.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('API: Error adding teacher to tenant:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while adding teacher to tenant',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

export const GET = withBackofficeAccess(getTenantTeachersHandler)
export const POST = withBackofficeAccess(addTeacherToTenantHandler)
