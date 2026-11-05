'use client'

import { LayoutGrid, List, X } from 'lucide-react'
import { SearchInput } from '@/app/lib/components/ui/forms/search-input'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import type { FormSelectOption } from '@/components/backoffice/common/form-field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  emptyUserBrowseFilters,
  hasActiveUserBrowseFilters,
  type UserBrowseFilters,
  type UserBrowseViewMode,
} from '@/lib/user-browse'
import { Label } from '@/components/ui/label'

type UserBrowseToolbarProps = {
  filters: UserBrowseFilters
  onFiltersChange: (filters: UserBrowseFilters) => void
  viewMode: UserBrowseViewMode
  onViewModeChange: (mode: UserBrowseViewMode) => void
  statusOptions: FormSelectOption[]
  roleOptions: FormSelectOption[]
  tenantOptions: FormSelectOption[]
  showStatusFilter: boolean
  showRoleFilter: boolean
  showTenantFilter: boolean
  resultCount: number
  totalCount: number
}

function facetGridClassName(facetCount: number): string {
  if (facetCount > 2) {
    return 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[min(100%,36rem)]'
  }
  if (facetCount > 1) {
    return 'grid grid-cols-2 gap-3 sm:w-[min(100%,24rem)]'
  }
  return 'grid w-full gap-3 sm:max-w-xs lg:w-80'
}

function FilterSelect({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: FormSelectOption[]
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value || 'all'}
        onValueChange={(next) => onChange(next === 'all' ? '' : next)}
      >
        <SelectTrigger id={id} className="h-9 bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function UserBrowseToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  statusOptions,
  roleOptions,
  tenantOptions,
  showStatusFilter,
  showRoleFilter,
  showTenantFilter,
  resultCount,
  totalCount,
}: UserBrowseToolbarProps) {
  const filtersActive = hasActiveUserBrowseFilters(filters)
  const facetCount = Number(showStatusFilter) + Number(showRoleFilter) + Number(showTenantFilter)

  const updateFilter = <K extends keyof UserBrowseFilters>(
    key: K,
    value: UserBrowseFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="user-search" className="text-xs text-muted-foreground">
            Search
          </Label>
          <SearchInput
            id="user-search"
            placeholder="Search by name, email, or tenant..."
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </div>

        {facetCount > 0 && (
          <div className={facetGridClassName(facetCount)}>
            {showStatusFilter && (
              <FilterSelect
                id="user-filter-status"
                label="Status"
                value={filters.status}
                options={statusOptions}
                placeholder="All statuses"
                onChange={(value) => updateFilter('status', value)}
              />
            )}
            {showRoleFilter && (
              <FilterSelect
                id="user-filter-role"
                label="Role"
                value={filters.role}
                options={roleOptions}
                placeholder="All roles"
                onChange={(value) => updateFilter('role', value)}
              />
            )}
            {showTenantFilter && (
              <FilterSelect
                id="user-filter-tenant"
                label="Tenant"
                value={filters.tenantId}
                options={tenantOptions}
                placeholder="All tenants"
                onChange={(value) => updateFilter('tenantId', value)}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{resultCount}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> users
        </p>

        <div className="flex items-center gap-2">
          {filtersActive && (
            <Button.Ghost
              type="button"
              className="h-9 px-2"
              onClick={() => onFiltersChange(emptyUserBrowseFilters)}
            >
              <X className="mr-1 size-4" />
              Clear filters
            </Button.Ghost>
          )}

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'grid' || value === 'list') {
                onViewModeChange(value)
              }
            }}
            variant="outline"
            size="sm"
            aria-label="User view mode"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}
