import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { auth } from '@/lib/auth.config'
import { libraryExportAuthUrl } from '@/lib/library/export/google-oauth'
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
  const returnTo = searchParams.get('returnTo') ?? '/library/openscied'

  if (!isSafeLibraryExportReturnTo(returnTo)) {
    return NextResponse.json(
      { error: 'returnTo must be a same-origin relative path' },
      { status: 400 },
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    const oauthStart = `/api/library/export/auth/google?returnTo=${encodeURIComponent(returnTo)}`
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('callbackUrl', oauthStart)
    return NextResponse.redirect(loginUrl)
  }

  const state = jwt.sign({ returnTo, dottUserId: session.user.id }, getSecret(), {
    expiresIn: '10m',
  })
  const authUrl = libraryExportAuthUrl(origin, state)

  return NextResponse.redirect(authUrl)
}
