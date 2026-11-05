import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { UserWithTenant } from '../app/types/api/user.ts'
import {
  appliedUserBrowseFilters,
  collectUserBrowseOptions,
  emptyUserBrowseFilters,
  filterUsers,
  hasActiveUserBrowseFilters,
  NO_ROLE_VALUE,
  NO_TENANT_VALUE,
  sortUsersByName,
  userBrowseOptionsThatNarrow,
  userRoleLabel,
  userRoleMatches,
  userStatusMatches,
  userTenantMatches,
} from '../lib/user-browse.ts'

function user(
  partial: Partial<UserWithTenant> & Pick<UserWithTenant, 'id'>,
): UserWithTenant {
  return {
    name: 'User',
    email: 'user@example.com',
    role: 'admin',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    tenantId: 'tenant-1',
    tenant: { id: 'tenant-1', name: 'Alpha District', slug: 'alpha' },
    ...partial,
  }
}

describe('user browse', () => {
  const users = [
    user({ id: 'u1', name: 'Alice Admin', email: 'alice@alpha.edu', role: 'admin' }),
    user({
      id: 'u2',
      name: 'Bob Teacher',
      email: 'bob@beta.org',
      role: 'teacher',
      active: false,
      tenantId: 'tenant-2',
      tenant: { id: 'tenant-2', name: 'Beta Schools', slug: 'beta' },
    }),
    user({
      id: 'u3',
      name: null,
      email: 'noreply@example.com',
      role: null,
      tenantId: null,
      tenant: null,
    }),
  ]

  it('should filter by name search across name, email, and tenant', () => {
    assert.deepEqual(
      filterUsers(users, { ...emptyUserBrowseFilters, search: 'alice' }).map((item) => item.id),
      ['u1'],
    )
    assert.deepEqual(
      filterUsers(users, { ...emptyUserBrowseFilters, search: 'beta' }).map((item) => item.id),
      ['u2'],
    )
  })

  it('should filter by status, role, and tenant together', () => {
    const matches = filterUsers(users, {
      search: '',
      status: 'inactive',
      role: 'teacher',
      tenantId: 'tenant-2',
    })
    assert.deepEqual(
      matches.map((item) => item.id),
      ['u2'],
    )
  })

  it('should filter users without role or tenant', () => {
    assert.deepEqual(
      filterUsers(users, {
        ...emptyUserBrowseFilters,
        role: NO_ROLE_VALUE,
        tenantId: NO_TENANT_VALUE,
      }).map((item) => item.id),
      ['u3'],
    )
  })

  it('should treat "all" filter values as inactive', () => {
    const filters = { search: '', status: 'all', role: 'all', tenantId: 'all' }
    assert.equal(filterUsers(users, filters).length, 3)
    assert.equal(hasActiveUserBrowseFilters(filters), false)
  })

  it('should collect browse options from loaded users', () => {
    const options = collectUserBrowseOptions(users)
    assert.ok(options.roles.some((option) => option.value === 'admin'))
    assert.ok(options.roles.some((option) => option.value === NO_ROLE_VALUE))
    assert.ok(options.tenants.some((option) => option.value === 'tenant-1'))
    assert.ok(options.tenants.some((option) => option.value === NO_TENANT_VALUE))
  })

  it('should match a role filter ignoring case', () => {
    assert.deepEqual(
      filterUsers(users, { ...emptyUserBrowseFilters, role: 'Teacher' }).map((item) => item.id),
      ['u2'],
    )
    assert.equal(userRoleLabel('teacher'), 'Teacher')
    assert.equal(userRoleLabel('  '), 'No role')
  })

  it('should collapse roles that differ only by case', () => {
    const options = collectUserBrowseOptions([
      user({ id: 'a', role: 'admin' }),
      user({ id: 'b', role: 'Admin', email: 'b@example.com' }),
    ])
    assert.deepEqual(
      options.roles.map((option) => option.value),
      ['Admin'],
    )
    assert.deepEqual(
      options.roles.map((option) => option.label),
      ['Admin'],
    )
  })

  it('should omit facet options that match every user', () => {
    const source = [
      user({ id: 'a', role: 'teacher', active: true }),
      user({ id: 'b', role: 'teacher', email: 'b@example.com', active: true }),
    ]
    const options = collectUserBrowseOptions(source)
    assert.deepEqual(
      userBrowseOptionsThatNarrow(source, options.statuses, userStatusMatches),
      [],
    )
    assert.deepEqual(
      userBrowseOptionsThatNarrow(source, options.roles, userRoleMatches),
      [],
    )
    assert.deepEqual(
      userBrowseOptionsThatNarrow(source, options.tenants, userTenantMatches).map(
        (option) => option.value,
      ),
      [],
    )
  })

  it('should keep facet options that drop at least one user', () => {
    const options = collectUserBrowseOptions(users)
    assert.deepEqual(
      userBrowseOptionsThatNarrow(users, options.statuses, userStatusMatches).map(
        (option) => option.value,
      ),
      ['active', 'inactive'],
    )
    assert.ok(
      userBrowseOptionsThatNarrow(users, options.roles, userRoleMatches).some(
        (option) => option.value === NO_ROLE_VALUE,
      ),
    )
    assert.ok(
      userBrowseOptionsThatNarrow(users, options.tenants, userTenantMatches).some(
        (option) => option.value === NO_TENANT_VALUE,
      ),
    )
  })

  it('should drop facet values that are not currently offered', () => {
    const applied = appliedUserBrowseFilters(
      { search: 'alice', status: 'missing', role: 'principal', tenantId: 'gone' },
      { statuses: [], roles: [], tenants: [] },
    )
    assert.deepEqual(applied, {
      search: 'alice',
      status: '',
      role: '',
      tenantId: '',
    })
  })

  it('should rewrite a role filter to the option casing', () => {
    const applied = appliedUserBrowseFilters(
      { ...emptyUserBrowseFilters, role: 'teacher' },
      {
        statuses: [],
        roles: [{ value: 'Teacher', label: 'Teacher' }],
        tenants: [],
      },
    )
    assert.equal(applied.role, 'Teacher')
  })

  it('should sort users by display name then email', () => {
    const sorted = sortUsersByName([
      user({ id: 'c', name: 'Zoe', email: 'z@example.com' }),
      user({ id: 'a', name: 'Amy', email: 'b@example.com' }),
      user({ id: 'b', name: 'Amy', email: 'a@example.com' }),
      user({ id: 'n10', name: 'Student 10', email: 's10@example.com' }),
      user({ id: 'n2', name: 'Student 2', email: 's2@example.com' }),
    ])
    assert.deepEqual(
      sorted.map((item) => item.id),
      ['b', 'a', 'n2', 'n10', 'c'],
    )
  })
})
