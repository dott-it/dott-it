import { NextResponse } from 'next/server'
import { userPrisma } from '@/lib/user-prisma'
import { withBackofficeAccess, AuthorizedRequest } from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'

export interface Teacher {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  teacherNickname?: string | null
  userId?: string | null
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface TeachersResponse {
  teachers: Teacher[]
  total: number
}

/**
 * GET /api/teachers
 * Retrieve all teachers from the system
 */
async function getTeachersHandler(_request: AuthorizedRequest) {
  try {

    // Get all teachers from the system (no tenant filter)
    const teachers = await userPrisma.teacher.findMany({
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    })

    // Transform to response format
    const teachersResponse: Teacher[] = teachers.map((teacher) => ({
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      teacherNickname: teacher.teacherNickname,
      userId: teacher.userId,
      tenantId: teacher.tenantId,
      createdAt: teacher.createdAt.toISOString(),
      updatedAt: teacher.updatedAt.toISOString(),
    }))

    return NextResponse.json<TeachersResponse>({
      teachers: teachersResponse,
      total: teachersResponse.length,
    })
  } catch (error) {
    console.error('API: Error fetching teachers:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching teachers',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

export const GET = withBackofficeAccess(getTeachersHandler)

