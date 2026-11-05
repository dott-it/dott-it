import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assessmentTemplateAccessResponse } from '@/app/lib/api/assessment-template-access'
import { ApiError } from '@/app/types'
import {
  copyTitlesTaken,
  isTemplateUniqueConflict,
  nextCopyTitle,
  templateConflictSelect,
  templateTitleConflictResponse,
} from '@/lib/assessment-template-duplicates'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/assessment-templates/[id]/duplicate
 * Duplicate an assessment template
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const denied = await assessmentTemplateAccessResponse('Please log in to duplicate templates')
    if (denied) {
      return denied
    }

    const { id } = await context.params

    // Get the original template
    const originalTemplate = await prisma.assessmentTemplate.findUnique({
      where: { id },
    })

    if (!originalTemplate) {
      return NextResponse.json<ApiError>(
        {
          error: 'Not found',
          message: 'Assessment template not found',
          details: `No template found with ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 }
      )
    }

    const blockedTitles: string[] = []
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const siblings = await prisma.assessmentTemplate.findMany({
        where: {
          unitCode: originalTemplate.unitCode,
          lessonNumber: originalTemplate.lessonNumber,
        },
        select: templateConflictSelect,
      })
      const copyTitle = nextCopyTitle(originalTemplate.title, [
        ...copyTitlesTaken(siblings, {
          unitCode: originalTemplate.unitCode,
          lessonNumber: originalTemplate.lessonNumber,
          type: originalTemplate.type,
        }),
        ...blockedTitles,
      ])
      if (!copyTitle) {
        return NextResponse.json<ApiError>(templateTitleConflictResponse(), { status: 409 })
      }

      try {
        const duplicatedTemplate = await prisma.assessmentTemplate.create({
          data: {
            title: copyTitle,
            type: originalTemplate.type,
            description: originalTemplate.description,
            curriculumTeachersEdition: originalTemplate.curriculumTeachersEdition,
            curriculumAnswerKey: originalTemplate.curriculumAnswerKey,
            subject: originalTemplate.subject,
            gradeLevel: originalTemplate.gradeLevel,
            unitCode: originalTemplate.unitCode,
            lessonNumber: originalTemplate.lessonNumber,
          },
        })
        return NextResponse.json(duplicatedTemplate, { status: 201 })
      } catch (error) {
        if (!isTemplateUniqueConflict(error)) {
          throw error
        }
        blockedTitles.push(copyTitle)
      }
    }

    return NextResponse.json<ApiError>(templateTitleConflictResponse(), { status: 409 })
  } catch (error) {
    console.error('API: Error duplicating assessment template:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while duplicating the template',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}
