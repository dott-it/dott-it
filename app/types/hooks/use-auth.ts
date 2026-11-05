import { User, AuthSession, LoginCredentials } from '../domain/auth'

/**
 * Auth Hook Return Type
 */
export interface UseAuthReturn {
  user: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

/**
 * Auth Hook Options
 */
export interface UseAuthOptions {
  redirectOnLogin?: string
  redirectOnLogout?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

