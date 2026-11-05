import { NextRequest, NextResponse } from 'next/server'
import { getUserBySessionId } from '../auth/utils/get-user-by-session'
import { User } from '@/app/types/domain/auth'

// Type for the user returned from Prisma
type _PrismaUser = {
  id: string
  name: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
  passwordHash: string | null
  tenantId: string | null
  createdAt: Date
  updatedAt: Date
  idpUserId: string | null
  role: string | null
}

/**
 * Authorization middleware for API routes
 * Validates user session and provides user context to protected routes
 */

export interface AuthorizedRequest extends NextRequest {
  user: User
}

export interface AuthorizationResult {
  success: boolean
  user?: User
  response?: NextResponse
}

/**
 * Middleware function that validates user authorization
 * @param request - The incoming request
 * @returns AuthorizationResult with success status, user data, or error response
 */
export async function withAuthorization(
  request: NextRequest
): Promise<AuthorizationResult> {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).slice(2, 9)
  
  console.log(`🔐 [${requestId}] Authorization middleware started:`, {
    method: request.method,
    url: request.url,
    pathname: new URL(request.url).pathname,
    userAgent: request.headers.get('user-agent')?.slice(0, 50) + '...',
    timestamp: new Date().toISOString(),
  })

  try {
    // Get user from session
    console.log(`🔍 [${requestId}] Calling getUserBySessionId...`)
    const prismaUser = await getUserBySessionId()

    if (!prismaUser) {
      const duration = Date.now() - startTime
      console.log(`❌ [${requestId}] Authorization failed - No valid session found:`, {
        duration: `${duration}ms`,
        reason: 'No user returned from getUserBySessionId',
        timestamp: new Date().toISOString(),
      })
      
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Valid session required to access this resource',
            type: 'UNAUTHORIZED',
          },
          { status: 401 }
        ),
      }
    }

    console.log(`👤 [${requestId}] Raw Prisma user data:`, {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      tenantId: prismaUser.tenantId,
      role: prismaUser.role,
      hasEmail: !!prismaUser.email,
      hasName: !!prismaUser.name,
      hasTenant: !!prismaUser.tenantId,
      hasRole: !!prismaUser.role,
    })

    // Transform Prisma user to our User type
    const user: User = {
      id: prismaUser.id,
      email: prismaUser.email || '',
      name: prismaUser.name || undefined,
      tenantId: prismaUser.tenantId || undefined,
      role: prismaUser.role || undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    }

    const duration = Date.now() - startTime
    console.log(`✅ [${requestId}] Authorization successful:`, {
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      user,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`💥 [${requestId}] Authorization error:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
    
    return {
      success: false,
      response: NextResponse.json(
        {
          error: 'Authorization Error',
          message: 'An error occurred during authorization',
          details: error instanceof Error ? error.message : 'Unknown error',
          type: 'AUTHORIZATION_ERROR',
        },
        { status: 500 }
      ),
    }
  }
}

/**
 * Higher-order function that wraps API route handlers with authorization
 * @param handler - The API route handler function
 * @returns Wrapped handler with authorization
 */
export function withAuth<T extends unknown[]>(
  handler: (request: AuthorizedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const requestId = Math.random().toString(36).slice(2, 9)
    const startTime = Date.now()
    
    console.log(`🛡️ [${requestId}] withAuth wrapper called:`, {
      method: request.method,
      url: request.url,
      pathname: new URL(request.url).pathname,
      timestamp: new Date().toISOString(),
    })

    const authResult = await withAuthorization(request)

    if (!authResult.success) {
      const duration = Date.now() - startTime
      console.log(`🚫 [${requestId}] withAuth - Authorization failed, returning error response:`, {
        duration: `${duration}ms`,
        status: authResult.response?.status,
        timestamp: new Date().toISOString(),
      })
      return authResult.response!
    }

    // Create authorized request with user context
    const authorizedRequest = request as AuthorizedRequest
    authorizedRequest.user = authResult.user!

    console.log(`🎯 [${requestId}] withAuth - Calling protected handler:`, {
      userId: authResult.user!.id,
      userEmail: authResult.user!.email,
      timestamp: new Date().toISOString(),
    })

    try {
      const handlerStartTime = Date.now()
      const response = await handler(authorizedRequest, ...args)
      const handlerDuration = Date.now() - handlerStartTime
      const totalDuration = Date.now() - startTime
      
      console.log(`🎉 [${requestId}] withAuth - Handler completed successfully:`, {
        handlerDuration: `${handlerDuration}ms`,
        totalDuration: `${totalDuration}ms`,
        responseStatus: response.status,
        timestamp: new Date().toISOString(),
      })
      
      return response
    } catch (error) {
      const totalDuration = Date.now() - startTime
      console.error(`💥 [${requestId}] withAuth - Handler error:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalDuration: `${totalDuration}ms`,
        timestamp: new Date().toISOString(),
      })
      throw error
    }
  }
}

/**
 * Utility function to check if user has specific tenant access
 * @param user - The authenticated user
 * @param requiredTenantId - The tenant ID required for access
 * @returns boolean indicating if user has access
 */
export function hasTenantAccess(user: User, requiredTenantId: string): boolean {
  const hasAccess = user.tenantId === requiredTenantId
  
  console.log(`🏢 Tenant access check:`, {
    userId: user.id,
    userTenantId: user.tenantId,
    requiredTenantId,
    hasAccess,
    timestamp: new Date().toISOString(),
  })
  
  return hasAccess
}

/**
 * Utility function to check if user has admin role
 * @param user - The authenticated user
 * @returns boolean indicating if user is admin
 */
export function isAdmin(user: User): boolean {
  const isUserAdmin = user.role === 'admin'
  
  console.log(`👑 Admin role check:`, {
    userId: user.id,
    userRole: user.role,
    isAdmin: isUserAdmin,
    timestamp: new Date().toISOString(),
  })
  
  return isUserAdmin
}
