/**
 * User API Types
 * Types related to user management API responses
 */

export interface UserWithTenant {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
  image?: string | null
  emailVerified?: Date | null
  tenantId?: string | null
  tenant?: {
    id: string
    name: string
    slug: string
  } | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UsersResponse {
  users: UserWithTenant[]
  total: number
}



