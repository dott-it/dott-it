import jwt from 'jsonwebtoken'
import { loadGoogleServiceAccountCredentials } from './load-google-service-account-credentials'

const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

type CachedToken = {
  accessToken: string
  expiresAtMs: number
}

let cachedToken: CachedToken | null = null

type GoogleTokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

/**
 * Access token for the OpenSciEd Drive service account (read materials for library download).
 * Uses JWT assertion + fetch with Accept-Encoding: identity to avoid Next.js/undici gzip issues.
 */
export async function getLibraryDriveServiceAccountAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAtMs > now + 60_000) {
    return cachedToken.accessToken
  }

  const credentials = loadGoogleServiceAccountCredentials()
  const issuedAt = Math.floor(now / 1000)
  const assertion = jwt.sign(
    {
      iss: credentials.client_email,
      scope: DRIVE_READONLY_SCOPE,
      aud: credentials.token_uri ?? TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    },
    credentials.private_key,
    { algorithm: 'RS256' },
  )

  const response = await fetch(credentials.token_uri ?? TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Avoid gzip decompression issues with Next.js/undici in route handlers.
      'Accept-Encoding': 'identity',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  })

  const data = (await response.json()) as GoogleTokenResponse
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description ?? data.error ?? 'Service account token exchange failed')
  }

  const expiresInSeconds = data.expires_in ?? 3600
  cachedToken = {
    accessToken: data.access_token,
    expiresAtMs: now + expiresInSeconds * 1000,
  }

  return cachedToken.accessToken
}
