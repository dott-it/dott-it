import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

import {
  authenticateCredentials,
  LOGIN_ERROR_CODES,
} from '@/lib/credential-auth'

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({
        success: false,
        error: LOGIN_ERROR_CODES.VALIDATION_ERROR,
        message: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE'
      }, { status: 415 })
    }

    const credentials = await req.json() as { email?: string; password?: string }
    const loginResult = await authenticateCredentials(credentials)

    if (!loginResult.success) {
      return NextResponse.json({
        success: false,
        error: loginResult.error,
        message: loginResult.message,
        code: loginResult.code,
      }, { status: loginResult.status })
    }

    // Generate JWT
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      console.error('JWT signing secret (NEXTAUTH_SECRET) is not set')
      return NextResponse.json({
        success: false,
        error: LOGIN_ERROR_CODES.SERVER_MISCONFIGURATION,
        message: 'Server configuration error',
        code: 'MISSING_JWT_SECRET'
      }, { status: 500 })
    }

    const token = jwt.sign(
      { 
        sub: loginResult.user.id,
        email: loginResult.user.email,
        tenantId: loginResult.user.tenantId,
        iat: Math.floor(Date.now() / 1000)
      },
      secret,
      { expiresIn: '7d' }
    )

    // Success response
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: loginResult.user.id,
        email: loginResult.user.email,
        tenantId: loginResult.user.tenantId,
        name: loginResult.user.name
      }, 
      token 
    }, { status: 200 })

    // Set secure cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (err) {
    console.error('Login error:', err)
    
    // Detailed log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.error('Detailed error:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: LOGIN_ERROR_CODES.SERVER_ERROR,
      message: 'Internal server error. Please try again in a few minutes.',
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 })
  }
}
