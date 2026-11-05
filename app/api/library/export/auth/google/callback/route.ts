import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { auth } from '@/lib/auth.config'
import { exchangeLibraryExportCode } from '@/lib/library/export/google-oauth'
import {
  libraryExportCookieName,
  libraryExportCookieOptions,
  signLibraryExportGoogleToken,
} from '@/lib/library/export/google-export-session'
import { isSafeLibraryExportReturnTo } from '@/lib/library/export/safe-return-to'

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set')
  }
  return secret
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  if (oauthError) {
    return NextResponse.redirect(`${origin}/library/openscied?exportError=${oauthError}`)
  }

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing OAuth code or state' }, { status: 400 })
  }

  let returnTo = '/library/openscied'
  let stateEddoUserId: string | undefined
  try {
    const payload = jwt.verify(state, getSecret()) as {
      returnTo?: string
      eddoUserId?: string
    }
    if (payload.returnTo && isSafeLibraryExportReturnTo(payload.returnTo)) {
      returnTo = payload.returnTo
    }
    if (typeof payload.eddoUserId === 'string' && payload.eddoUserId.trim()) {
      stateEddoUserId = payload.eddoUserId.trim()
    }
  } catch {
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 })
  }

  const eddoSession = await auth()
  const eddoUserId = eddoSession?.user?.id
  if (!eddoUserId) {
    const oauthStart = `/api/library/export/auth/google?returnTo=${encodeURIComponent(returnTo)}`
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('callbackUrl', oauthStart)
    return NextResponse.redirect(loginUrl)
  }

  if (stateEddoUserId && stateEddoUserId !== eddoUserId) {
    const redirectUrl = new URL(returnTo, origin)
    redirectUrl.searchParams.set('exportError', 'session_mismatch')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    const googleToken = await exchangeLibraryExportCode(origin, code)
    const sessionToken = signLibraryExportGoogleToken({
      ...googleToken,
      eddoUserId,
    })
    const redirectUrl = new URL(returnTo, origin)
    redirectUrl.searchParams.set('googleExport', 'ready')

    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set(libraryExportCookieName(), sessionToken, libraryExportCookieOptions())
    return response
  } catch (error) {
    console.error('Library export Google OAuth callback failed:', error)
    const redirectUrl = new URL(returnTo, origin)
    redirectUrl.searchParams.set('exportError', 'oauth_failed')
    return NextResponse.redirect(redirectUrl)
  }
}
