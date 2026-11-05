import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { auth } from '@/lib/auth.config'
import type { LibraryExportGoogleTokenPayload } from './types'

const COOKIE_NAME = 'library_export_google'
const COOKIE_MAX_AGE_SECONDS = 60 * 60
/** Reject access tokens this close to expiry to avoid mid-request Google 401s. */
const EXPIRY_SKEW_MS = 30_000

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set')
  }
  return secret
}

export function libraryExportCookieName(): string {
  return COOKIE_NAME
}

/** Sign only the short-lived access session — never a Google refresh token. */
export function signLibraryExportGoogleToken(
  payload: LibraryExportGoogleTokenPayload,
): string {
  const session: LibraryExportGoogleTokenPayload = {
    accessToken: payload.accessToken,
    expiryDate: payload.expiryDate,
    email: payload.email,
    dottUserId: payload.dottUserId,
  }
  return jwt.sign(session, getSecret(), { expiresIn: '1h' })
}

export function verifyLibraryExportGoogleToken(
  token: string,
): LibraryExportGoogleTokenPayload | null {
  try {
    const payload = jwt.verify(token, getSecret()) as LibraryExportGoogleTokenPayload & {
      refreshToken?: unknown
    }
    if (!payload.accessToken || typeof payload.accessToken !== 'string') {
      return null
    }
    // Ignore legacy cookies that embedded a Google refresh token.
    if (payload.refreshToken) {
      return null
    }
    if (
      typeof payload.expiryDate === 'number' &&
      payload.expiryDate <= Date.now() + EXPIRY_SKEW_MS
    ) {
      return null
    }
    return {
      accessToken: payload.accessToken,
      expiryDate: payload.expiryDate,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      dottUserId: typeof payload.dottUserId === 'string' ? payload.dottUserId : undefined,
    }
  } catch {
    return null
  }
}

/**
 * Resolve the library export Google session from the httpOnly cookie.
 * Cookies must be bound to an Dott.it user at OAuth time; unbound/anonymous cookies are rejected.
 */
export async function resolveLibraryExportGoogleToken(): Promise<LibraryExportGoogleTokenPayload | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(libraryExportCookieName())?.value
  if (!sessionToken) {
    return null
  }

  const googleToken = verifyLibraryExportGoogleToken(sessionToken)
  if (!googleToken?.dottUserId) {
    return null
  }

  const session = await auth()
  if (session?.user?.id !== googleToken.dottUserId) {
    return null
  }

  return googleToken
}

export function libraryExportCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  }
}
