import { NextResponse } from 'next/server'
import { userPrisma } from '@/lib/user-prisma'
import { withBackofficeAccess, AuthorizedRequest } from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'

interface RouteParams {
  params: Promise<{ id: string; teacherId: string }>
}

/**
 * DELETE /api/tenants/[id]/teachers/[teacherId]
 * Remove a teacher from a tenant (delete the teacher if it's only in this tenant)
 */
async function removeTeacherFromTenantHandler(_request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id, teacherId } = await context.params

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

    // Check if teacher exists and belongs to this tenant
    const teacher = await userPrisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        students: true,
      },
    })

    if (!teacher) {
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

    if (teacher.tenantId !== id) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Teacher does not belong to this tenant',
          details: `Teacher ${teacherId} does not belong to tenant ${id}`,
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Check if teacher has students
    if (teacher.students.length > 0) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Cannot delete teacher with students',
          details: `Teacher has ${teacher.students.length} student(s) associated. Please reassign students before removing the teacher.`,
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Delete the teacher
    await userPrisma.teacher.delete({
      where: { id: teacherId },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Teacher removed from tenant successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('API: Error removing teacher from tenant:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while removing teacher from tenant',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

export const DELETE = withBackofficeAccess(removeTeacherFromTenantHandler)
