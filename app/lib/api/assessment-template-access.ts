import { NextResponse } from 'next/server'
import type { ApiError } from '@/app/types'
import { requireBackofficeSession } from '@/app/lib/api/require-backoffice-session'

const FORBIDDEN: ApiError = {
  error: 'Forbidden',
  message: 'Access denied',
  details: 'Assessment templates are restricted to Eddo tenant users',
  type: 'QUERY_ERROR',
  retryable: false,
}

/**
 * Blocks template reads and writes unless the session belongs to a backoffice tenant.
 * Returns a response to send, or null when the caller may continue.
 */
export async function assessmentTemplateAccessResponse(
  unauthorizedDetails: string,
): Promise<NextResponse | null> {
  const access = await requireBackofficeSession()
  if (access.ok) {
    return null
  }

  if (access.status === 401) {
    const unauthorized: ApiError = {
      error: 'Unauthorized',
      message: 'User session not found',
      details: unauthorizedDetails,
      type: 'QUERY_ERROR',
      retryable: false,
    }
    return NextResponse.json<ApiError>(unauthorized, { status: 401 })
  }

  return NextResponse.json<ApiError>(FORBIDDEN, { status: 403 })
}
