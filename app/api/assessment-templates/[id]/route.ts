import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assessmentTemplateAccessResponse } from '@/app/lib/api/assessment-template-access'
import { ApiError } from '@/app/types'
import {
  findExactTemplateTitleConflict,
  isTemplateUniqueConflict,
  templateConflictSelect,
  templateTitleConflictResponse,
} from '@/lib/assessment-template-duplicates'
import { resolveTemplateStructure } from '@/lib/assessment-template-structure'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/assessment-templates/[id]
 * Retrieve a specific assessment template
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const denied = await assessmentTemplateAccessResponse(
      'Please log in to access this resource',
    )
    if (denied) {
      return denied
    }

    const { id } = await context.params
    const searchParams = request.nextUrl.searchParams
    const rawLimit = Number(searchParams.get('limit') ?? '5')
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20) : 5
    const cursor = searchParams.get('cursor') ?? undefined

    const template = await prisma.assessmentTemplate.findUnique({
      where: { id },
    })

    if (!template) {
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

    const [totalAssessments, activeAssessments, assessments] = await Promise.all([
      prisma.assessment.count({
        where: { templateId: id },
      }),
      prisma.assessment.count({
        where: {
          templateId: id,
          status: {
            in: ['active', 'live'],
          },
        },
      }),
      prisma.assessment.findMany({
        where: { templateId: id },
        orderBy: [
          { assignedAt: 'desc' },
          { id: 'desc' },
        ],
        take: limit + 1,
        ...(cursor
          ? {
              cursor: { id: cursor },
              skip: 1,
            }
          : {}),
        select: {
          id: true,
          status: true,
          assignedAt: true,
          dueAt: true,
          numberOfQuestions: true,
          template: {
            select: {
              title: true,
            },
          },
        },
      }),
    ])

    const limitedAssessments = assessments.slice(0, limit)
    const hasMore = assessments.length > limit
    const nextCursor = hasMore ? limitedAssessments.at(-1)?.id : undefined

    const usageStats = {
      totalAssessments,
      activeAssessments,
    }

    return NextResponse.json({
      ...template,
      usageStats,
      assessments: limitedAssessments.map((assessment) => {
        const { template: assessmentTemplate, ...rest } = assessment
        return {
          ...rest,
          title: assessmentTemplate?.title ?? '',
          assignedAt: assessment.assignedAt ?? null,
          dueAt: assessment.dueAt ?? null,
          numberOfQuestions: assessment.numberOfQuestions ?? 0,
        }
      }),
      assessmentPagination: {
        nextCursor,
        hasMore,
        pageSize: limit,
      },
    })
  } catch (error) {
    console.error('API: Error fetching assessment template:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching the template',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/assessment-templates/[id]
 * Update an assessment template
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const denied = await assessmentTemplateAccessResponse('Please log in to update templates')
    if (denied) {
      return denied
    }

    const { id } = await context.params
    const body = await request.json()
    const {
      title,
      type,
      description,
      curriculumTeachersEdition,
      curriculumAnswerKey,
      subject,
      gradeLevel,
      unitCode,
      lessonNumber,
    } = body

    // Check if template exists
    const existingTemplate = await prisma.assessmentTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
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

    const structure = resolveTemplateStructure(
      {
        unitCode: unitCode === undefined ? existingTemplate.unitCode : unitCode,
        lessonNumber: lessonNumber === undefined ? existingTemplate.lessonNumber : lessonNumber,
      },
      {
        requireUnitAndLesson: Boolean(existingTemplate.unitCode),
        preserved: {
          unitCode: existingTemplate.unitCode,
          lessonNumber: existingTemplate.lessonNumber,
        },
      },
    )
    if (!structure.ok) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: structure.message,
          details: structure.details,
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const storedTitle = (typeof title === 'string' && title.trim()) || existingTemplate.title
    const storedType = (typeof type === 'string' && type.trim()) || existingTemplate.type

    if (structure.unitCode && structure.lessonNumber !== null) {
      const existingTemplates = await prisma.assessmentTemplate.findMany({
        where: {
          unitCode: structure.unitCode,
          lessonNumber: structure.lessonNumber,
          id: { not: id },
        },
        select: templateConflictSelect,
      })

      const titleConflict = findExactTemplateTitleConflict(
        existingTemplates,
        {
          unitCode: structure.unitCode,
          lessonNumber: structure.lessonNumber,
          type: storedType,
          title: storedTitle,
        },
        id,
      )

      if (titleConflict) {
        return NextResponse.json<ApiError>(templateTitleConflictResponse(titleConflict.id), {
          status: 409,
        })
      }
    }

    const conflictInput = {
      unitCode: structure.unitCode ?? '',
      lessonNumber: structure.lessonNumber ?? 0,
      type: storedType,
      title: storedTitle,
    }

    try {
      const updatedTemplate = await prisma.assessmentTemplate.update({
        where: { id },
        data: {
          ...(title && { title: storedTitle }),
          ...(type && { type: storedType }),
          ...(description !== undefined && { description }),
          ...(curriculumTeachersEdition !== undefined && {
            curriculumTeachersEdition,
          }),
          ...(curriculumAnswerKey !== undefined && { curriculumAnswerKey }),
          ...(subject !== undefined && { subject }),
          ...(gradeLevel !== undefined && { gradeLevel }),
          ...(unitCode !== undefined && { unitCode: structure.unitCode }),
          ...(lessonNumber !== undefined && { lessonNumber: structure.lessonNumber }),
        },
      })
      return NextResponse.json(updatedTemplate)
    } catch (error) {
      if (!isTemplateUniqueConflict(error) || !structure.unitCode || structure.lessonNumber === null) {
        throw error
      }
      const raced = await prisma.assessmentTemplate.findMany({
        where: {
          unitCode: structure.unitCode,
          lessonNumber: structure.lessonNumber,
          id: { not: id },
        },
        select: templateConflictSelect,
      })
      const winner = findExactTemplateTitleConflict(raced, conflictInput, id)
      return NextResponse.json<ApiError>(templateTitleConflictResponse(winner?.id), {
        status: 409,
      })
    }
  } catch (error) {
    console.error('API: Error updating assessment template:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while updating the template',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/assessment-templates/[id]
 * Delete an assessment template
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const denied = await assessmentTemplateAccessResponse('Please log in to delete templates')
    if (denied) {
      return denied
    }

    const { id } = await context.params

    // Check if template exists
    const existingTemplate = await prisma.assessmentTemplate.findUnique({
      where: { id },
      include: {
        assessments: true,
      },
    })

    if (!existingTemplate) {
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

    // Check if template has associated assessments
    if (existingTemplate.assessments.length > 0) {
      return NextResponse.json<ApiError>(
        {
          error: 'Conflict',
          message: 'Cannot delete template with associated assessments',
          details: `This template has ${existingTemplate.assessments.length} associated assessment(s). Please delete or reassign them first.`,
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 409 }
      )
    }

    // Delete the template
    await prisma.assessmentTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Template deleted successfully' })
  } catch (error) {
    console.error('API: Error deleting assessment template:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while deleting the template',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}
