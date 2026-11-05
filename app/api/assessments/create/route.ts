import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserPrisma } from '@/lib/user-prisma'
import { withAuth, AuthorizedRequest } from '@/app/api/middleware/authorization.middleware'
import { ApiError } from '@/app/types'
import { getCurrentSchoolYear, isValidSchoolYear } from '@/lib/school-year'

export const POST = withAuth(createAssessmentHandler)

async function createAssessmentHandler(request: AuthorizedRequest): Promise<NextResponse> {
  try {
    const userPrisma = getUserPrisma()
    const body = await request.json()
    const {
      templateId,
      tenantId,
      assignedBy,
      assignedTo,
      dueDate,
      instructions,
      status,
      submissionUrl,
      googleFormId,
      numberOfQuestions,
      schoolYear,
      unitCode,
    } = body

    console.log('Creating assessment:', { 
      templateId, 
      tenantId,
      assignedBy, 
      assignedTo,
      schoolYear,
      unitCode,
      userId: request.user.id,
      userTenantId: request.user.tenantId
    })

    // Validate required fields
    if (!templateId || !tenantId || !assignedBy || !assignedTo) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Missing required fields',
          details: 'templateId, tenantId, assignedBy, and assignedTo are required',
          type: 'PARSE_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    if (schoolYear && !isValidSchoolYear(String(schoolYear))) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Invalid school year',
          details: 'schoolYear must be in YYYY-YYYY format',
          type: 'PARSE_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    const resolvedSchoolYear =
      typeof schoolYear === 'string' && isValidSchoolYear(schoolYear)
        ? schoolYear
        : getCurrentSchoolYear()

    const resolvedUnitCode =
      typeof unitCode === 'string' && unitCode.trim().length > 0 ? unitCode.trim() : null

    if (!resolvedUnitCode) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Unit is required',
          details: 'unitCode is required',
          type: 'PARSE_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Validate tenant exists
    const tenant = await userPrisma.tenant.findUnique({
      where: { id: tenantId }
    })

    if (!tenant) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Tenant not found',
          details: 'The selected tenant does not exist',
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 400 }
      )
    }

    // Get the assessment template
    const assessmentTemplate = await prisma.assessmentTemplate.findUnique({
      where: { id: templateId }
    })

    if (!assessmentTemplate) {
      return NextResponse.json<ApiError>(
        {
          error: 'Template not found',
          message: 'The selected assessment template does not exist',
          details: 'Please select a valid template',
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 404 }
      )
    }

    // Get teacher ID
    // If assignedBy is provided and is a valid teacher ID, use it
    // Otherwise, try to get teacher from user session
    let teacherId = ''
    
    if (assignedBy) {
      // Check if assignedBy is a valid teacher ID (from any tenant)
      const selectedTeacher = await userPrisma.teacher.findUnique({
        where: { id: assignedBy }
      })
      
      if (selectedTeacher) {
        teacherId = selectedTeacher.id
      } else {
        // If assignedBy is not a valid teacher ID, try to find teacher by user ID
        const teacherByUserId = await userPrisma.teacher.findFirst({
          where: { userId: request.user.id }
        })
        
        teacherId = teacherByUserId ? teacherByUserId.id : assignedBy
      }
    } else {
      // If no assignedBy provided, try to get teacher from user session
      const teacher = await userPrisma.teacher.findFirst({
        where: { userId: request.user.id }
      })
      
      teacherId = teacher ? teacher.id : request.user.id
    }

    // Normalize assignedTo to array format
    let assignedToArray: Array<{ type: string; id: string; name: string }>
    if (Array.isArray(assignedTo)) {
      assignedToArray = assignedTo
    } else if (typeof assignedTo === 'string') {
      assignedToArray = [{ type: 'class', id: 'default', name: assignedTo }]
    } else {
      assignedToArray = [{ type: 'class', id: 'default', name: String(assignedTo) }]
    }

    // Create the assessment instance
    const assessment = await prisma.assessment.create({
      data: {
        templateId: assessmentTemplate.id,
        tenantId: tenantId, // Use tenant from form
        teacherId: teacherId, // Use real teacher ID
        assignedBy: assignedBy,
        assignedAt: new Date().toISOString(),
        dueAt: dueDate 
          ? new Date(dueDate).toISOString() 
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default: 7 days from now
        assignedTo: assignedToArray,
        status: status || 'draft',
        instructions: instructions || assessmentTemplate.description || 'Complete the assessment following the provided guidelines.',
        submissionUrl: submissionUrl || null,
        googleFormId: googleFormId || null,
        numberOfQuestions: numberOfQuestions || 5,
        schoolYear: resolvedSchoolYear,
        unitCode: resolvedUnitCode,
        studentResponsesCount: 0,
      },
      include: {
        template: true
      }
    })

    console.log('✅ Assessment created successfully:', {
      id: assessment.id,
      templateId: assessment.templateId,
      tenantId: assessment.tenantId,
      teacherId: assessment.teacherId
    })

    // Return response in the format expected by CreateAssessmentResponse
    return NextResponse.json({
      success: true,
      assessment: {
        id: assessment.id,
        title: assessmentTemplate.title,
        description: assessmentTemplate.description || null,
        subject: assessmentTemplate.subject || null,
        grade: assessmentTemplate.gradeLevel || null,
        dueDate: assessment.dueAt || null,
        totalRecords: 0, // No mock records created
        pendingRecords: 0, // No mock records created
        records: [], // No mock records created - will be created when students submit
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json<ApiError>(
      {
        error: 'Failed to create assessment',
        message: 'An unexpected error occurred while creating the assessment',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 }
    )
  }
} 