/**
 * User Types
 */
export interface User {
  id: string
  name: string
  email: string
  role: 'teacher' | 'admin' | 'student'
  avatar?: string
}

/**
 * Authentication Types
 */
export interface AuthSession {
  user: User
  token: string
  expiresAt: string
}
