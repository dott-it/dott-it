/**
 * Tenant Types
 * Types related to tenant management and data structures
 */

export interface Tenant {
  id: string
  name: string
  slug: string
  domains: string[]
  logo?: string
  userCount: number
  adminCount: number
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
}

export interface TenantUser {
  id: string
  name?: string
  email?: string
  role?: string
}

export interface TenantWithUsers extends Tenant {
  users: TenantUser[]
}

export interface CreateTenantRequest {
  name: string
  slug: string
  domains: string[]
  logo?: string
}

export interface UpdateTenantRequest {
  name?: string
  slug?: string
  domains?: string[]
  logo?: string
  status?: 'active' | 'inactive' | 'suspended'
}


