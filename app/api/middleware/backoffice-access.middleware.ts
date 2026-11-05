import { NextResponse } from 'next/server'
import { withAuth, type AuthorizedRequest } from './authorization.middleware'
import { userPrisma } from '@/lib/user-prisma'
import { ApiError } from '@/app/types'

// Re-export AuthorizedRequest for convenience
export type { AuthorizedRequest } from './authorization.middleware'

/**
 * Check if user belongs to Eddo tenant
 * Access is granted ONLY if user belongs to tenant with name "Eddo" or slug "eddo"
 */
async function hasBackofficeAccess(userTenantId: string | undefined): Promise<boolean> {
  if (!userTenantId) {
    return false
  }

  try {
    const tenant = await userPrisma.tenant.findUnique({
      where: { id: userTenantId },
      select: { name: true, slug: true },
    })

    if (!tenant) {
      return false
    }

    // Normalize tenant name and slug for comparison (trim and lowercase)
    const tenantName = tenant.name.toLowerCase().trim()
    const tenantSlug = tenant.slug.toLowerCase().trim()

    // STRICT list of allowed tenant names (case-insensitive)
    const allowedTenants = ['eddo']

    // STRICT list of allowed slugs (case-insensitive)
    const allowedSlugs = ['eddo']

    // Check if tenant matches EXACTLY (after normalization)
    const canAccessByName = allowedTenants.includes(tenantName)
    const canAccessBySlug = allowedSlugs.includes(tenantSlug)

    return canAccessByName || canAccessBySlug
  } catch {
    return false
  }
}

/**
 * Middleware that wraps API route handlers with authentication AND backoffice access check
 * Only users from the "eddo" tenant can access backoffice routes
 * @param handler - The API route handler function
 * @returns Wrapped handler with authentication and backoffice access check
 */
export function withBackofficeAccess<T extends unknown[]>(
  handler: (request: AuthorizedRequest, ...args: T) => Promise<NextResponse>
) {
  // First wrap with authentication
  const authWrappedHandler = withAuth(async (request: AuthorizedRequest, ...args: T) => {
    // Check if user has backoffice access
    const hasAccess = await hasBackofficeAccess(request.user.tenantId || undefined)

    if (!hasAccess) {
      return NextResponse.json<ApiError>(
        {
          error: 'Forbidden',
          message: 'Access denied',
          details: 'Backoffice access is restricted to Eddo tenant users only',
          type: 'UNEXPECTED_ERROR',
          retryable: false,
        },
        { status: 403 }
      )
    }

    // User is authenticated and has backoffice access, proceed with handler
    return handler(request, ...args)
  })

  return authWrappedHandler
}

