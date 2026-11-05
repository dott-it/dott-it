import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDemoModeConfig } from '@/lib/demo-mode'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')
    const studentId = searchParams.get('studentId')

    console.log('🔍 Student Assessment Detail API called:', { assessmentId, studentId })

    if (!assessmentId || !studentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: assessmentId and studentId' },
        { status: 400 },
      )
    }

    // Check demo mode
    const demoConfig = getDemoModeConfig()
    console.log('API: Demo mode enabled:', demoConfig.isEnabled)

  // Using the global Prisma client singleton. Do not call $connect()/$disconnect() per-request

    // Build where clause
    const whereClause = demoConfig.isEnabled
      ? {} // In demo mode, get any record
      : {
          assessmentId: assessmentId,
          learnerId: studentId,
        }

    // Fetch record with all relations
    const record = await prisma.assessmentRecord.findFirst({
      where: whereClause,
      include: {
        assessment: {
          include: {
            template: true,
          },
        },
        assessmentHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    if (!record) {
      return NextResponse.json({ error: 'Student assessment record not found' }, { status: 404 })
    }

    // Process events
    const submissionEvent = record.assessmentHistory.find((e) => e.eventType === 'submission')
    const aiReviewEvent = record.assessmentHistory.find((e) => e.eventType === 'ai_review')
    const teacherReviewEvent = record.assessmentHistory.find((e) => e.eventType === 'teacher_review')

    // Determine status - use original status from database if it's handed_in
    let status = record.status
    if (record.status === 'handed_in') {
      status = 'handed_in'
    } else if (teacherReviewEvent) {
      status = 'reviewed'
    } else     if (aiReviewEvent) {
      status = 'ready_for_review'
    } else if (submissionEvent) {
      status = 'handed_in'
    } else {
      status = 'pending'
    }

    // Get team/class info - using classSection from the record
    const className = record.classSection || null

    // Process feedback similar to v1 API
    const feedback: Array<{
      type: string
      section: string
      content: string
    }> = []

    if (aiReviewEvent?.eventData) {
      const aiData = aiReviewEvent.eventData as Record<string, unknown>
      const feedbackData = aiData.feedback as Record<string, unknown> | undefined
      if (feedbackData?.strengths && typeof feedbackData.strengths === 'string') {
        feedback.push({
          type: 'strength',
          section: 'Model Explanation',
          content: feedbackData.strengths,
        })
      }
      if (feedbackData?.suggestions && typeof feedbackData.suggestions === 'string') {
        feedback.push({
          type: 'improvement',
          section: 'Data Use',
          content: feedbackData.suggestions,
        })
      }
    }

    // Format the response
    const formattedRecord = {
      id: record.id,
      assessmentId: record.assessmentId,
      studentName: record.learnerId, // Using learnerId as studentName since learnerName doesn't exist
      studentId: record.learnerId,
      email: undefined, // Email not available in current schema
      classSection: className || undefined,
      status: status,
      submittedAt: submissionEvent?.timestamp.toISOString() || null,
      totalResponses: record.assessmentHistory.filter((e) => e.eventType === 'submission').length,
      lastFeedbackDate: (teacherReviewEvent || aiReviewEvent)?.timestamp.toISOString() || null,
      score: record.rubricScore || undefined,
      studentResponse: submissionEvent?.eventData
        ? JSON.stringify(submissionEvent.eventData)
        : null,
      feedback: feedback, // Include feedback array
      // Include assessment information
      assessment: {
        id: record.assessment.id,
        title: record.assessment.template?.title || record.assessment.id,
        unitName: record.assessment.template?.subject || 'Unknown Unit',
        subject: record.assessment.template?.subject || 'Science',
        grade: Number.parseInt(record.assessment.template?.gradeLevel || '8', 10),
        type: 'formative',
        status: record.assessment.status,
        dueDate: record.assessment.dueAt.split('T')[0],
        description: record.assessment.template?.description || '',
      },
    }

    return NextResponse.json(formattedRecord)
  } catch (error) {
    console.error('Error in student assessment detail API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student assessment detail' },
      { status: 500 },
    )
  }
}
