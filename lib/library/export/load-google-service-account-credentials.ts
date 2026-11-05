import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export type GoogleServiceAccountCredentials = {
  client_email: string
  private_key: string
  token_uri?: string
}

function parseServiceAccountJson(raw: string, source: string): GoogleServiceAccountCredentials {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(`Invalid Google service account JSON from ${source}`)
  }

  const record = parsed as Partial<GoogleServiceAccountCredentials>
  if (!record.client_email || !record.private_key) {
    throw new Error(`Service account credentials from ${source} must include client_email and private_key`)
  }

  return {
    client_email: record.client_email,
    // Vercel env values often escape newlines as literal \n
    private_key: record.private_key.replaceAll(String.raw`\n`, '\n'),
    token_uri: record.token_uri,
  }
}

/**
 * Load Google service-account credentials for serverless + local.
 *
 * Prefer `GOOGLE_SERVICE_ACCOUNT_JSON` (full JSON string) on Vercel.
 * Falls back to `GOOGLE_APPLICATION_CREDENTIALS` as a file path, or
 * `./google-credentials.json` in the project root for local/CLI use.
 */
export function loadGoogleServiceAccountCredentials(): GoogleServiceAccountCredentials {
  const inlineJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()
  if (inlineJson) {
    return parseServiceAccountJson(inlineJson, 'GOOGLE_SERVICE_ACCOUNT_JSON')
  }

  const credentialsEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (credentialsEnv?.startsWith('{')) {
    return parseServiceAccountJson(credentialsEnv, 'GOOGLE_APPLICATION_CREDENTIALS')
  }

  const credentialsPath =
    credentialsEnv || path.join(process.cwd(), 'google-credentials.json')

  if (!existsSync(credentialsPath)) {
    throw new Error(
      `Google service account credentials not found at ${credentialsPath}. ` +
        'Set GOOGLE_SERVICE_ACCOUNT_JSON (recommended on Vercel) or GOOGLE_APPLICATION_CREDENTIALS.',
    )
  }

  return parseServiceAccountJson(readFileSync(credentialsPath, 'utf8'), credentialsPath)
}
