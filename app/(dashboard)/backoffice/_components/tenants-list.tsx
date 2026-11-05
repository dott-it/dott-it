'use client'

import { useMemo, useState, type JSX } from 'react'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/backoffice/common/empty-state'
import { LoadingState } from '@/components/backoffice/common/loading-state'
import { TenantBrowseToolbar } from '@/components/backoffice/tenants/tenant-browse-toolbar'
import { TenantListRow } from '@/components/backoffice/tenants/tenant-list-row'
import { TenantCard } from '@/components/backoffice/tenants/tenant-card'
import { tenantQueries } from '@/app/lib/services/tenants/tenant.queries'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  appliedTenantBrowseFilters,
  collectTenantBrowseOptions,
  emptyTenantBrowseFilters,
  filterTenants,
  sortTenantsByName,
  tenantDomainOptionsThatNarrow,
  type TenantBrowseFilters,
  type TenantBrowseViewMode,
} from '@/lib/tenant-browse'
import type { FormSelectOption } from '@/components/backoffice/common/form-field'

const NO_FACET_OPTIONS: FormSelectOption[] = []

export default function TenantsListComponent(): JSX.Element {
  const {
    data: tenants,
    isLoading: tenantsLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = tenantQueries.list.useQuery({
    // Global QueryClient sets refetchOnMount:false; always refresh when opening this tab.
    refetchOnMount: 'always',
  })

  const [filters, setFilters] = useState<TenantBrowseFilters>(emptyTenantBrowseFilters)
  const [viewMode, setViewMode] = useState<TenantBrowseViewMode>('list')

  const browseOptions = useMemo(() => collectTenantBrowseOptions(tenants ?? []), [tenants])
  const showStatusFilter = browseOptions.statuses.length > 1
  const statusOptions = showStatusFilter ? browseOptions.statuses : NO_FACET_OPTIONS
  const domainOptions = useMemo(
    () => tenantDomainOptionsThatNarrow(tenants ?? [], browseOptions.domains),
    [tenants, browseOptions.domains],
  )
  const showDomainFilter = domainOptions.length > 0
  const appliedFilters = useMemo(
    () => appliedTenantBrowseFilters(filters, { statuses: statusOptions, domains: domainOptions }),
    [filters, statusOptions, domainOptions],
  )

  const filteredTenants = useMemo(
    () => sortTenantsByName(filterTenants(tenants ?? [], appliedFilters)),
    [tenants, appliedFilters],
  )

  // Drop a status or domain that is no longer offered so it cannot reapply when the option returns.
  if (appliedFilters.status !== filters.status || appliedFilters.domain !== filters.domain) {
    setFilters({
      ...filters,
      status: appliedFilters.status,
      domain: appliedFilters.domain,
    })
  }

  if (tenantsLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
        <p className="font-medium text-foreground">Could not load tenants</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'There was an error loading tenants.'}
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

  const totalCount = tenants?.length ?? 0

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No tenants found"
        description="No tenants are available in the system."
        actionLabel="Create your first tenant"
        actionHref="/backoffice/tenants/create"
      />
    )
  }

  return (
    <div className="space-y-4">
      <TenantBrowseToolbar
        filters={appliedFilters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statusOptions={statusOptions}
        domainOptions={domainOptions}
        showStatusFilter={showStatusFilter}
        showDomainFilter={showDomainFilter}
        resultCount={filteredTenants.length}
        totalCount={totalCount}
      />

      {filteredTenants.length === 0 && (
        <EmptyState
          icon={Users}
          title="No matching tenants"
          description="Try adjusting or clearing your filters to see more tenants."
        />
      )}

      {filteredTenants.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTenants.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} showStatus={showStatusFilter} />
          ))}
        </div>
      )}

      {filteredTenants.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {filteredTenants.map((tenant) => (
            <TenantListRow key={tenant.id} tenant={tenant} showStatus={showStatusFilter} />
          ))}
        </div>
      )}
    </div>
  )
}
