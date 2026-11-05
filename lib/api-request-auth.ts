import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth.config'
import { getTokenFromRequest, verifyAuthToken } from '@/lib/auth'

/**
 * Lightweight auth check (session email or JWT validity only).
 * For tenant-scoped workspace APIs prefer `requireWorkspaceAuth` from `@/app/lib/api/workspace-auth`.
 */
export async function isRequestAuthenticated(request: NextRequest): Promise<boolean> {
  const session = await auth()
  if (session?.user?.email) {
    return true
  }
  const token = getTokenFromRequest(request)
  return Boolean(token && verifyAuthToken(token))
}
