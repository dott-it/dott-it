import { NextRequest, NextResponse } from 'next/server'
import { getAssessments, getAssessmentsByTeacher } from '@/lib/data-service'
import { ApiError } from '@/app/types'
import { withAuth } from '../middleware/authorization.middleware'
import { auth } from '@/lib/auth.config'
import { parseSchoolYearListFilter } from '@/lib/school-year'

export const GET = withAuth(getAssessmentsFunction)

async function getAssessmentsFunction(
  request: NextRequest,
): Promise<NextResponse<Awaited<ReturnType<typeof getAssessments>> | ApiError>> {
  try {
    const parsedSchoolYear = parseSchoolYearListFilter(
      request.nextUrl.searchParams.get('schoolYear'),
    )
    if (!parsedSchoolYear.ok) {
      return NextResponse.json(
        {
          error: 'Invalid schoolYear filter',
          message: parsedSchoolYear.error,
          details: 'Use "current", "prior", or a YYYY-YYYY school year',
          type: 'PARSE_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }
    const schoolYear = parsedSchoolYear.filter
    const sesssion = await auth()

    if (sesssion?.user.tenantId) {
      if (sesssion?.user.email?.includes('eddolearning.com')) {
        const assessments = await getAssessments({ schoolYear })
        return NextResponse.json(assessments)
      }

      if (!sesssion?.user.email) {
        return NextResponse.json([])
      }

      const assessments = await getAssessmentsByTeacher(sesssion?.user?.email, { schoolYear })
      return NextResponse.json(assessments)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('API: Unexpected error in assessment fetch:', error)
    return NextResponse.json(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while processing your request.',
        details: 'The assessments list could not be loaded.',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
