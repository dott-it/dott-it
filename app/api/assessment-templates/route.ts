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
import { templateListSelect } from '@/lib/assessment-template-browse'
import { resolveTemplateStructure } from '@/lib/assessment-template-structure'

/**
 * GET /api/assessment-templates
 * Retrieve all assessment templates for the current tenant
 */
export async function GET(_request: NextRequest) {
  try {
    const denied = await assessmentTemplateAccessResponse(
      'Please log in to access this resource',
    )
    if (denied) {
      return denied
    }

    const templates = await prisma.assessmentTemplate.findMany({
      where: {
        // Note: If you want tenant-specific templates, add tenantId field to AssessmentTemplate schema
      },
      select: templateListSelect,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('API: Error fetching assessment templates:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while fetching templates',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/assessment-templates
 * Create a new assessment template
 */
export async function POST(request: NextRequest) {
  try {
    const denied = await assessmentTemplateAccessResponse('Please log in to create templates')
    if (denied) {
      return denied
    }

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

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Missing required fields',
          details: 'Title and type are required fields',
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    const structure = resolveTemplateStructure(
      { unitCode, lessonNumber },
      { requireUnitAndLesson: true },
    )
    if (!structure.ok || !structure.unitCode || structure.lessonNumber === null) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: structure.ok ? 'Unit and lesson are required' : structure.message,
          details: structure.ok
            ? 'Choose an OpenSciEd unit and lesson'
            : structure.details,
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const normalizedType = type.trim()
    const normalizedTitle = title.trim()

    const existingTemplates = await prisma.assessmentTemplate.findMany({
      where: {
        unitCode: structure.unitCode,
        lessonNumber: structure.lessonNumber,
      },
      select: templateConflictSelect,
    })

    const titleConflict = findExactTemplateTitleConflict(existingTemplates, {
      unitCode: structure.unitCode,
      lessonNumber: structure.lessonNumber,
      type: normalizedType,
      title: normalizedTitle,
    })

    if (titleConflict) {
      return NextResponse.json<ApiError>(templateTitleConflictResponse(titleConflict.id), {
        status: 409,
      })
    }

    const conflictInput = {
      unitCode: structure.unitCode,
      lessonNumber: structure.lessonNumber,
      type: normalizedType,
      title: normalizedTitle,
    }

    try {
      const template = await prisma.assessmentTemplate.create({
        data: {
          title: normalizedTitle,
          type: normalizedType,
          description: description || null,
          curriculumTeachersEdition: curriculumTeachersEdition || null,
          curriculumAnswerKey: curriculumAnswerKey || null,
          subject: subject || null,
          gradeLevel: gradeLevel || null,
          unitCode: structure.unitCode,
          lessonNumber: structure.lessonNumber,
        },
      })
      return NextResponse.json(template, { status: 201 })
    } catch (error) {
      if (!isTemplateUniqueConflict(error)) {
        throw error
      }
      const raced = await prisma.assessmentTemplate.findMany({
        where: {
          unitCode: structure.unitCode,
          lessonNumber: structure.lessonNumber,
        },
        select: templateConflictSelect,
      })
      const winner = findExactTemplateTitleConflict(raced, conflictInput)
      return NextResponse.json<ApiError>(templateTitleConflictResponse(winner?.id), {
        status: 409,
      })
    }
  } catch (error) {
    console.error('API: Error creating assessment template:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while creating the template',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
}
