'use client'

import { useMemo, useState, type JSX } from 'react'
import { UserCircle } from 'lucide-react'
import { EmptyState } from '@/components/backoffice/common/empty-state'
import { LoadingState } from '@/components/backoffice/common/loading-state'
import { UserBrowseToolbar } from '@/components/backoffice/users/user-browse-toolbar'
import { UserListRow } from '@/components/backoffice/users/user-list-row'
import { UserCard } from '@/components/backoffice/users/user-card'
import { userQueries } from '@/app/lib/services/users/user.queries'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  appliedUserBrowseFilters,
  collectUserBrowseOptions,
  emptyUserBrowseFilters,
  filterUsers,
  sortUsersByName,
  userBrowseOptionsThatNarrow,
  userRoleMatches,
  userStatusMatches,
  userTenantMatches,
  type UserBrowseFilters,
  type UserBrowseViewMode,
} from '@/lib/user-browse'

export default function UsersListComponent(): JSX.Element {
  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = userQueries.list.useQuery({
    refetchOnMount: 'always',
  })

  const users = useMemo(() => usersResponse?.users ?? [], [usersResponse?.users])

  const [filters, setFilters] = useState<UserBrowseFilters>(emptyUserBrowseFilters)
  const [viewMode, setViewMode] = useState<UserBrowseViewMode>('list')

  const browseOptions = useMemo(() => collectUserBrowseOptions(users), [users])
  const statusOptions = useMemo(
    () => userBrowseOptionsThatNarrow(users, browseOptions.statuses, userStatusMatches),
    [users, browseOptions.statuses],
  )
  const roleOptions = useMemo(
    () => userBrowseOptionsThatNarrow(users, browseOptions.roles, userRoleMatches),
    [users, browseOptions.roles],
  )
  const tenantOptions = useMemo(
    () => userBrowseOptionsThatNarrow(users, browseOptions.tenants, userTenantMatches),
    [users, browseOptions.tenants],
  )
  const showStatusFilter = statusOptions.length > 0
  const showRoleFilter = roleOptions.length > 0
  const showTenantFilter = tenantOptions.length > 0
  const offeredOptions = useMemo(
    () => ({ statuses: statusOptions, roles: roleOptions, tenants: tenantOptions }),
    [statusOptions, roleOptions, tenantOptions],
  )
  const appliedFilters = useMemo(
    () => appliedUserBrowseFilters(filters, offeredOptions),
    [filters, offeredOptions],
  )

  const filteredUsers = useMemo(
    () => sortUsersByName(filterUsers(users, appliedFilters)),
    [users, appliedFilters],
  )

  // Drop a facet that is no longer offered so it cannot reapply when the option returns.
  if (
    appliedFilters.status !== filters.status ||
    appliedFilters.role !== filters.role ||
    appliedFilters.tenantId !== filters.tenantId
  ) {
    setFilters(appliedFilters)
  }

  if (isLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
        <p className="font-medium text-foreground">Could not load users</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'There was an error loading users.'}
        </p>
        <Button.Outline
          type="button"
          className="mt-4"
          disabled={isFetching}
          onClick={() => {
            void refetch()
          }}
        >
          {isFetching ? 'Retrying...' : 'Try again'}
        </Button.Outline>
      </div>
    )
  }

  const totalCount = users.length

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={UserCircle}
        title="No users found"
        description="No users are available in the system."
      />
    )
  }

  return (
    <div className="space-y-4">
      <UserBrowseToolbar
        filters={appliedFilters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusOptions={statusOptions}
        roleOptions={roleOptions}
        tenantOptions={tenantOptions}
        showStatusFilter={showStatusFilter}
        showRoleFilter={showRoleFilter}
        showTenantFilter={showTenantFilter}
        resultCount={filteredUsers.length}
        totalCount={totalCount}
      />

      {filteredUsers.length === 0 && (
        <EmptyState
          icon={UserCircle}
          title="No matching users"
          description="Try adjusting or clearing your filters to see more users."
        />
      )}

      {filteredUsers.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} showStatus={showStatusFilter} />
          ))}
        </div>
      )}

      {filteredUsers.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <UserListRow key={user.id} user={user} showStatus={showStatusFilter} />
          ))}
        </div>
      )}
    </div>
  )
}
