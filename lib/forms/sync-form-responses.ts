import AES from 'crypto-js/aes'
import type { forms_v1 } from 'googleapis'
import type { Prisma } from '@prisma/assessmentDB'
import { Answers } from '@/app/types'
import { decryptName } from '@/app/lib/utils/crypto-utils'
import { generateAiResponse } from '@/lib/langsmith/index'
import {
  needsAiFeedbackGeneration,
  type AiSuggestionShape,
} from '@/lib/forms/ai-feedback-presence'
import { prisma } from '@/lib/prisma'
import { userPrisma } from '@/lib/user-prisma'
import { classSectionFromAnswers } from '@/lib/forms/class-section-field'
import {
  isStudentNameFieldTitle,
  learnerNameUpdateData,
  resolveLearnerDisplayName,
  toPlaintextNameAnswers,
} from '@/lib/forms/resolve-learner-name'

function joinPresentValues(values: Array<string | null | undefined> | undefined): string {
  return (values ?? [])
    .map((value) => value?.trim() ?? '')
    .filter((value) => value.length > 0)
    .join('\n')
}

/**
 * Text answers (including every selected choice) and, when the question is a
 * file upload, the uploaded file names. A blank string means Google stored neither.
 */
function getResponseValue(
  questionId: string,
  questionTitle: string,
  answers: forms_v1.Schema$FormResponse['answers'],
) {
  const answer = answers?.[questionId]
  const textValue = joinPresentValues(answer?.textAnswers?.answers?.map((item) => item?.value))
  const fileValue = joinPresentValues(
    answer?.fileUploadAnswers?.answers?.map((item) => item?.fileName),
  )
  const answerValue = textValue || fileValue

  if (!answerValue) {
    return ''
  }

  // Encrypt learner name fields only — never Teacher Name (needed for nickname lookup).
  if (questionTitle && isStudentNameFieldTitle(questionTitle)) {
    const salt = process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
    if (!salt) {
      console.error('Salt for encryption is not defined.')
      return 'Encryption Error' // Or handle appropriately
    }
    return AES.encrypt(answerValue, salt).toString()
  }

  return answerValue
}

function buildFilteredAnswers(
  formData: { items?: forms_v1.Schema$Item[] },
  responseEntry: forms_v1.Schema$FormResponse,
): Answers[] {
  return (
    formData.items
      ?.map((question: forms_v1.Schema$Item) => {
        const questionId = question.questionItem?.question?.questionId
        if (!questionId) {
          return null
        }
        return {
          questionId,
          title: question.title || '',
          value: getResponseValue(questionId, question.title || '', responseEntry.answers),
        }
      })
      .filter((q: Answers | null): q is Answers => q !== null) ?? []
  )
}

/** Plaintext First/Last (etc.) straight from Google — used to refresh names on re-sync. */
function resolveNameFromGoogleResponse(
  formData: { items?: forms_v1.Schema$Item[] },
  responseEntry: forms_v1.Schema$FormResponse,
): string {
  const plaintextRows =
    formData.items
      ?.map((question: forms_v1.Schema$Item) => {
        const questionId = question.questionItem?.question?.questionId
        if (!questionId) {
          return null
        }
        const title = question.title || ''
        if (!isStudentNameFieldTitle(title)) {
          return null
        }
        const value =
          responseEntry.answers?.[questionId]?.textAnswers?.answers?.[0]?.value?.trim() || ''
        return { title, value }
      })
      .filter((q): q is { title: string; value: string } => q !== null) ?? []

  return resolveLearnerDisplayName(plaintextRows)
}

async function replaceMissingAiFeedback(args: {
  studentAnswerId: string
  assessmentRecordId: string
  recordStatus: string | undefined
  instructions: string
  answers: Answers[]
  existingSuggestionIds: string[]
}): Promise<void> {
  const aiSuggestions = await generateAiResponse(args.instructions, args.answers)
  // Persist strengths/suggestions and general placeholders. Skip only when the
  // model still produced nothing usable (empty or error-only), so a later sync
  // can try again without wiping the existing empty/error row.
  if (needsAiFeedbackGeneration([{ feedback: aiSuggestions.feedback }])) {
    return
  }

  if (args.existingSuggestionIds.length > 0) {
    await prisma.feedbackSection.deleteMany({
      where: { aiSuggestionsId: { in: args.existingSuggestionIds } },
    })
    await prisma.rubricEvaluation.deleteMany({
      where: { aiSuggestionsId: { in: args.existingSuggestionIds } },
    })
    await prisma.aiSuggestions.deleteMany({
      where: { id: { in: args.existingSuggestionIds } },
    })
  }

  const aiSuggestionsData = await prisma.aiSuggestions.create({
    data: {
      studentAnswerId: args.studentAnswerId,
      rubricScore: aiSuggestions.rubricScore,
      feedback: {
        create: (aiSuggestions.feedback || []).map((feedback) => ({
          type: feedback.type,
          section: feedback.section,
          content: feedback.content,
          order: feedback.order || 1,
        })),
      },
    },
  })

  if (aiSuggestions.rubricEvaluation && aiSuggestions.rubricEvaluation.length > 0) {
    await Promise.all(
      aiSuggestions.rubricEvaluation.map((evaluation) =>
        prisma.rubricEvaluation.create({
          data: {
            criterion: evaluation.criterion || '',
            evaluation: evaluation.evaluation || '',
            points: evaluation.points || '',
            rationale: evaluation.rationale || '',
            aiSuggestionsId: aiSuggestionsData.id,
          },
        }),
      ),
    )
  }

  if (args.recordStatus === 'handed_in') {
    await prisma.assessmentRecord.update({
      where: { id: args.assessmentRecordId },
      data: { status: 'ready_for_review' },
    })
  }
}

function encryptLearnerName(unencryptedName: string): string {
  if (!unencryptedName) {
    return ''
  }
  const salt = process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
  return salt ? AES.encrypt(unencryptedName, salt).toString() : unencryptedName
}

/**
 * Persist Google Form responses into AssessmentRecord / studentAnswer / AI suggestions.
 * Behavior matches the legacy `/api/forms/[formId]/sync` ingest loop.
 *
 * Prefer `assessmentId` when known (backoffice). Falling back to `googleFormId`
 * alone matches the historical Forms syncer lookup.
 */
export async function syncFormResponses(args: {
  formId: string
  formData: { items?: forms_v1.Schema$Item[] }
  responseData: forms_v1.Schema$FormResponse[]
  assessmentId?: string
}): Promise<{ assessmentId: string | null }> {
  const { formId, formData, responseData, assessmentId } = args

  const assessment = assessmentId
    ? await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { template: true },
      })
    : await prisma.assessment.findFirst({
        where: { googleFormId: formId },
        include: { template: true },
      })

  // Never upsert AssessmentRecord with an empty assessmentId (Prisma P2003).
  if (!assessment) {
    throw new Error(
      assessmentId
        ? 'Assessment not found'
        : `No assessment found for googleFormId: ${formId}`,
    )
  }

  for (const responseEntry of responseData) {
    if (!responseEntry.responseId) continue

    const studentAnswer = await prisma.studentAnswer.findFirst({
      where: { formSubmissionID: responseEntry.responseId },
      include: {
        assessmentRecord: { select: { status: true } },
        aiSuggestions: {
          select: {
            id: true,
            feedback: { select: { type: true, content: true } },
          },
        },
      },
    })

    // Already ingested: refresh the stored answers from the live Form (file
    // names, choices added later) and the learner display name. Generate AI
    // feedback only when this submission has none the teacher can see.
    if (studentAnswer) {
      const unencryptedName = resolveNameFromGoogleResponse(formData, responseEntry)
      const name = encryptLearnerName(unencryptedName)
      if (name && responseEntry.respondentEmail) {
        await userPrisma.learner.updateMany({
          where: { email: responseEntry.respondentEmail },
          data: learnerNameUpdateData(name),
        })
      }
      const refreshedAnswers = buildFilteredAnswers(formData, responseEntry)
      // An empty item list is a failed or partial form read, not a blank submission.
      if (refreshedAnswers.length === 0) {
        continue
      }
      // Keep rawAnswer in lockstep with studentAnswer.answers so name recovery
      // and other rawAnswer readers see file names and every choice.
      const classSection = classSectionFromAnswers(refreshedAnswers)
      const answersJson = refreshedAnswers as unknown as Prisma.InputJsonValue
      await prisma.$transaction([
        prisma.studentAnswer.update({
          where: { id: studentAnswer.id },
          data: { answers: answersJson },
        }),
        prisma.assessmentRecord.update({
          where: { id: studentAnswer.assessmentRecordId },
          data: {
            rawAnswer: answersJson,
            ...(classSection ? { classSection } : {}),
          },
        }),
      ])
      if (needsAiFeedbackGeneration(studentAnswer.aiSuggestions as AiSuggestionShape[])) {
        await replaceMissingAiFeedback({
          studentAnswerId: studentAnswer.id,
          assessmentRecordId: studentAnswer.assessmentRecordId,
          recordStatus: studentAnswer.assessmentRecord?.status,
          instructions: assessment.instructions ?? '',
          answers: refreshedAnswers,
          existingSuggestionIds: studentAnswer.aiSuggestions.map((suggestion) => suggestion.id),
        })
      }
      continue
    }

    const filteredAnswers: Answers[] = buildFilteredAnswers(formData, responseEntry)

    console.log('Filtered Answers:', filteredAnswers)

    // Name fields are encrypted in getResponseValue; decrypt before composing
    // so First + Last becomes a single learner display name.
    // On decrypt failure, values become '' — never treat ciphertext as a name.
    const plaintextNameAnswers = toPlaintextNameAnswers(filteredAnswers, decryptName)
    const unencryptedName =
      resolveLearnerDisplayName(plaintextNameAnswers) ||
      resolveNameFromGoogleResponse(formData, responseEntry)
    console.log('Unencrypted Name:', unencryptedName)

    const name = encryptLearnerName(unencryptedName)

    const classSection = classSectionFromAnswers(filteredAnswers)

    // Extract teacher selection from form
    const selectedTeacherName = filteredAnswers.find((q: Answers) =>
      q.title.includes('Teacher Name'),
    )?.value

    // Map teacher name to teacherId
    let selectedTeacherId = assessment?.teacherId || '' // Default fallback

    if (selectedTeacherName) {
      // Find teacher by name in the database
      const teacher = await userPrisma.teacher.findFirst({
        where: {
          teacherNickname: selectedTeacherName,
          tenantId: assessment?.tenantId || '',
        },
      })

      if (teacher) {
        selectedTeacherId = teacher.id
        console.log(`✅ Mapped teacher "${selectedTeacherName}" to ID: ${teacher.id}`)
      } else {
        console.log(
          `⚠️  Teacher "${selectedTeacherName}" not found in database, using default teacherId`,
        )
        continue
      }
    }

    console.log(responseEntry)
    console.log(responseEntry.respondentEmail)

    const learner = await (responseEntry.respondentEmail
      ? userPrisma.learner.upsert({
          where: { email: responseEntry.respondentEmail },
          // Only update name when we resolved one — never wipe with ''.
          update: learnerNameUpdateData(name),
          create: {
            // Empty is fine on create (no prior name to preserve); wipe risk is update-only.
            name: name || '',
            teacherId: selectedTeacherId,
            status: 'active',
            email: responseEntry.respondentEmail ?? crypto.randomUUID(),
            tenantId: assessment?.tenantId || '',
          },
        })
      : userPrisma.learner.upsert({
          where: { email: crypto.randomUUID() },
          update: {},
          create: {
            name: name || '',
            teacherId: selectedTeacherId,
            status: 'active',
            email: responseEntry.respondentEmail ?? crypto.randomUUID(),
            tenantId: assessment?.tenantId || '',
          },
        }))

    const leanerId = learner?.id

    const assessmentRecord = await prisma.assessmentRecord.upsert({
      include: {
        assessment: true,
      },
      where: {
        assessmentId_learnerId: {
          assessmentId: assessment?.id || '',
          learnerId: leanerId || '',
        },
      },
      update: {
        rawAnswer: filteredAnswers as unknown as Prisma.InputJsonValue,
        submittedAt: responseEntry.lastSubmittedTime
          ? new Date(responseEntry.lastSubmittedTime)
          : new Date(),
        status: 'handed_in', // Reset status on new submission
      },
      create: {
        tenantId: assessment?.tenantId || '',
        assessmentId: assessment?.id || '',
        classSection: classSection || '',
        learnerId: leanerId || '',
        rawAnswer: filteredAnswers as unknown as Prisma.InputJsonValue,
        submittedAt: responseEntry.lastSubmittedTime
          ? new Date(responseEntry.lastSubmittedTime)
          : new Date(),
        status: 'handed_in',
        type: assessment?.template.type || '',
        rubricScore: '',
        details: '',
        teacherScore: '',
        numberOfQuestions: (formData.items?.length || 0).toString(),
      },
    })

    const aiSuggestions = await generateAiResponse(
      assessment?.instructions ?? '',
      filteredAnswers,
    )

    const studentAnswerData = await prisma.studentAnswer.create({
      data: {
        assessmentRecordId: assessmentRecord.id,
        answers: filteredAnswers as unknown as Prisma.InputJsonValue, // Cast to Json type for Prisma
        formSubmissionID: responseEntry.responseId,
      },
    })

    // Create AI suggestions first
    const aiSuggestionsData = await prisma.aiSuggestions.create({
      data: {
        studentAnswerId: studentAnswerData.id,
        rubricScore: aiSuggestions.rubricScore,
        feedback: {
          create: (aiSuggestions.feedback || []).map((feedback) => ({
            type: feedback.type,
            section: feedback.section,
            content: feedback.content,
            order: feedback.order || 1,
          })),
        },
      },
    })

    // Create rubric evaluations separately with the aiSuggestions ID
    if (aiSuggestions.rubricEvaluation && aiSuggestions.rubricEvaluation.length > 0) {
      await Promise.all(
        aiSuggestions.rubricEvaluation.map((evaluation) =>
          prisma.rubricEvaluation.create({
            data: {
              criterion: evaluation.criterion || '',
              evaluation: evaluation.evaluation || '',
              points: evaluation.points || '',
              rationale: evaluation.rationale || '',
              aiSuggestionsId: aiSuggestionsData.id,
            },
          }),
        ),
      )
    }

    await prisma.assessmentRecord.update({
      where: {
        id: assessmentRecord.id,
      },
      data: {
        status: 'ready_for_review',
        studentAnswers: {
          connect: {
            id: studentAnswerData?.id || '',
          },
        },
      },
    })
  }

  if (assessment?.id) {
    const { refreshStudentResponsesCount } = await import(
      '@/lib/thematic-analysis/student-responses-count'
    )
    await refreshStudentResponsesCount(prisma, assessment.id)
  }

  return { assessmentId: assessment?.id ?? null }
}

/**
 * Pull live Google Form responses for an assessment and run the existing ingest loop.
 */
export async function syncAssessmentResponsesFromGoogle(assessmentId: string): Promise<{
  assessmentId: string
  googleFormId: string
  responseCount: number
}> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, googleFormId: true },
  })

  if (!assessment) {
    throw new Error('Assessment not found')
  }

  if (!assessment.googleFormId) {
    throw new Error('Assessment is missing googleFormId')
  }

  const { GoogleFormsClient } = await import('@/lib/forms/forms-client')
  const client = new GoogleFormsClient()
  await client.initialize()
  const formData = await client.getForm(assessment.googleFormId)
  const responseData = await client.listAllResponses(assessment.googleFormId)

  await syncFormResponses({
    formId: assessment.googleFormId,
    formData,
    responseData,
    assessmentId: assessment.id,
  })

  return {
    assessmentId: assessment.id,
    googleFormId: assessment.googleFormId,
    responseCount: responseData.length,
  }
}
