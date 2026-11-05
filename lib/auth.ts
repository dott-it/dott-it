import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken'

export type AuthTokenPayload = JwtPayload & {
  sub: string
  email: string
  tenantId?: string | null
}

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET is not set')
  return secret
}

export function signAuthToken(
  payload: Omit<AuthTokenPayload, 'iat' | 'exp'>,
  expiresIn: SignOptions['expiresIn'] = '7d',
): string {
  return jwt.sign(payload, getSecret(), { expiresIn })
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    console.log('🔐 Verifying token:', token ? '***' + token.slice(-10) : 'null')
    const payload = jwt.verify(token, getSecret()) as AuthTokenPayload
    console.log('✅ Token verified successfully:', {
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
    })
    return payload
  } catch (error) {
    console.log(
      '❌ Token verification failed:',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return null
  }
}

type CookieStore = { get: (name: string) => { value: string } | undefined }
type RequestLike = { headers: Headers; cookies?: CookieStore }

export function getTokenFromRequest(req: Request | RequestLike): string | null {
  const withCookies = req as RequestLike
  // Prefer cookie named 'auth_token'
  const cookieToken = withCookies.cookies?.get('auth_token')?.value
  if (cookieToken) {
    console.log('🍪 Token found in cookie:', cookieToken ? '***' + cookieToken.slice(-10) : null)
    return cookieToken
  }

  // Fallback to Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  console.log('🔍 Auth header:', authHeader ? 'Bearer ***' + authHeader.slice(-10) : 'null')
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(' ')
  console.log('🔍 Token extraction:', {
    scheme,
    hasToken: !!token,
    token: token ? '***' + token.slice(-10) : null,
  })
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}
