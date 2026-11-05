import { NextRequest, NextResponse } from 'next/server'
import { resolveAssessmentUnitDisplay } from '@/lib/assessment-list-map'
import { prisma } from '@/lib/prisma'
import { getDemoModeConfig } from '@/lib/demo-mode'
import { ActiveAssessment, AssessmentRecord, AssessmentStatus } from '@/app/types'
import { isValidSchoolYear } from '@/lib/school-year'
import { withAuth } from '../../middleware/authorization.middleware'

// Types for update requests
interface UpdateAssessmentRequest {
  title?: string
  status?: AssessmentStatus
  dueDate?: string
  instructions?: string
  numberOfQuestions?: number
  schoolYear?: string
  unitCode?: string
}

function unitFields(
  unitCode: string | null | undefined,
  template: { unitCode?: string | null; subject?: string | null },
): { unitCode: string | null; unitName: string } {
  const unit = resolveAssessmentUnitDisplay({
    unitCode,
    templateUnitCode: template.unitCode,
    subject: template.subject,
  })
  return { unitCode: unit.unitCode, unitName: unit.unitName }
}


async function getAssessment(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<
  NextResponse<
    | ActiveAssessment
    | { error: string; message: string; details: string; type: string; retryable: boolean }
  >
> {
  try {
    const { id } = await params

    // Find the specific assessment
    let assessment
    try {
      assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          template: true,
          assessmentRecords:true
        },
      })
      console.log(`API: Successfully fetched assessment ${id}`)
      console.log(`API: Assessment: ${assessment}`)

      if (!assessment) {
        return NextResponse.json(
          {
            error: 'Assessment not found',
            message: `Assessment with ID ${id} was not found.`,
            details: `No assessment exists with the provided ID: ${id}`,
            type: 'NOT_FOUND_ERROR',
            retryable: false,
          },
          { status: 404 },
        )
      }

      console.log(`API: Successfully fetched assessment ${id}`)
    } catch (queryError) {
      console.error('API: Error fetching assessment:', queryError)
      return NextResponse.json(
        {
          error: 'Failed to fetch assessment',
          message: 'Unable to retrieve assessment data. Please try again.',
          details: queryError instanceof Error ? queryError.message : 'Unknown query error',
          type: 'QUERY_ERROR',
          retryable: true,
        },
        { status: 500 },
      )
    }

    // Get tenant information
    let tenant = null
    if (assessment.tenantId) {
      try {
        const { userPrisma } = await import('@/lib/user-prisma')
        tenant = await userPrisma.tenant.findUnique({
          where: { id: assessment.tenantId },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        })
      } catch {
        // Tenant not found or error fetching - continue without tenant info
      }
    }

    // Get teacher information
    let teacher = null
    if (assessment.assignedBy) {
      try {
        const { userPrisma } = await import('@/lib/user-prisma')
        teacher = await userPrisma.user.findUnique({
          where: { id: assessment.assignedBy },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      } catch {
        // Teacher not found or error fetching - continue without teacher info
      }
    }

    const gradeLevel = assessment.template.gradeLevel || ''

    // Extract numeric grade from grade level (e.g., "Grade 8" -> 8, "8" -> 8)
    let numericGrade = null
    if (gradeLevel) {
      const gradeMatch = gradeLevel.match(/(\d+)/)
      if (gradeMatch) {
        numericGrade = Number.parseInt(gradeMatch[1], 10)
      }
    }

    // Map specific subjects to display names
    let displaySubject = assessment.template.subject || 'Science'
    if (displaySubject === 'Biology') {
      displaySubject = 'Middle School'
    }

    console.log(assessment.assessmentRecords)

    // Calculate submission status based on real assessment records
    const submissionStatus = {
      handedIn: assessment.assessmentRecords.filter((r) => r.status === 'handed_in').length,
      readyForReview: assessment.assessmentRecords.filter((r) => r.status === 'ready_for_review')
        .length,
      inProgress: assessment.assessmentRecords.filter((r) => r.status === 'in_progress').length,
      shared: assessment.assessmentRecords.filter((r) => r.status === 'shared').length,
    }

    const formattedAssessment: ActiveAssessment = {
      id: assessment.id,
      tenantId: assessment.tenantId,
      templateId: assessment.templateId,
      teacherId: assessment.assignedBy || 'unknown',
      assignedBy: assessment.assignedBy || 'unknown',
      assignedAt: assessment.assignedAt,
      assessmentRecords: assessment.assessmentRecords as AssessmentRecord[],
      dueAt: assessment.dueAt || '',
      assignedTo: (assessment.assignedTo as Record<string, unknown>) || {},
      submissionUrl: assessment.submissionUrl || undefined,
      googleFormId: assessment.googleFormId,
      status: assessment.status,
      instructions: assessment.instructions || undefined,
      numberOfQuestions: assessment.numberOfQuestions,
      schoolYear: assessment.schoolYear,
      ...unitFields(assessment.unitCode, assessment.template),
      studentResponsesCount: assessment.studentResponsesCount,
      title: assessment.template.title,
      subject: displaySubject,
      grade: numericGrade,
      type: assessment.template.type,
      dueDate: assessment.dueAt ? new Date(assessment.dueAt) : undefined,
      submissionStatus,
      totalRecords: assessment.assessmentRecords.length,
      description: assessment.template.description || 'Assessment created from template.',
      template: assessment.template,
      tenant,
      teacher,
    }

    return NextResponse.json(formattedAssessment)
  } catch (error) {
    console.error('API: Unexpected error in assessment fetch:', error)
    return NextResponse.json(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while processing your request.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}





export const GET = withAuth(getAssessment)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<
  NextResponse<
    | ActiveAssessment
    | { error: string; message: string; details: string; type: string; retryable: boolean }
  >
> {
  try {
    const { id } = await params
    const demoConfig = getDemoModeConfig()
    console.log(`API: Starting assessment update for ID: ${id}`)
    console.log('API: Demo mode enabled:', demoConfig.isEnabled)

    // Parse request body
    let updateData: UpdateAssessmentRequest
    try {
      updateData = await request.json()
      console.log('API: Update data received:', updateData)
    } catch (parseError) {
      console.error('API: Error parsing request body:', parseError)
      return NextResponse.json(
        {
          error: 'Invalid request body',
          message: 'The request body must be valid JSON.',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          type: 'PARSE_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    // Validate update data
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: 'Empty update data',
          message: 'At least one field must be provided for update.',
          details: 'The request body cannot be empty.',
          type: 'PARSE_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    // Using the global Prisma client singleton. Do not call $connect()/$disconnect() per-request

    // Check if assessment exists
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id },
      include: { template: true },
    })

    if (!existingAssessment) {
      return NextResponse.json(
        {
          error: 'Assessment not found',
          message: `Assessment with ID ${id} was not found.`,
          details: `No assessment exists with the provided ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 },
      )
    }

    // Prepare update data for database
    const dbUpdateData: {
      status?: string
      dueAt?: string
      instructions?: string
      numberOfQuestions?: number
      schoolYear?: string
      unitCode?: string
    } = {}

    if (updateData.status !== undefined) {
      dbUpdateData.status = updateData.status
    }

    if (updateData.dueDate !== undefined) {
      dbUpdateData.dueAt = new Date(updateData.dueDate).toISOString()
    }

    if (updateData.instructions !== undefined) {
      dbUpdateData.instructions = updateData.instructions
    }

    if (updateData.numberOfQuestions !== undefined) {
      dbUpdateData.numberOfQuestions = updateData.numberOfQuestions
    }

    if (updateData.schoolYear !== undefined) {
      if (!isValidSchoolYear(String(updateData.schoolYear))) {
        return NextResponse.json(
          {
            error: 'Invalid school year',
            message: 'schoolYear must be in YYYY-YYYY format',
            details: `Received: ${String(updateData.schoolYear)}`,
            type: 'PARSE_ERROR',
            retryable: false,
          },
          { status: 400 },
        )
      }
      dbUpdateData.schoolYear = updateData.schoolYear
    }

    if (updateData.unitCode !== undefined) {
      const trimmedUnit =
        typeof updateData.unitCode === 'string' ? updateData.unitCode.trim() : ''
      if (!trimmedUnit) {
        return NextResponse.json(
          {
            error: 'Invalid unit',
            message: 'unitCode is required',
            details: 'Provide a non-empty OpenSciEd unit code',
            type: 'PARSE_ERROR',
            retryable: false,
          },
          { status: 400 },
        )
      }
      dbUpdateData.unitCode = trimmedUnit
    }

    // Update assessment in database
    let updatedAssessment
    try {
      updatedAssessment = await prisma.assessment.update({
        where: { id },
        data: dbUpdateData,
        include: {
          template: true,
          assessmentRecords: {
            include: {
              assessmentHistory: {
                orderBy: { timestamp: 'asc' },
              },
            },
          },
        },
      })
      console.log(`API: Successfully updated assessment ${id}`)
    } catch (updateError) {
      console.error('API: Error updating assessment:', updateError)
      return NextResponse.json(
        {
          error: 'Failed to update assessment',
          message: 'Unable to update assessment data. Please try again.',
          details: updateError instanceof Error ? updateError.message : 'Unknown update error',
          type: 'UPDATE_ERROR',
          retryable: true,
        },
        { status: 500 },
      )
    }

    // Format response
    const gradeLevel = updatedAssessment.template.gradeLevel || ''

    // Extract numeric grade from grade level
    let numericGrade = null
    if (gradeLevel) {
      const gradeMatch = gradeLevel.match(/(\d+)/)
      if (gradeMatch) {
        numericGrade = Number.parseInt(gradeMatch[1], 10)
      }
    }

    // Map specific subjects to display names
    let displaySubject = updatedAssessment.template.subject || 'Science'
    if (displaySubject === 'Biology') {
      displaySubject = 'Middle School'
    }

    // Get tenant information
    let tenant = null
    if (updatedAssessment.tenantId) {
      try {
        const { userPrisma } = await import('@/lib/user-prisma')
        tenant = await userPrisma.tenant.findUnique({
          where: { id: updatedAssessment.tenantId },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        })
      } catch {
        // Tenant not found or error fetching - continue without tenant info
      }
    }

    // Get teacher information
    let teacher = null
    if (updatedAssessment.assignedBy) {
      try {
        const { userPrisma } = await import('@/lib/user-prisma')
        teacher = await userPrisma.user.findUnique({
          where: { id: updatedAssessment.assignedBy },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      } catch {
        // Teacher not found or error fetching - continue without teacher info
      }
    }

    const formattedAssessment: ActiveAssessment = {
      id: updatedAssessment.id,
      tenantId: updatedAssessment.tenantId,
      templateId: updatedAssessment.templateId,
      teacherId: updatedAssessment.assignedBy || 'unknown',
      assignedBy: updatedAssessment.assignedBy || 'unknown',
      assignedAt: updatedAssessment.assignedAt,
      dueAt: updatedAssessment.dueAt || '',
      assignedTo: (updatedAssessment.assignedTo as Record<string, unknown>) || {},
      status: updatedAssessment.status,
      instructions: updatedAssessment.instructions || undefined,
      numberOfQuestions: updatedAssessment.numberOfQuestions,
      schoolYear: updatedAssessment.schoolYear,
      ...unitFields(updatedAssessment.unitCode, updatedAssessment.template),
      studentResponsesCount: updatedAssessment.studentResponsesCount,
      title: updatedAssessment.template.title,
      subject: displaySubject,
      grade: numericGrade,
      type: updatedAssessment.template.type,
      dueDate: updatedAssessment.dueAt ? new Date(updatedAssessment.dueAt) : undefined,
      submissionStats: {
        readyForReview: updatedAssessment.assessmentRecords.filter(
          (r) => r.status === 'ready_for_review',
        ).length,
        shared: updatedAssessment.assessmentRecords.filter((r) => r.status === 'shared').length,
      },
      totalRecords: updatedAssessment.assessmentRecords.length,
      description: updatedAssessment.template.description || 'Assessment created from template.',
      template: updatedAssessment.template,
      tenant,
      teacher,
    }

    return NextResponse.json(formattedAssessment)
  } catch (error) {
    console.error('API: Unexpected error in assessment update:', error)
    return NextResponse.json(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while processing your request.',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/assessments/[id]
 * Delete an assessment
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    // Check if assessment exists
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        assessmentRecords: true,
      },
    })

    if (!existingAssessment) {
      return NextResponse.json(
        {
          error: 'Assessment not found',
          message: `Assessment with ID ${id} was not found.`,
          details: `No assessment exists with the provided ID: ${id}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 },
      )
    }

    // Check if assessment has records
    if (existingAssessment.assessmentRecords.length > 0) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'Cannot delete assessment with existing records',
          details: `This assessment has ${existingAssessment.assessmentRecords.length} record(s). Please delete or reassign them first.`,
          type: 'QUERY_ERROR',
          retryable: false,
        },
        { status: 409 },
      )
    }

    // Delete the assessment
    await prisma.assessment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Assessment deleted successfully' })
  } catch (error) {
    console.error('API: Error deleting assessment:', error)
    return NextResponse.json(
      {
        error: 'Unexpected error occurred',
        message: 'An unexpected error occurred while deleting the assessment',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'UNEXPECTED_ERROR',
        retryable: true,
      },
      { status: 500 },
    )
  }
}
