import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth.config'
import { getTokenFromRequest, verifyAuthToken } from '@/lib/auth'
import { userPrisma } from '@/lib/user-prisma'

export type WorkspaceAuthContext = {
  ownerUserId: string
  tenantId: string
}

/**
 * Resolves the signed-in user id and tenant for workspace APIs (session cookie or Bearer JWT).
 * When the session has a user id but no tenantId (stale JWT), falls back to the user DB —
 * matching withAuth / getUserBySessionId behavior used by assessment routes.
 */
export async function getWorkspaceAuthFromRequest(
  request: NextRequest,
): Promise<WorkspaceAuthContext | null> {
  const session = await auth()
  const sessionId = session?.user?.id
  let sessionTenant = session?.user?.tenantId ?? null

  if (sessionId && !sessionTenant) {
    const user = await userPrisma.user.findUnique({
      where: { id: sessionId },
      select: { tenantId: true, active: true },
    })
    if (user?.active && user.tenantId) {
      sessionTenant = user.tenantId
    }
  }

  if (sessionId && sessionTenant) {
    return { ownerUserId: sessionId, tenantId: sessionTenant }
  }

  const token = getTokenFromRequest(request)
  const payload = token ? verifyAuthToken(token) : null
  const sub = payload?.sub
  const tenantId = payload?.tenantId
  if (sub && tenantId) {
    return { ownerUserId: sub, tenantId }
  }

  return null
}

export function workspaceUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'UNAUTHORIZED',
      message: 'Authentication required.',
      details: 'Missing or invalid auth token',
      type: 'UNEXPECTED_ERROR',
      retryable: false,
    },
    { status: 401 },
  )
}

export async function requireWorkspaceAuth(
  request: NextRequest,
): Promise<
  | { ok: true; auth: WorkspaceAuthContext }
  | { ok: false; response: NextResponse }
> {
  const authCtx = await getWorkspaceAuthFromRequest(request)
  if (!authCtx) {
    return { ok: false, response: workspaceUnauthorizedResponse() }
  }
  return { ok: true, auth: authCtx }
}
