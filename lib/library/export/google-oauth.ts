import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import type { LibraryExportGoogleTokenPayload } from './types'

/**
 * Full Drive scope is required so export/download use the teacher's own ACLs on
 * OpenSciEd Shared Drive materials (`files.copy` / media download). `drive.file`
 * cannot read those curriculum sources; switching to it would force a service-account
 * read path that bypasses teacher Viewer checks.
 */
export const LIBRARY_EXPORT_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive'
export const LIBRARY_EXPORT_FORMS_SCOPE = 'https://www.googleapis.com/auth/forms.body'

export function libraryExportRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, '')}/api/library/export/auth/google/callback`
}

export function createLibraryExportOAuthClient(origin: string): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required')
  }

  return new google.auth.OAuth2(clientId, clientSecret, libraryExportRedirectUri(origin))
}

export function libraryExportAuthUrl(origin: string, state: string): string {
  const client = createLibraryExportOAuthClient(origin)
  return client.generateAuthUrl({
    // Online-only: access tokens last ~1h (matches export cookie). Never persist refresh tokens.
    access_type: 'online',
    scope: ['openid', 'email', 'profile', LIBRARY_EXPORT_DRIVE_SCOPE, LIBRARY_EXPORT_FORMS_SCOPE],
    state,
    include_granted_scopes: true,
  })
}

type GoogleTokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

type GoogleUserInfoResponse = {
  email?: string
}

async function postGoogleToken(body: URLSearchParams): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Avoid gzip decompression issues with Next.js/undici in route handlers.
      'Accept-Encoding': 'identity',
    },
    body: body.toString(),
  })

  const data = (await response.json()) as GoogleTokenResponse
  if (!response.ok) {
    throw new Error(data.error_description ?? data.error ?? 'Google token exchange failed')
  }

  return data
}

export async function exchangeLibraryExportCode(
  origin: string,
  code: string,
): Promise<Omit<LibraryExportGoogleTokenPayload, 'dottUserId'>> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required')
  }

  const tokens = await postGoogleToken(
    new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: libraryExportRedirectUri(origin),
      grant_type: 'authorization_code',
    }),
  )

  if (!tokens.access_token) {
    throw new Error('Google OAuth did not return an access token')
  }

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Accept-Encoding': 'identity',
    },
  })

  const profile = (await profileResponse.json()) as GoogleUserInfoResponse

  return {
    accessToken: tokens.access_token,
    expiryDate: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
    email: profile.email ?? undefined,
  }
}
