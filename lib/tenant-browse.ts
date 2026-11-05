import type { Tenant } from '@/types'
import type { FormSelectOption } from '@/components/backoffice/common/form-field'
import { collapseCaseInsensitiveLabels } from '@/lib/browse-labels'

export type TenantBrowseViewMode = 'grid' | 'list'

export type TenantBrowseFilters = {
  search: string
  status: string
  domain: string
}

export const emptyTenantBrowseFilters: TenantBrowseFilters = {
  search: '',
  status: '',
  domain: '',
}

const ALL_VALUE = 'all'

export function normalizeBrowseFilterValue(value: string): string {
  const trimmed = value.trim()
  return !trimmed || trimmed === ALL_VALUE ? '' : trimmed
}

export function hasActiveTenantBrowseFilters(filters: TenantBrowseFilters): boolean {
  return (
    Boolean(filters.search.trim()) ||
    Boolean(normalizeBrowseFilterValue(filters.status)) ||
    Boolean(normalizeBrowseFilterValue(filters.domain))
  )
}

function normalizedDomains(tenant: Tenant): string[] {
  return tenant.domains.map((domain) => domain.trim().toLowerCase()).filter(Boolean)
}

/**
 * Client-side browse filters for backoffice tenants (name search + status/domain facets).
 * Search matches name, slug, or a single domain. It does not match text that only
 * appears by joining two domains together.
 */
export function filterTenants(tenants: Tenant[], filters: TenantBrowseFilters): Tenant[] {
  const search = filters.search.trim().toLowerCase()
  const status = normalizeBrowseFilterValue(filters.status).toLowerCase()
  const domain = normalizeBrowseFilterValue(filters.domain).toLowerCase()

  return tenants.filter((tenant) => {
    const domains = normalizedDomains(tenant)

    if (search) {
      const name = tenant.name.toLowerCase()
      const slug = tenant.slug.toLowerCase()
      const domainHit = domains.some((item) => item.includes(search))
      if (!name.includes(search) && !slug.includes(search) && !domainHit) {
        return false
      }
    }

    if (status && tenant.status.toLowerCase() !== status) {
      return false
    }

    if (domain && !domains.includes(domain)) {
      return false
    }

    return true
  })
}

/**
 * Default browse order: tenant name, then slug.
 */
export function sortTenantsByName(tenants: Tenant[]): Tenant[] {
  return [...tenants].sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name, undefined, { numeric: true })
    if (nameCompare !== 0) return nameCompare
    return a.slug.localeCompare(b.slug, undefined, { numeric: true })
  })
}

export function collectTenantBrowseOptions(tenants: Tenant[]): {
  statuses: FormSelectOption[]
  domains: FormSelectOption[]
} {
  const statuses = collapseCaseInsensitiveLabels(tenants.map((tenant) => tenant.status)).map(
    (value) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
    }),
  )

  const domains = collapseCaseInsensitiveLabels(tenants.flatMap((tenant) => tenant.domains)).map(
    (value) => ({ value, label: value }),
  )

  return { statuses, domains }
}

/**
 * Domain options that drop at least one tenant.
 * A domain every tenant already has stays out of the dropdown, because choosing it
 * would leave the list unchanged.
 */
export function tenantDomainOptionsThatNarrow(
  tenants: Tenant[],
  domainOptions: FormSelectOption[],
): FormSelectOption[] {
  if (tenants.length === 0) return []

  return domainOptions.filter((option) => {
    const domain = option.value.trim().toLowerCase()
    if (!domain) return false
    const matched = tenants.filter((tenant) => normalizedDomains(tenant).includes(domain)).length
    return matched > 0 && matched < tenants.length
  })
}

/**
 * A domain facet is useful only when at least one option narrows the list.
 */
export function tenantDomainFilterCanNarrow(
  tenants: Tenant[],
  domainOptions: FormSelectOption[],
): boolean {
  return tenantDomainOptionsThatNarrow(tenants, domainOptions).length > 0
}

function matchingOptionValue(value: string, options: FormSelectOption[]): string {
  const normalized = normalizeBrowseFilterValue(value).toLowerCase()
  if (!normalized) return ''
  return options.find((option) => option.value.trim().toLowerCase() === normalized)?.value ?? ''
}

/**
 * Keep search text, and keep a status or domain only when that facet is currently offered.
 * Stored values are rewritten to the option's canonical casing so the select stays in range.
 */
export function appliedTenantBrowseFilters(
  filters: TenantBrowseFilters,
  options: { statuses: FormSelectOption[]; domains: FormSelectOption[] },
): TenantBrowseFilters {
  return {
    search: filters.search,
    status: matchingOptionValue(filters.status, options.statuses),
    domain: matchingOptionValue(filters.domain, options.domains),
  }
}
