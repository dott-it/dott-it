import jwt from 'jsonwebtoken'
import { FORMS_WORKSPACE_USER } from '@/lib/library/digitize/curriculum-example-notice'
import { loadGoogleServiceAccountCredentials } from './load-google-service-account-credentials'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'

const FORMS_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive',
]

type CachedToken = {
  accessToken: string
  expiresAtMs: number
}

type GoogleTokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

const tokenCache = new Map<string, CachedToken>()

function cacheKey(subject: string, scopes: string[]): string {
  return `${subject}::${[...scopes].sort().join(' ')}`
}

export function isTransientGoogleTokenFetchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : ''
  return (
    /incorrect header check/i.test(message) ||
    /premature close/i.test(message) ||
    /ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(message) ||
    code === 'Z_DATA_ERROR' ||
    code === 'ERR_STREAM_PREMATURE_CLOSE'
  )
}

/**
 * Domain-wide-delegation access token via JWT assertion + raw fetch.
 * Avoids googleapis/gaxios + undici gzip bugs ("incorrect header check") in Next.js.
 */
export async function getImpersonatedGoogleAccessToken(args: {
  subject: string
  scopes: string[]
}): Promise<string> {
  const subject = args.subject.trim()
  if (!subject) {
    throw new Error('Impersonation subject (Workspace user email) is required')
  }
  const scopes = args.scopes.map((scope) => scope.trim()).filter(Boolean)
  if (scopes.length === 0) {
    throw new Error('At least one OAuth scope is required')
  }

  const key = cacheKey(subject, scopes)
  const now = Date.now()
  const cached = tokenCache.get(key)
  if (cached && cached.expiresAtMs > now + 60_000) {
    return cached.accessToken
  }

  const credentials = loadGoogleServiceAccountCredentials()
  const tokenUri = credentials.token_uri ?? TOKEN_URL
  const issuedAt = Math.floor(now / 1000)
  const assertion = jwt.sign(
    {
      iss: credentials.client_email,
      sub: subject,
      scope: scopes.join(' '),
      aud: tokenUri,
      iat: issuedAt,
      exp: issuedAt + 3600,
    },
    credentials.private_key,
    { algorithm: 'RS256' },
  )

  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(tokenUri, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Next.js/undici often fails gzip decompression on this endpoint.
          'Accept-Encoding': 'identity',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion,
        }).toString(),
      })

      const data = (await response.json()) as GoogleTokenResponse
      if (!response.ok || !data.access_token) {
        throw new Error(
          data.error_description ?? data.error ?? `Token exchange failed (${response.status})`,
        )
      }

      const expiresInSeconds = data.expires_in ?? 3600
      tokenCache.set(key, {
        accessToken: data.access_token,
        expiresAtMs: now + expiresInSeconds * 1000,
      })
      return data.access_token
    } catch (error) {
      lastError = error
      if (!isTransientGoogleTokenFetchError(error) || attempt === 3) {
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Token exchange failed: ${String(lastError)}`)
}

/** forms@ (or GOOGLE_FORMS_IMPERSONATE_USER) token for Forms + Drive export convert path. */
export async function getFormsWorkspaceAccessToken(): Promise<string> {
  return getImpersonatedGoogleAccessToken({
    subject: FORMS_WORKSPACE_USER,
    scopes: FORMS_WORKSPACE_SCOPES,
  })
}
