function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isPreviewLoginEnabled(env = process.env) {
  return (
    (env.VERCEL_ENV === 'preview' || env.NODE_ENV === 'development') &&
    Boolean(env.PREVIEW_LOGIN_EMAIL) &&
    Boolean(env.PREVIEW_LOGIN_PASSWORD)
  )
}

export function matchPreviewLogin(credentials, env = process.env) {
  if (!isPreviewLoginEnabled(env)) {
    return null
  }

  const configuredEmail = normalizeEmail(env.PREVIEW_LOGIN_EMAIL)
  const submittedEmail = normalizeEmail(credentials?.email)
  const submittedPassword = String(credentials?.password || '')

  if (
    submittedEmail !== configuredEmail ||
    submittedPassword !== env.PREVIEW_LOGIN_PASSWORD
  ) {
    return null
  }

  return {
    email: submittedEmail,
    name: env.PREVIEW_LOGIN_NAME || 'Preview User',
  }
}
