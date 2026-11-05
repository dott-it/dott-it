import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDemoModeConfig } from '@/lib/demo-mode'
import type { AssessmentEvent, AssessmentRecord } from '@/types'
import { userPrisma } from '@/lib/user-prisma'
import { decryptName } from '@/app/lib/utils'

function normalizeAssessmentEventData(value: unknown): Record<string, unknown> {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function mapAssessmentHistoryForApi(
  history:
    | Array<{
        id: string
        assessmentRecordId: string
        eventType: string
        eventData: unknown
        timestamp: Date
        userId: string | null
        userType: string | null
      }>
    | undefined,
): AssessmentEvent[] {
  if (!history?.length) return []
  return history.map((e) => ({
    id: e.id,
    assessmentRecordId: e.assessmentRecordId,
    eventType: e.eventType,
    eventData: normalizeAssessmentEventData(e.eventData),
    timestamp: e.timestamp,
    userId: e.userId ?? undefined,
    userType: e.userType ?? undefined,
  }))
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assessmentRecordId: string }> },
): Promise<
  NextResponse<
    | AssessmentRecord
    | { error: string; message: string; details: string; type: string; retryable: boolean }
  >
> {
  try {
    const { assessmentRecordId } = await params
    const demoConfig = getDemoModeConfig()

    console.log(
      'API: Starting assessment records fetch for assessmentRecordId:',
      assessmentRecordId,
    )
    console.log('API: Demo mode enabled:', demoConfig.isEnabled)

    // In demo mode, show all records regardless of assessment ID

    const record = await prisma.assessmentRecord.findUnique({
      where: { id: assessmentRecordId },
      include: {
        assessment: {
          include: {
            template: true,
          },
        },
        assessmentHistory: {
          orderBy: { timestamp: 'asc' },
        },
        studentAnswers: {
          orderBy: { createdAt: 'asc' },
          include: {
            aiSuggestions: {
              include: {
                feedback: {
                  orderBy: { order: 'asc' },
                },
                rubricEvaluation: true,
              },
            },
          },
        },
        feedbacks: {
          orderBy: { createdAt: 'asc' },
          include: {
            feedbackSections: true,
          },
        },
      },
    })

    if (!record) {
      return NextResponse.json(
        {
          error: 'Assessment record not found',
          message: `Assessment record with ID ${assessmentRecordId} was not found.`,
          details: `No assessment record exists with the provided ID: ${assessmentRecordId}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 },
      )
    }
    const submissionEvent = record.assessmentHistory.find((e) => e.eventType === 'submission')
    const _teacherReviewEvent = record.assessmentHistory.find(
      (e) => e.eventType === 'teacher_review',
    )

    const learner = await userPrisma.learner.findUnique({
      where: { id: record.learnerId },
    })
    return NextResponse.json({
      id: record.id,
      tenantId: record.tenantId,
      assessmentId: record.assessmentId,
      learnerId: record.learnerId,
      classSection: record.classSection,
      learnerName: decryptName(learner?.name || '') || record.learnerId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,

      rubricScore: record.rubricScore,
      teacherScore: record.teacherScore,
      feedbacks: record.feedbacks,
      details: record.details,
      studentAnswers: record.studentAnswers,
      assessmentHistory: mapAssessmentHistoryForApi(record.assessmentHistory),
      type: record.type,
      rawAnswer: (() => {
        if (!record.rawAnswer) return {}
        if (typeof record.rawAnswer === 'string') {
          // Se já é string, tenta fazer parse para objeto
          try {
            return JSON.parse(record.rawAnswer)
          } catch {
            return { raw: record.rawAnswer }
          }
        }
        // Se é objeto, retorna como está
        return record.rawAnswer as Record<string, unknown>
      })(),
      status: record.status,

      submittedAt: submissionEvent?.timestamp || record.submittedAt,

      numberOfQuestions: record.numberOfQuestions ?? '0',
    })
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch records',
        message: 'An error occurred while fetching assessment records',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'DatabaseError',
        retryable: true,
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assessmentRecordId: string }> },
): Promise<
  NextResponse<
    | AssessmentRecord
    | { error: string; message: string; details: string; type: string; retryable: boolean }
  >
> {
  try {
    const { assessmentRecordId } = await params
    const demoConfig = getDemoModeConfig()

    console.log(`API: Starting assessment record update for ID: ${assessmentRecordId}`)
    console.log('API: Demo mode enabled:', demoConfig.isEnabled)

    // Parse request body
    let updateData: Partial<AssessmentRecord>
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
          type: 'VALIDATION_ERROR',
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
          type: 'VALIDATION_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    // Check if assessment record exists
    const existingRecord = await prisma.assessmentRecord.findUnique({
      where: { id: assessmentRecordId },
    })

    if (!existingRecord) {
      return NextResponse.json(
        {
          error: 'Assessment record not found',
          message: `Assessment record with ID ${assessmentRecordId} was not found.`,
          details: `No assessment record exists with the provided ID: ${assessmentRecordId}`,
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 },
      )
    }

    // Prepare update data for database
    const dbUpdateData: {
      status?: string
      rubricScore?: string | null
      teacherScore?: string | null
      details?: string
      type?: string
      rawAnswer?: string
    } = {}

    if (updateData.status !== undefined) {
      dbUpdateData.status = updateData.status
    }

    if (updateData.rubricScore !== undefined) {
      dbUpdateData.rubricScore = updateData.rubricScore
    }

    if (updateData.teacherScore !== undefined) {
      dbUpdateData.teacherScore = updateData.teacherScore
    }

    if (updateData.details !== undefined) {
      dbUpdateData.details = updateData.details
    }

    if (updateData.type !== undefined) {
      dbUpdateData.type = updateData.type
    }

    if (updateData.rawAnswer !== undefined) {
      dbUpdateData.rawAnswer =
        typeof updateData.rawAnswer === 'string'
          ? updateData.rawAnswer
          : JSON.stringify(updateData.rawAnswer)
    }

    // Update assessment record in database
    let updatedRecord
    try {
      updatedRecord = await prisma.assessmentRecord.update({
        where: { id: assessmentRecordId },
        data: dbUpdateData,
        include: {
          assessment: {
            include: {
              template: true,
            },
          },
          assessmentHistory: {
            orderBy: { timestamp: 'asc' },
          },
          studentAnswers: {
            orderBy: { createdAt: 'asc' },
            include: {
              aiSuggestions: {
                include: {
                  feedback: {
                    orderBy: { order: 'asc' },
                  },
                  rubricEvaluation: true,
                },
              },
            },
          },
          feedbacks: {
            orderBy: { createdAt: 'asc' },
            include: {
              feedbackSections: true,
            },
          },
        },
      })
      console.log(`API: Successfully updated assessment record ${assessmentRecordId}`)
    } catch (updateError) {
      console.error('API: Error updating assessment record:', updateError)
      return NextResponse.json(
        {
          error: 'Failed to update assessment record',
          message: 'Unable to update assessment record data. Please try again.',
          details: updateError instanceof Error ? updateError.message : 'Unknown update error',
          type: 'UPDATE_ERROR',
          retryable: true,
        },
        { status: 500 },
      )
    }

    // Format response
    const submissionEvent = updatedRecord.assessmentHistory.find(
      (e) => e.eventType === 'submission',
    )
    const _teacherReviewEvent = updatedRecord.assessmentHistory.find(
      (e) => e.eventType === 'teacher_review',
    )

    const learner = await userPrisma.learner.findUnique({
      where: { id: updatedRecord.learnerId },
    })

    const formattedRecord: AssessmentRecord = {
      id: updatedRecord.id,
      tenantId: updatedRecord.tenantId,
      assessmentId: updatedRecord.assessmentId,
      learnerId: updatedRecord.learnerId,
      classSection: updatedRecord.classSection,
      learnerName: decryptName(learner?.name || '') || updatedRecord.learnerId,
      createdAt: updatedRecord.createdAt,
      updatedAt: updatedRecord.updatedAt,
      rubricScore: updatedRecord.rubricScore??'',
      teacherScore: updatedRecord.teacherScore??'',
      details: updatedRecord.details,
      type: updatedRecord.type,
      rawAnswer: updatedRecord.rawAnswer ? (typeof updatedRecord.rawAnswer === 'string' ? JSON.parse(updatedRecord.rawAnswer) : updatedRecord.rawAnswer as Record<string, unknown>) : {},
      status: updatedRecord.status,
      submittedAt: submissionEvent?.timestamp || updatedRecord.submittedAt,
      numberOfQuestions: updatedRecord.numberOfQuestions ?? '0',
      feedbacks: updatedRecord.feedbacks,
      studentAnswers: updatedRecord.studentAnswers,
      assessmentHistory: mapAssessmentHistoryForApi(updatedRecord.assessmentHistory),
    }

    return NextResponse.json(formattedRecord)
  } catch (error) {
    console.error('API: Unexpected error in assessment record update:', error)
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
