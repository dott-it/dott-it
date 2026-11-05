import { NextResponse } from 'next/server'
import {
  withBackofficeAccess,
  type AuthorizedRequest,
} from '@/app/api/middleware/backoffice-access.middleware'
import { ApiError } from '@/app/types'
import { syncAssessmentResponsesFromGoogle } from '@/lib/forms/sync-form-responses'

export const maxDuration = 300

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/assessments/[id]/sync-responses
 * Backoffice: pull live Google Form responses and run the existing Forms ingest loop.
 *
 * Requires GOOGLE_FORMS_IMPERSONATE_USER (and service-account DWD) to match the account
 * that Forms are shared with (typically forms-access@demo.dott.it in production).
 */
async function syncResponsesHandler(_request: AuthorizedRequest, context: RouteParams) {
  try {
    const { id: assessmentId } = await context.params

    if (!assessmentId) {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message: 'Assessment ID is required',
          details: 'Missing assessment id in route',
          type: 'PARSE_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    const result = await syncAssessmentResponsesFromGoogle(assessmentId)

    return NextResponse.json({
      success: true,
      message: 'Responses synced successfully.',
      ...result,
    })
  } catch (error) {
    console.error('sync-responses failed:', error)
    const message = error instanceof Error ? error.message : 'Failed to sync responses'

    if (
      message === 'Assessment not found' ||
      message.startsWith('No assessment found for googleFormId:')
    ) {
      return NextResponse.json<ApiError>(
        {
          error: 'Not found',
          message,
          details:
            'Ensure the assessment exists and its googleFormId matches the Google Form being synced',
          type: 'NOT_FOUND_ERROR',
          retryable: false,
        },
        { status: 404 },
      )
    }

    if (message === 'Assessment is missing googleFormId') {
      return NextResponse.json<ApiError>(
        {
          error: 'Validation error',
          message,
          details: 'Link a Google Form before syncing responses',
          type: 'PARSE_ERROR',
          retryable: false,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export const POST = withBackofficeAccess(syncResponsesHandler)
