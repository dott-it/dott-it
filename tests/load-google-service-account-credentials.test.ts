import assert from 'node:assert/strict'
import test from 'node:test'
import { loadGoogleServiceAccountCredentials } from '../lib/library/export/load-google-service-account-credentials'

const SAMPLE = {
  client_email: 'sa@example.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n',
  token_uri: 'https://oauth2.googleapis.com/token',
}

test('loadGoogleServiceAccountCredentials should read GOOGLE_SERVICE_ACCOUNT_JSON', () => {
  const previousJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const previousPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  try {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = JSON.stringify(SAMPLE)
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS

    const credentials = loadGoogleServiceAccountCredentials()
    assert.equal(credentials.client_email, SAMPLE.client_email)
    assert.match(credentials.private_key, /BEGIN PRIVATE KEY/)
    assert.ok(credentials.private_key.includes('\n'))
    assert.ok(!credentials.private_key.includes(String.raw`\n`))
  } finally {
    if (previousJson === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previousJson
    if (previousPath === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS
    else process.env.GOOGLE_APPLICATION_CREDENTIALS = previousPath
  }
})

test('loadGoogleServiceAccountCredentials should parse JSON stored in GOOGLE_APPLICATION_CREDENTIALS', () => {
  const previousJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const previousPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  try {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    process.env.GOOGLE_APPLICATION_CREDENTIALS = JSON.stringify(SAMPLE)

    const credentials = loadGoogleServiceAccountCredentials()
    assert.equal(credentials.client_email, SAMPLE.client_email)
  } finally {
    if (previousJson === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previousJson
    if (previousPath === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS
    else process.env.GOOGLE_APPLICATION_CREDENTIALS = previousPath
  }
})

test('loadGoogleServiceAccountCredentials should fail with a clear message when credentials are missing', () => {
  const previousJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const previousPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  try {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/definitely-missing-google-credentials.json'

    assert.throws(
      () => loadGoogleServiceAccountCredentials(),
      /GOOGLE_SERVICE_ACCOUNT_JSON|GOOGLE_APPLICATION_CREDENTIALS/,
    )
  } finally {
    if (previousJson === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previousJson
    if (previousPath === undefined) delete process.env.GOOGLE_APPLICATION_CREDENTIALS
    else process.env.GOOGLE_APPLICATION_CREDENTIALS = previousPath
  }
})
