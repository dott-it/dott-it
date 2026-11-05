import { after, NextResponse } from 'next/server'
import AES from 'crypto-js/aes'
import { prisma } from '@/lib/prisma'
import { userPrisma } from '@/lib/user-prisma'
import { decryptName } from '@/app/lib/utils'
import {
  displayNameFromLearnerEmail,
  isEmailLocalPartDisplayName,
  resolveLearnerNameFromAnswerSources,
} from '@/lib/forms/resolve-learner-name'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')

    const records = await prisma.assessmentRecord.findMany({
      where: { assessmentId: assessmentId || undefined },
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
          include: { aiSuggestions: { include: { feedback: true, rubricEvaluation: true } } },
        },
        feedbacks: {
          orderBy: { createdAt: 'asc' },
          include: {
            feedbackSections: true,
          },
        },
      },
    })

    const learnerIds = [
      ...new Set(records.map((record) => record.learnerId).filter(Boolean)),
    ]
    const learners =
      learnerIds.length > 0
        ? await userPrisma.learner.findMany({
            where: { id: { in: learnerIds } },
          })
        : []
    const learnerById = new Map(learners.map((learner) => [learner.id, learner]))

    // Match decryptName / sync: use the env salt as-is (no trim).
    const salt = process.env.NEXT_PUBLIC_STUDENT_NAME_SALT
    // First-wins per learner so divergent rawAnswers do not overwrite each other.
    const nameBackfills = new Map<string, string>()

    const formattedRecords = records.map((record) => {
      const submissionEvent = record.assessmentHistory.find((e) => e.eventType === 'submission')
      const teacherReviewEvent = record.assessmentHistory.find(
        (e) => e.eventType === 'teacher_review',
      )
      const learner = learnerById.get(record.learnerId)
      const storedName = (learner?.name ?? '').trim()
      const decryptedStored = decryptName(storedName)
      const answerSources: unknown[] = [
        record.rawAnswer,
        ...record.studentAnswers.map((answer) => answer.answers),
      ]
      const fromAnswers = resolveLearnerNameFromAnswerSources(answerSources, decryptName)
      const fromEmail = displayNameFromLearnerEmail(learner?.email)

      // Prefer First/Last from form answers over empty names or email-local-part
      // backfills (e.g. "31jenneell") that blocked real-name recovery.
      let learnerName = ''
      if (fromAnswers) {
        learnerName = fromAnswers
      } else if (
        decryptedStored &&
        !isEmailLocalPartDisplayName(decryptedStored, learner?.email)
      ) {
        learnerName = decryptedStored
      } else if (fromEmail) {
        // Display only — never persist email local-part as Learner.name.
        learnerName = fromEmail
      }

      const shouldBackfill =
        Boolean(salt && learner?.id && fromAnswers) &&
        (fromAnswers !== decryptedStored ||
          isEmailLocalPartDisplayName(decryptedStored, learner?.email) ||
          !storedName)

      if (shouldBackfill && fromAnswers && learner?.id && !nameBackfills.has(learner.id)) {
        nameBackfills.set(learner.id, AES.encrypt(fromAnswers, salt!).toString())
      }

      return {
        id: record.id,
        assessmentId: record.assessmentId,
        learnerId: record.learnerId,
        classSection: record.classSection,
        assessmentHistory: record.assessmentHistory,
        learnerName,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        rubricScore: record.rubricScore,
        teacherScore: record.teacherScore,
        feedbacks: record.feedbacks,
        studentAnswers: record.studentAnswers,
        details: record.details,
        type: record.type,
        rawAnswer:
          typeof record.rawAnswer === 'string'
            ? record.rawAnswer
            : JSON.stringify(record.rawAnswer) || '',
        status: record.status,
        submittedAt:
          submissionEvent?.timestamp.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) || 'Unknown',
        numberOfQuestions: 10,
        reviewedAt:
          teacherReviewEvent?.timestamp.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) || '',
      }
    })

    // Soft migration: best-effort, idempotent. Use after() so serverless keeps
    // the invocation alive without blocking list latency.
    if (nameBackfills.size > 0) {
      const backfills = [...nameBackfills.entries()]
      after(async () => {
        await Promise.all(
          backfills.map(([id, name]) =>
            userPrisma.learner
              .update({
                where: { id },
                data: { name },
              })
              .catch((error) => {
                console.error('Failed to backfill learner name:', id, error)
              }),
          ),
        )
      })
    }

    return NextResponse.json(formattedRecords)
  } catch (error) {
    console.error('Error fetching records:', error)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}
