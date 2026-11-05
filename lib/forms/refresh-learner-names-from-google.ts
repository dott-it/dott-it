import AES from 'crypto-js/aes'
import type { forms_v1 } from 'googleapis'
import { prisma } from '@/lib/prisma'
import { userPrisma } from '@/lib/user-prisma'
import { GoogleFormsClient } from '@/lib/forms/forms-client'
import {
  isStudentNameFieldTitle,
  resolveLearnerDisplayName,
} from '@/lib/forms/resolve-learner-name'

/**
 * Resolve First+Last (etc.) from a live Google Forms response + form item titles.
 */
export function resolveDisplayNameFromGoogleFormResponse(
  formItems: forms_v1.Schema$Item[] | undefined,
  response: forms_v1.Schema$FormResponse,
): string {
  const rows =
    formItems
      ?.map((question) => {
        const questionId = question.questionItem?.question?.questionId
        if (!questionId) {
          return null
        }
        const title = question.title || ''
        if (!isStudentNameFieldTitle(title)) {
          return null
        }
        const value =
          response.answers?.[questionId]?.textAnswers?.answers?.[0]?.value?.trim() || ''
        return { title, value }
      })
      .filter((row): row is { title: string; value: string } => row !== null) ?? []

  return resolveLearnerDisplayName(rows)
}

function encryptLearnerName(unencryptedName: string): string {
  if (!unencryptedName) {
    return ''
  }
  const salt = process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
  return salt ? AES.encrypt(unencryptedName, salt).toString() : unencryptedName
}

function patchNameFieldsInAnswersJson(
  raw: unknown,
  formItems: forms_v1.Schema$Item[] | undefined,
  response: forms_v1.Schema$FormResponse,
): unknown {
  if (!Array.isArray(raw)) {
    return raw
  }

  const titleByQuestionId = new Map<string, string>()
  for (const item of formItems ?? []) {
    const questionId = item.questionItem?.question?.questionId
    if (questionId && item.title) {
      titleByQuestionId.set(questionId, item.title)
    }
  }

  return raw.map((entry) => {
    if (typeof entry !== 'object' || entry === null) {
      return entry
    }
    const row = entry as { questionId?: string; title?: string; value?: string }
    const title =
      (typeof row.title === 'string' && row.title) ||
      (typeof row.questionId === 'string' ? titleByQuestionId.get(row.questionId) : '') ||
      ''
    if (!isStudentNameFieldTitle(title)) {
      return entry
    }
    const questionId =
      typeof row.questionId === 'string'
        ? row.questionId
        : [...titleByQuestionId.entries()].find(([, t]) => t === title)?.[0]
    if (!questionId) {
      return entry
    }
    const plaintext =
      response.answers?.[questionId]?.textAnswers?.answers?.[0]?.value?.trim() || ''
    if (!plaintext) {
      return entry
    }
    return {
      ...row,
      title,
      value: encryptLearnerName(plaintext),
    }
  })
}

export type RefreshLearnerNamesResult = {
  assessmentId: string
  googleFormId: string
  updated: number
  skippedNoName: number
  skippedNoMatch: number
  responseCount: number
}

/**
 * Pull live Google Form responses and overwrite Learner.name with First+Last plaintext
 * for submissions already linked via StudentAnswer.formSubmissionID.
 */
export async function refreshLearnerNamesForAssessment(
  assessmentId: string,
): Promise<RefreshLearnerNamesResult> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, googleFormId: true },
  })

  if (!assessment?.googleFormId) {
    throw new Error('Assessment not found or missing googleFormId')
  }

  const client = new GoogleFormsClient()
  await client.initialize()
  const form = await client.getForm(assessment.googleFormId)
  const listed = await client.getResponses(assessment.googleFormId)
  const responses = listed.responses ?? []

  const studentAnswers = await prisma.studentAnswer.findMany({
    where: {
      assessmentRecord: { assessmentId },
    },
    select: {
      formSubmissionID: true,
      assessmentRecordId: true,
      assessmentRecord: {
        select: {
          id: true,
          learnerId: true,
          rawAnswer: true,
        },
      },
    },
  })

  const bySubmissionId = new Map(
    studentAnswers
      .filter((row) => Boolean(row.formSubmissionID))
      .map((row) => [row.formSubmissionID, row]),
  )

  let updated = 0
  let skippedNoName = 0
  let skippedNoMatch = 0

  for (const response of responses) {
    const responseId = response.responseId
    if (!responseId) {
      continue
    }
    const matched = bySubmissionId.get(responseId)
    if (!matched) {
      skippedNoMatch += 1
      continue
    }

    const displayName = resolveDisplayNameFromGoogleFormResponse(form.items, response)
    if (!displayName) {
      skippedNoName += 1
      continue
    }

    const encryptedName = encryptLearnerName(displayName)
    await userPrisma.learner.update({
      where: { id: matched.assessmentRecord.learnerId },
      data: { name: encryptedName },
    })

    const patchedRaw = patchNameFieldsInAnswersJson(
      matched.assessmentRecord.rawAnswer,
      form.items,
      response,
    )
    await prisma.assessmentRecord.update({
      where: { id: matched.assessmentRecord.id },
      data: { rawAnswer: patchedRaw as object },
    })

    updated += 1
  }

  return {
    assessmentId: assessment.id,
    googleFormId: assessment.googleFormId,
    updated,
    skippedNoName,
    skippedNoMatch,
    responseCount: responses.length,
  }
}
