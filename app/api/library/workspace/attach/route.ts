import { NextRequest, NextResponse } from 'next/server'
import { findIngestedAssessment } from '@/lib/library/ingest/load-manifest'
import {
  buildLibraryWorkspaceAttachPayload,
  fetchGoogleFormQuestionCount,
  LibraryWorkspaceAttachError,
  parseGoogleFormId,
} from '@/lib/library/workspace'
import { getPackageItem, isWorkspaceEligible, materialContextFromIngested } from '@/lib/library/materials'
import { libraryGoogleFormUrl } from '@/lib/library/materials/library-form-url'
import { requireWorkspaceAuth } from '@/app/lib/api/workspace-auth'
import { prisma } from '@/lib/prisma'
import { getUserPrisma } from '@/lib/user-prisma'
import { getCurrentSchoolYear } from '@/lib/school-year'

interface AttachRequestBody {
  unitCode?: string
  assessmentId?: string
}

type AttachAssessmentRow = {
  id: string
  template: { title: string }
}

function attachSuccessResponse(
  assessment: AttachAssessmentRow,
  alreadyAttached: boolean,
  status: 200 | 201,
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      assessmentId: assessment.id,
      title: assessment.template.title,
      alreadyAttached,
      redirectUrl: `/workspace/assessments/${assessment.id}`,
    },
    { status },
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireWorkspaceAuth(request)
  if (!authResult.ok) {
    return authResult.response
  }

  const body = (await request.json().catch(() => ({}))) as AttachRequestBody
  const unitCode = body.unitCode?.trim()
  const assessmentId = body.assessmentId?.trim()

  if (!unitCode || !assessmentId) {
    return NextResponse.json(
      { error: 'unitCode and assessmentId are required' },
      { status: 400 },
    )
  }

  const ingestedRow = findIngestedAssessment(unitCode, assessmentId)
  if (!ingestedRow) {
    return NextResponse.json({ error: 'Assessment not found in library catalog' }, { status: 404 })
  }

  let payload
  try {
    const context = materialContextFromIngested(ingestedRow)
    if (!isWorkspaceEligible(context)) {
      throw new LibraryWorkspaceAttachError(
        'This assessment is not yet available for Workspace. Export materials instead.',
        'NOT_ELIGIBLE',
      )
    }

    const formItem = getPackageItem(context, 'google-form')
    const submissionUrl = formItem?.url?.startsWith('http')
      ? formItem.url
      : libraryGoogleFormUrl(ingestedRow.files)
    const googleFormId = submissionUrl ? parseGoogleFormId(submissionUrl) : null
    if (!googleFormId) {
      throw new LibraryWorkspaceAttachError(
        'Google Form URL must include a Forms API formId (/forms/d/{formId}/…), not a published /d/e/ link.',
        'MISSING_FORM',
      )
    }

    const numberOfQuestions = await fetchGoogleFormQuestionCount(googleFormId)
    payload = buildLibraryWorkspaceAttachPayload({
      unitCode,
      assessmentId,
      ingestedRow,
      numberOfQuestions,
    })
  } catch (error) {
    if (error instanceof LibraryWorkspaceAttachError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 })
    }
    console.error('Library workspace attach question count failed:', error)
    return NextResponse.json(
      {
        error: 'Could not read Google Form question count. Try again or export materials instead.',
        code: 'INVALID_QUESTION_COUNT',
      },
      { status: 502 },
    )
  }

  const userPrisma = getUserPrisma()
  const teacher = await userPrisma.teacher.findFirst({
    where: { userId: authResult.auth.ownerUserId },
  })
  if (!teacher) {
    return NextResponse.json(
      {
        error: 'Teacher profile required to attach this assessment to Workspace.',
        code: 'TEACHER_REQUIRED',
      },
      { status: 403 },
    )
  }
  const teacherId = teacher.id
  const tenantId = authResult.auth.tenantId

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.assessment.findFirst({
          where: {
            tenantId,
            teacherId,
            googleFormId: payload.googleFormId,
          },
          include: { template: true },
        })

        if (existing) {
          return { assessment: existing, alreadyAttached: true as const }
        }

        let template = await tx.assessmentTemplate.findFirst({
          where: {
            unitCode: payload.unitCode,
            title: payload.title,
          },
        })

        if (!template) {
          template = await tx.assessmentTemplate.create({
            data: {
              title: payload.title,
              type: 'OpenSciEd Library',
              description: payload.description,
              subject: payload.subject,
              gradeLevel: payload.gradeLevel,
              unitCode: payload.unitCode,
            },
          })
        }

        const assessment = await tx.assessment.create({
          data: {
            templateId: template.id,
            tenantId,
            teacherId,
            assignedBy: teacherId,
            assignedAt: new Date().toISOString(),
            dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            assignedTo: [{ type: 'class', id: 'library', name: 'Library import' }],
            status: 'live',
            instructions: payload.description,
            submissionUrl: payload.submissionUrl,
            googleFormId: payload.googleFormId,
            numberOfQuestions: payload.numberOfQuestions,
            schoolYear: getCurrentSchoolYear(),
            unitCode: payload.unitCode,
            studentResponsesCount: 0,
          },
          include: { template: true },
        })

        return { assessment, alreadyAttached: false as const }
      },
      { isolationLevel: 'Serializable' },
    )

    return attachSuccessResponse(
      result.assessment,
      result.alreadyAttached,
      result.alreadyAttached ? 200 : 201,
    )
  } catch (error) {
    const prismaCode =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
        ? (error as { code: string }).code
        : ''

    // Concurrent attach won the race — return the row that landed for this teacher.
    if (prismaCode === 'P2034' || prismaCode === 'P2002') {
      const existing = await prisma.assessment.findFirst({
        where: {
          tenantId,
          teacherId,
          googleFormId: payload.googleFormId,
        },
        include: { template: true },
      })
      if (existing) {
        return attachSuccessResponse(existing, true, 200)
      }
    }

    throw error
  }
}
