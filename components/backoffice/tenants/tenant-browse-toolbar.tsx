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
  emptyTenantBrowseFilters,
  hasActiveTenantBrowseFilters,
  type TenantBrowseFilters,
  type TenantBrowseViewMode,
} from '@/lib/tenant-browse'
import { Label } from '@/components/ui/label'

type TenantBrowseToolbarProps = {
  filters: TenantBrowseFilters
  onFiltersChange: (filters: TenantBrowseFilters) => void
  viewMode: TenantBrowseViewMode
  onViewModeChange: (mode: TenantBrowseViewMode) => void
  statusOptions: FormSelectOption[]
  domainOptions: FormSelectOption[]
  showStatusFilter: boolean
  showDomainFilter: boolean
  resultCount: number
  totalCount: number
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

export function TenantBrowseToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  statusOptions,
  domainOptions,
  showStatusFilter,
  showDomainFilter,
  resultCount,
  totalCount,
}: TenantBrowseToolbarProps) {
  const filtersActive = hasActiveTenantBrowseFilters(filters)
  const facetCount = Number(showStatusFilter) + Number(showDomainFilter)

  const updateFilter = <K extends keyof TenantBrowseFilters>(
    key: K,
    value: TenantBrowseFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="tenant-search" className="text-xs text-muted-foreground">
            Search
          </Label>
          <SearchInput
            id="tenant-search"
            placeholder="Search by name, slug, or domain..."
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </div>

        {facetCount > 0 && (
          <div
            className={
              facetCount > 1
                ? 'grid grid-cols-2 gap-3 sm:w-[min(100%,24rem)]'
                : 'grid w-full gap-3 sm:max-w-xs lg:w-80'
            }
          >
            {showStatusFilter && (
              <FilterSelect
                id="tenant-filter-status"
                label="Status"
                value={filters.status}
                options={statusOptions}
                placeholder="All statuses"
                onChange={(value) => updateFilter('status', value)}
              />
            )}
            {showDomainFilter && (
              <FilterSelect
                id="tenant-filter-domain"
                label="Domain"
                value={filters.domain}
                options={domainOptions}
                placeholder="All domains"
                onChange={(value) => updateFilter('domain', value)}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{resultCount}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> tenants
        </p>

        <div className="flex items-center gap-2">
          {filtersActive && (
            <Button.Ghost
              type="button"
              className="h-9 px-2"
              onClick={() => onFiltersChange(emptyTenantBrowseFilters)}
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
            aria-label="Tenant view mode"
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
