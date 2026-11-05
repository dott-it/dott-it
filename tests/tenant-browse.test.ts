import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Tenant } from '../app/types/api/tenant.ts'
import {
  appliedTenantBrowseFilters,
  collectTenantBrowseOptions,
  emptyTenantBrowseFilters,
  filterTenants,
  hasActiveTenantBrowseFilters,
  sortTenantsByName,
  tenantDomainFilterCanNarrow,
  tenantDomainOptionsThatNarrow,
} from '../lib/tenant-browse.ts'

function tenant(partial: Partial<Tenant> & Pick<Tenant, 'id' | 'name' | 'slug'>): Tenant {
  return {
    domains: ['example.com'],
    userCount: 1,
    adminCount: 1,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('tenant browse', () => {
  const tenants = [
    tenant({
      id: 't1',
      name: 'Alpha District',
      slug: 'alpha',
      domains: ['alpha.edu'],
      status: 'active',
    }),
    tenant({
      id: 't2',
      name: 'Beta Schools',
      slug: 'beta',
      domains: ['beta.org', 'shared.edu'],
      status: 'inactive',
    }),
    tenant({
      id: 't3',
      name: 'Gamma Learning',
      slug: 'gamma',
      domains: ['shared.edu'],
      status: 'active',
    }),
  ]

  it('should filter by name search across name, slug, and domains', () => {
    assert.deepEqual(
      filterTenants(tenants, { ...emptyTenantBrowseFilters, search: 'beta' }).map((item) => item.id),
      ['t2'],
    )
    assert.deepEqual(
      filterTenants(tenants, { ...emptyTenantBrowseFilters, search: 'shared.edu' }).map(
        (item) => item.id,
      ),
      ['t2', 't3'],
    )
    assert.deepEqual(
      filterTenants(
        [tenant({ id: 'slug-only', name: 'North High', slug: 'district-9', domains: [] })],
        { ...emptyTenantBrowseFilters, search: 'district-9' },
      ).map((item) => item.id),
      ['slug-only'],
    )
  })

  it('should not match a search that only spans two domains', () => {
    const matches = filterTenants(
      [tenant({ id: 'span', name: 'Span', slug: 'span', domains: ['alpha.edu', 'beta.org'] })],
      { ...emptyTenantBrowseFilters, search: 'edu beta' },
    )
    assert.deepEqual(
      matches.map((item) => item.id),
      [],
    )
  })

  it('should match a domain filter ignoring case and surrounding whitespace', () => {
    const source = [
      tenant({ id: 'd1', name: 'Delta', slug: 'delta', domains: ['  Example.EDU '] }),
      tenant({ id: 'd2', name: 'Echo', slug: 'echo', domains: ['example.edu'] }),
    ]
    const options = collectTenantBrowseOptions(source)
    assert.deepEqual(
      options.domains.map((option) => option.value),
      ['Example.EDU'],
    )
    assert.deepEqual(
      filterTenants(source, { ...emptyTenantBrowseFilters, domain: 'Example.EDU' }).map(
        (item) => item.id,
      ),
      ['d1', 'd2'],
    )
  })

  it('should filter by status and domain together', () => {
    const matches = filterTenants(tenants, {
      search: '',
      status: 'active',
      domain: 'shared.edu',
    })
    assert.deepEqual(
      matches.map((item) => item.id),
      ['t3'],
    )
  })

  it('should treat "all" filter values as inactive', () => {
    const filters = { search: '', status: 'all', domain: 'all' }
    assert.equal(filterTenants(tenants, filters).length, 3)
    assert.equal(hasActiveTenantBrowseFilters(filters), false)
  })

  it('should collect browse options from loaded tenants', () => {
    const options = collectTenantBrowseOptions(tenants)
    assert.deepEqual(
      options.statuses.map((option) => option.value),
      ['active', 'inactive'],
    )
    assert.deepEqual(
      options.domains.map((option) => option.value),
      ['alpha.edu', 'beta.org', 'shared.edu'],
    )
  })

  it('should collapse statuses that differ only by case', () => {
    const options = collectTenantBrowseOptions([
      tenant({ id: 'a', name: 'A', slug: 'a', status: 'active' }),
      tenant({ id: 'b', name: 'B', slug: 'b', status: 'Active' }),
    ])
    assert.deepEqual(
      options.statuses.map((option) => option.value),
      ['Active'],
    )
  })

  it('should match a status filter ignoring case', () => {
    const source = [
      tenant({ id: 'a', name: 'A', slug: 'a', status: 'active' }),
      tenant({ id: 'b', name: 'B', slug: 'b', status: 'Active' }),
      tenant({ id: 'c', name: 'C', slug: 'c', status: 'inactive' }),
    ]
    const status = collectTenantBrowseOptions(source).statuses.find(
      (option) => option.value.toLowerCase() === 'active',
    )
    assert.ok(status)
    assert.deepEqual(
      filterTenants(source, { ...emptyTenantBrowseFilters, status: status.value }).map(
        (item) => item.id,
      ),
      ['a', 'b'],
    )
  })

  it('should omit domain options that match every tenant', () => {
    const source = [
      tenant({ id: 'a', name: 'A', slug: 'a', domains: ['shared.edu', 'alpha.edu'] }),
      tenant({ id: 'b', name: 'B', slug: 'b', domains: ['shared.edu', 'beta.edu'] }),
    ]
    const options = collectTenantBrowseOptions(source)
    assert.deepEqual(
      tenantDomainOptionsThatNarrow(source, options.domains).map((option) => option.value),
      ['alpha.edu', 'beta.edu'],
    )
  })

  it('should drop facet values that are not currently offered', () => {
    const source = [
      tenant({ id: 'a', name: 'A', slug: 'a', domains: ['alpha.edu'], status: 'active' }),
      tenant({ id: 'b', name: 'B', slug: 'b', domains: ['beta.edu'], status: 'inactive' }),
    ]
    const options = collectTenantBrowseOptions(source)
    const applied = appliedTenantBrowseFilters(
      { search: 'north', status: 'missing', domain: 'shared.edu' },
      {
        statuses: options.statuses,
        domains: tenantDomainOptionsThatNarrow(source, options.domains),
      },
    )
    assert.deepEqual(applied, { search: 'north', status: '', domain: '' })
  })

  it('should rewrite a facet value to the option casing', () => {
    const applied = appliedTenantBrowseFilters(
      { search: '', status: 'active', domain: 'example.edu' },
      {
        statuses: [{ value: 'Active', label: 'Active' }],
        domains: [{ value: 'Example.EDU', label: 'Example.EDU' }],
      },
    )
    assert.deepEqual(applied, { search: '', status: 'Active', domain: 'Example.EDU' })
  })

  it('should show the domain filter only when an option narrows the list', () => {
    const shared = [
      tenant({ id: 'a', name: 'A', slug: 'a', domains: ['school.edu', 'mail.edu'] }),
      tenant({ id: 'b', name: 'B', slug: 'b', domains: ['school.edu', 'mail.edu'] }),
    ]
    const sharedOptions = collectTenantBrowseOptions(shared)
    assert.equal(tenantDomainFilterCanNarrow(shared, sharedOptions.domains), false)

    const split = [
      tenant({ id: 'a', name: 'A', slug: 'a', domains: ['school.edu'] }),
      tenant({ id: 'b', name: 'B', slug: 'b', domains: [] }),
    ]
    const splitOptions = collectTenantBrowseOptions(split)
    assert.equal(tenantDomainFilterCanNarrow(split, splitOptions.domains), true)
  })

  it('should sort tenants by name then slug', () => {
    const sorted = sortTenantsByName([
      tenant({ id: 'c', name: 'Zebra', slug: 'z' }),
      tenant({ id: 'a', name: 'Alpha', slug: 'b' }),
      tenant({ id: 'b', name: 'Alpha', slug: 'a' }),
      tenant({ id: 'n10', name: 'District 10', slug: 'd10' }),
      tenant({ id: 'n2', name: 'District 2', slug: 'd2' }),
    ])
    assert.deepEqual(
      sorted.map((item) => item.id),
      ['b', 'a', 'n2', 'n10', 'c'],
    )
  })
})
