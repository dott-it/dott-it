import bcrypt from 'bcryptjs'

import { getTenantByEmail } from '@/app/api/auth/utils/tenant'
import { userPrisma } from '@/lib/user-prisma'
import { matchPreviewLogin } from './preview-login'

export const LOGIN_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SERVER_ERROR: 'SERVER_ERROR',
  SERVER_MISCONFIGURATION: 'SERVER_MISCONFIGURATION',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_EMAIL: 'INVALID_EMAIL',
  PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
} as const

type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[keyof typeof LOGIN_ERROR_CODES]

export type AuthenticatedLoginUser = {
  id: string
  email: string
  tenantId: string | null
  name: string | null
}

type LoginResult =
  | {
      success: true
      user: AuthenticatedLoginUser
    }
  | {
      success: false
      error: LoginErrorCode
      message: string
      code: string
      status: number
    }

function loginError(
  error: LoginErrorCode,
  message: string,
  code: string,
  status: number,
): LoginResult {
  return {
    success: false,
    error,
    message,
    code,
    status,
  }
}

async function authenticatePreviewCredentials(
  email: string,
  password: string,
): Promise<LoginResult | null> {
  const previewLogin = matchPreviewLogin({ email, password })
  if (!previewLogin) {
    return null
  }

  const tenant = await getTenantByEmail(previewLogin.email)
  if (!tenant) {
    return loginError(
      LOGIN_ERROR_CODES.SERVER_MISCONFIGURATION,
      'Preview login email domain is not assigned to a tenant',
      'PREVIEW_TENANT_NOT_FOUND',
      500,
    )
  }

  const existingUser = await userPrisma.user.findUnique({
    where: { email: previewLogin.email },
  })

  if (existingUser && !existingUser.active) {
    return loginError(
      LOGIN_ERROR_CODES.ACCOUNT_LOCKED,
      'This account is inactive. Please contact an administrator.',
      'ACCOUNT_INACTIVE',
      403,
    )
  }

  const user = existingUser
    ? await userPrisma.user.update({
        where: { email: previewLogin.email },
        data: {
          emailVerified: existingUser.emailVerified ?? new Date(),
          name: previewLogin.name,
          tenantId: tenant.id,
        },
      })
    : await userPrisma.user.create({
        data: {
          active: true,
          email: previewLogin.email,
          emailVerified: new Date(),
          name: previewLogin.name,
          tenantId: tenant.id,
        },
      })

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email!,
      tenantId: user.tenantId,
      name: user.name,
    },
  }
}

export async function authenticateCredentials(input: {
  email?: string
  password?: string
}): Promise<LoginResult> {
  const email = input.email?.toLowerCase().trim()
  const password = input.password

  if (!email || !password) {
    return loginError(
      LOGIN_ERROR_CODES.VALIDATION_ERROR,
      'Email and password are required',
      'MISSING_CREDENTIALS',
      400,
    )
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return loginError(
      LOGIN_ERROR_CODES.INVALID_EMAIL,
      'Please enter a valid email',
      'INVALID_EMAIL_FORMAT',
      400,
    )
  }

  if (password.length < 6) {
    return loginError(
      LOGIN_ERROR_CODES.PASSWORD_TOO_SHORT,
      'Password must be at least 6 characters long',
      'PASSWORD_TOO_SHORT',
      400,
    )
  }

  const previewResult = await authenticatePreviewCredentials(email, password)
  if (previewResult) {
    return previewResult
  }

  const user = await userPrisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return loginError(
      LOGIN_ERROR_CODES.INVALID_CREDENTIALS,
      'Incorrect email or password',
      'USER_NOT_FOUND',
      401,
    )
  }

  if (!user.active) {
    return loginError(
      LOGIN_ERROR_CODES.ACCOUNT_LOCKED,
      'This account is inactive. Please contact an administrator.',
      'ACCOUNT_INACTIVE',
      403,
    )
  }

  if (!user.passwordHash) {
    return loginError(
      LOGIN_ERROR_CODES.INVALID_CREDENTIALS,
      'This user does not have a password set. Please use social login.',
      'NO_PASSWORD_SET',
      401,
    )
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash)
  if (!isPasswordValid) {
    return loginError(
      LOGIN_ERROR_CODES.INVALID_CREDENTIALS,
      'Incorrect email or password',
      'INVALID_PASSWORD',
      401,
    )
  }

  if (user.emailVerified === null) {
    return loginError(
      LOGIN_ERROR_CODES.EMAIL_NOT_VERIFIED,
      'Please verify your email before logging in',
      'EMAIL_NOT_VERIFIED',
      401,
    )
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email!,
      tenantId: user.tenantId,
      name: user.name,
    },
  }
}
