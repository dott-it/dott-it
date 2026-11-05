import { auth } from '@/lib/auth.config'
import { isBackofficeTenant } from '@/app/lib/api/backoffice-tenant'

export type BackofficeSessionResult =
  | { ok: true; tenantId: string }
  | { ok: false; status: 401 | 403 }

/**
 * Same gate as the backoffice UI and template drafts:
 * a signed-in user whose tenant isBackofficeTenant recognizes.
 */
export async function requireBackofficeSession(): Promise<BackofficeSessionResult> {
  const session = await auth()
  const tenantId = session?.user?.tenantId
  if (!tenantId) {
    return { ok: false, status: 401 }
  }

  const allowed = await isBackofficeTenant(tenantId)
  if (!allowed) {
    return { ok: false, status: 403 }
  }

  return { ok: true, tenantId }
}
