import type { UserWithTenant } from '@/types'
import type { FormSelectOption } from '@/components/backoffice/common/form-field'
import { collapseCaseInsensitiveLabels } from '@/lib/browse-labels'

export type UserBrowseViewMode = 'grid' | 'list'

export type UserBrowseFilters = {
  search: string
  status: string
  role: string
  tenantId: string
}

export const emptyUserBrowseFilters: UserBrowseFilters = {
  search: '',
  status: '',
  role: '',
  tenantId: '',
}

const ALL_VALUE = 'all'
const NO_ROLE_VALUE = '__none__'
const NO_TENANT_VALUE = '__none__'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Teacher',
  student: 'Student',
}

export function normalizeBrowseFilterValue(value: string): string {
  const trimmed = value.trim()
  return !trimmed || trimmed === ALL_VALUE ? '' : trimmed
}

export function hasActiveUserBrowseFilters(filters: UserBrowseFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    Boolean(normalizeBrowseFilterValue(filters.status)) ||
    Boolean(normalizeBrowseFilterValue(filters.role)) ||
    Boolean(normalizeBrowseFilterValue(filters.tenantId))
  )
}

function userDisplayName(user: UserWithTenant): string {
  return (user.name || user.email || 'Unnamed User').trim()
}

function normalizedRole(user: UserWithTenant): string {
  return (user.role ?? '').trim().toLowerCase()
}

function userTenantId(user: UserWithTenant): string {
  return user.tenantId || user.tenant?.id || ''
}

/** Display label for a stored role, including the empty-role case. */
export function userRoleLabel(role: string | null | undefined): string {
  const trimmed = (role ?? '').trim()
  if (!trimmed) return 'No role'
  return ROLE_LABELS[trimmed.toLowerCase()] ?? trimmed
}

/**
 * Client-side browse filters for backoffice users (name search + status/role/tenant facets).
 * Role matching ignores case. Search matches name, email, or tenant name.
 */
export function filterUsers(
  users: UserWithTenant[],
  filters: UserBrowseFilters,
): UserWithTenant[] {
  const search = filters.search.trim().toLowerCase()
  const status = normalizeBrowseFilterValue(filters.status).toLowerCase()
  const role = normalizeBrowseFilterValue(filters.role)
  const tenantId = normalizeBrowseFilterValue(filters.tenantId)

  return users.filter((user) => {
    if (search) {
      const name = (user.name ?? '').toLowerCase()
      const email = (user.email ?? '').toLowerCase()
      const tenantName = (user.tenant?.name ?? '').toLowerCase()
      if (!name.includes(search) && !email.includes(search) && !tenantName.includes(search)) {
        return false
      }
    }

    if (status === 'active' && !user.active) {
      return false
    }
    if (status === 'inactive' && user.active) {
      return false
    }

    if (role === NO_ROLE_VALUE) {
      if (normalizedRole(user)) {
        return false
      }
    } else if (role && normalizedRole(user) !== role.toLowerCase()) {
      return false
    }

    if (tenantId === NO_TENANT_VALUE) {
      if (userTenantId(user)) {
        return false
      }
    } else if (tenantId && userTenantId(user) !== tenantId) {
      return false
    }

    return true
  })
}

/**
 * Default browse order: display name, then email.
 */
export function sortUsersByName(users: UserWithTenant[]): UserWithTenant[] {
  return [...users].sort((a, b) => {
    const nameCompare = userDisplayName(a).localeCompare(userDisplayName(b), undefined, {
      numeric: true,
    })
    if (nameCompare !== 0) return nameCompare
    return (a.email ?? '').localeCompare(b.email ?? '', undefined, { numeric: true })
  })
}

export function collectUserBrowseOptions(users: UserWithTenant[]): {
  statuses: FormSelectOption[]
  roles: FormSelectOption[]
  tenants: FormSelectOption[]
} {
  const statuses: FormSelectOption[] = []
  if (users.some((user) => user.active)) {
    statuses.push({ value: 'active', label: 'Active' })
  }
  if (users.some((user) => !user.active)) {
    statuses.push({ value: 'inactive', label: 'Inactive' })
  }

  const roles = collapseCaseInsensitiveLabels(users.map((user) => user.role ?? '')).map(
    (value) => ({
      value,
      label: userRoleLabel(value),
    }),
  )

  const hasUsersWithoutRole = users.some((user) => !normalizedRole(user))
  if (hasUsersWithoutRole) {
    roles.unshift({ value: NO_ROLE_VALUE, label: 'No role' })
  }

  const tenantEntries = new Map<string, string>()
  for (const user of users) {
    const id = userTenantId(user)
    const name = user.tenant?.name?.trim()
    if (id && name) {
      tenantEntries.set(id, name)
    } else if (id) {
      tenantEntries.set(id, id)
    }
  }

  const tenants = [...tenantEntries.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }))
    .map(([value, label]) => ({ value, label }))

  const hasUsersWithoutTenant = users.some((user) => !userTenantId(user))
  if (hasUsersWithoutTenant) {
    tenants.unshift({ value: NO_TENANT_VALUE, label: 'No tenant' })
  }

  return { statuses, roles, tenants }
}

/**
 * Facet options that drop at least one user.
 * A value every user already has stays out of the dropdown, because choosing it
 * would leave the list unchanged.
 */
export function userBrowseOptionsThatNarrow(
  users: UserWithTenant[],
  options: FormSelectOption[],
  matches: (user: UserWithTenant, value: string) => boolean,
): FormSelectOption[] {
  if (users.length === 0) return []

  return options.filter((option) => {
    const value = option.value.trim()
    if (!value) return false
    const matched = users.filter((user) => matches(user, value)).length
    return matched > 0 && matched < users.length
  })
}

export function userStatusMatches(user: UserWithTenant, value: string): boolean {
  if (value === 'active') return user.active
  if (value === 'inactive') return !user.active
  return false
}

export function userRoleMatches(user: UserWithTenant, value: string): boolean {
  if (value === NO_ROLE_VALUE) return !normalizedRole(user)
  return normalizedRole(user) === value.trim().toLowerCase()
}

export function userTenantMatches(user: UserWithTenant, value: string): boolean {
  if (value === NO_TENANT_VALUE) return !userTenantId(user)
  return userTenantId(user) === value
}

function matchingOptionValue(
  value: string,
  options: FormSelectOption[],
  caseInsensitive: boolean,
): string {
  const normalized = normalizeBrowseFilterValue(value)
  if (!normalized) return ''
  const key = caseInsensitive ? normalized.toLowerCase() : normalized
  return (
    options.find((option) => {
      const optionKey = caseInsensitive ? option.value.trim().toLowerCase() : option.value
      return optionKey === key
    })?.value ?? ''
  )
}

/**
 * Keep search text, and keep a facet only when that facet is currently offered.
 * Role and status values are rewritten to the option's canonical casing so the select stays in range.
 */
export function appliedUserBrowseFilters(
  filters: UserBrowseFilters,
  options: {
    statuses: FormSelectOption[]
    roles: FormSelectOption[]
    tenants: FormSelectOption[]
  },
): UserBrowseFilters {
  return {
    search: filters.search,
    status: matchingOptionValue(filters.status, options.statuses, true),
    role: matchingOptionValue(filters.role, options.roles, true),
    tenantId: matchingOptionValue(filters.tenantId, options.tenants, false),
  }
}

export { NO_ROLE_VALUE, NO_TENANT_VALUE }
