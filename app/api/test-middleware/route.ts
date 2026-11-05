import { NextResponse } from 'next/server'
import { withAuth, AuthorizedRequest } from '../middleware/authorization.middleware'

async function testMiddlewareHandler(request: AuthorizedRequest) {
  const user = request.user
  
  console.log('🧪 Test middleware handler called!')
  
  return NextResponse.json({
    message: 'Middleware funcionando! 🎉',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
    },
    timestamp: new Date().toISOString(),
  })
}

export const GET = withAuth(testMiddlewareHandler)
