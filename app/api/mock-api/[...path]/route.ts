import { env } from '@/app/env/client.mjs'
import { logger } from '@/server/logger'
import { MockServer } from '@/server/mock-server'
import { error, Result } from '@/utils/result'

function mockProxyIntercept(_path: string, request: Request): void {
  if (env.MOCK_API_PROXY_API_URL != null) {
    request.headers.set('Origin', env.MOCK_API_PROXY_API_URL)
  }
}

async function getMockFile(method: string, path: string): Promise<Result<object>> {
  const file = Array.isArray(path) ? path.join('-') : path
  try {
    logger.info('Mock trying path: %s', `@/mocks/${method}/${file}.json`)
    const importedModule = await import(`@/mocks/${method}/${file}.json`, {
      assert: { type: 'json' },
    })
    const body = importedModule.default
    logger.info('Mock from file found: %s', `${method}/${file}.json`)
    return body
  } catch (e) {
    logger.error('File variant not found: %s', `${method}/${file}.json`)
    return error(e)
  }
}

// Custom handler that completely bypasses mock for real routes
async function bypassMockForRealRoutes(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const fullPath = path.join('/')

  // Don't mock these routes - they have real implementations
  const realRoutes = ['api/assessment-records/', 'api/assessments/', 'api/auth/']

  const hasRealImplementation = realRoutes.some((route) => fullPath.startsWith(route))

  if (hasRealImplementation) {
    // Return 404 so Next.js can route to the real endpoint
    return new Response('Not Found', { status: 404 })
  }

  // For other routes, use the mock server
  const mockServer = new MockServer({
    getMockFile,
    enabled: env.NEXT_PUBLIC_MOCK_API_ENABLED,
    mockApiPath: env.API_URL,
    proxyUrl: undefined, // Disable proxy completely
    mockVariantHeader: 'x-mock-enabled',
    mockProxyIntercept,
    logger: logger.info.bind(logger),
  })

  // Convert the Next.js context to MockContext format
  const mockContext = { params: { path } }
  return mockServer.getHandler()(request, mockContext)
}

export const GET = bypassMockForRealRoutes
export const POST = bypassMockForRealRoutes
export const PUT = bypassMockForRealRoutes
export const PATCH = bypassMockForRealRoutes
export const DELETE = bypassMockForRealRoutes
