/**
 * Auth Domain Types
 * Core authentication and user types
 */

import { ApiError } from "next/dist/server/api-utils"

export interface User {
  id: string
  email: string
  name?: string
  tenantId?: string | null
  role?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: Date
  isAuthenticated: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  tenantId?: string | null
}

export interface LoginSuccessResponse {
  success: true
  user: AuthUser
  token: string
}

export interface LoginParams {
  email: string
  password: string
}

export type LoginResponse = LoginSuccessResponse | ApiError

