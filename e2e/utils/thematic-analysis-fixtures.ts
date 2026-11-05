import type { Page, Route } from '@playwright/test'
import type {
  ActiveAssessment,
  AssessmentRecord,
  ThematicAnalysis,
} from '@/types'

export const THEMATIC_E2E_ASSESSMENT_ID = 'assessment-e2e-thematic'

const sessionPayload = {
  user: {
    id: 'e2e-user-id',
    name: 'E2E Teacher',
    email: 'e2e@demo.dott.it',
    tenantId: 'tenant-e2e',
  },
  expires: '2099-12-31T00:00:00.000Z',
}

export function buildAssessment(
  overrides: Partial<ActiveAssessment> = {},
): ActiveAssessment {
  return {
    id: THEMATIC_E2E_ASSESSMENT_ID,
    tenantId: 'tenant-e2e',
    templateId: 'template-e2e',
    teacherId: 'teacher-e2e',
    assignedBy: 'teacher-e2e',
    assignedAt: '2026-05-01T00:00:00.000Z',
    dueAt: '2026-06-01T00:00:00.000Z',
    assignedTo: {},
    status: 'live',
    numberOfQuestions: 3,
    title: 'Green Anole Explanation',
    unitName: 'Unit 8.6',
    grade: 8,
    totalRecords: 2,
    submissionStatus: {
      handedIn: 2,
      readyForReview: 1,
      inProgress: 0,
      shared: 1,
    },
    ...overrides,
  }
}

export function buildRecord(
  id: string,
  learnerId: string,
  learnerName: string,
  withAnswers: boolean,
): AssessmentRecord {
  const now = new Date('2026-05-15T12:00:00.000Z')
  return {
    id,
    tenantId: 'tenant-e2e',
    assessmentId: THEMATIC_E2E_ASSESSMENT_ID,
    classSection: 'Period 2',
    learnerId,
    learnerName,
    rawAnswer: {},
    submittedAt: now,
    status: 'ready_for_review',
    rubricScore: null,
    details: '',
    type: 'form',
    teacherScore: null,
    numberOfQuestions: '3',
    createdAt: now,
    updatedAt: now,
    studentAnswers: withAnswers
      ? [
          {
            id: `sa-${id}`,
            assessmentRecordId: id,
            answers: [
              { title: 'Question 1', value: 'Cancer steals resources from the body.' },
            ],
            aiSuggestions: [],
            createdAt: now,
            updatedAt: now,
          },
        ]
      : [],
  }
}

export function buildCompletedThematicAnalysis(): ThematicAnalysis {
  const now = new Date('2026-05-20T14:00:00.000Z')
  return {
    id: 'thematic-analysis-e2e',
    assessmentId: THEMATIC_E2E_ASSESSMENT_ID,
    status: 'completed',
    responsesCount: 2,
    summary: 'Students show mixed understanding of biological mechanisms.',
    createdAt: now,
    updatedAt: now,
    items: [
      {
        id: 'theme-need-1',
        type: 'need',
        title: 'Biological Accuracy',
        description: 'Students struggle with accuracy of biological claims.',
        order: 0,
        citations: [
          {
            id: 'cite-1',
            learnerId: 'learner-aaa',
            assessmentRecordId: 'record-aaa',
            learnerName: 'Lucas Anderson',
            highlights: ['Cancer steals resources from the body.'],
            annotation: 'Reflects a common misconception about cancer cell behavior.',
          },
        ],
      },
      {
        id: 'theme-strength-1',
        type: 'strength',
        title: 'Evidence Use',
        description: 'Students effectively cite evidence from the text.',
        order: 1,
        citations: [],
      },
    ],
  }
}

export type ThematicAnalysisRouteState = ThematicAnalysis | null

export interface ThematicAnalysisMockOptions {
  records?: AssessmentRecord[]
  thematicAnalysis?: ThematicAnalysisRouteState
  /** Called on each GET to allow dynamic responses (e.g. after POST). */
  getThematicAnalysis?: () => ThematicAnalysisRouteState
  onTriggerPost?: () => ThematicAnalysisRouteState
}

export async function setupThematicAnalysisPageMocks(
  page: Page,
  options: ThematicAnalysisMockOptions = {},
): Promise<void> {
  const assessment = buildAssessment()
  const records =
    options.records ??
    [
      buildRecord('record-aaa', 'learner-aaa', 'Lucas Anderson', true),
      buildRecord('record-bbb', 'learner-bbb', 'Morgan Lee', true),
    ]

  let thematicState: ThematicAnalysisRouteState =
    options.thematicAnalysis !== undefined
      ? options.thematicAnalysis
      : buildCompletedThematicAnalysis()

  await page.route('**/api/auth/session', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sessionPayload),
    })
  })

  await page.route(
    `**/api/assessments/${THEMATIC_E2E_ASSESSMENT_ID}`,
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(assessment),
      })
    },
  )

  await page.route('**/api/assessment-records?**', async (route: Route) => {
    const url = new URL(route.request().url())
    if (url.searchParams.get('assessmentId') !== THEMATIC_E2E_ASSESSMENT_ID) {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(records),
    })
  })

  await page.route(
    `**/api/thematic-analysis/${THEMATIC_E2E_ASSESSMENT_ID}`,
    async (route: Route) => {
      if (route.request().method() === 'GET') {
        const payload = options.getThematicAnalysis
          ? options.getThematicAnalysis()
          : thematicState
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(payload),
        })
        return
      }

      if (route.request().method() === 'POST') {
        thematicState = options.onTriggerPost
          ? options.onTriggerPost()
          : {
              ...buildCompletedThematicAnalysis(),
              status: 'processing',
              items: [],
              summary: null,
            }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(thematicState),
        })
      }
    },
  )
}

export function assessmentDetailPath(): string {
  return `/workspace/assessments/${THEMATIC_E2E_ASSESSMENT_ID}`
}
