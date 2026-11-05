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
  assessmentBrowseSchoolYearOptions,
  emptyAssessmentBrowseFilters,
  hasActiveAssessmentBrowseFilters,
  isAssessmentBrowseSchoolYear,
  type AssessmentBrowseFilters,
  type AssessmentBrowseSchoolYear,
  type AssessmentBrowseViewMode,
} from '@/lib/assessment-browse'
import { Label } from '@/components/ui/label'

type AssessmentBrowseToolbarProps = {
  filters: AssessmentBrowseFilters
  onFiltersChange: (filters: AssessmentBrowseFilters) => void
  viewMode: AssessmentBrowseViewMode
  onViewModeChange: (mode: AssessmentBrowseViewMode) => void
  unitOptions: FormSelectOption[]
  lessonOptions: FormSelectOption[]
  subjectOptions: FormSelectOption[]
  typeOptions: FormSelectOption[]
  schoolYear: AssessmentBrowseSchoolYear
  onSchoolYearChange: (schoolYear: AssessmentBrowseSchoolYear) => void
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

export function AssessmentBrowseToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  unitOptions,
  lessonOptions,
  subjectOptions,
  typeOptions,
  schoolYear,
  onSchoolYearChange,
  resultCount,
  totalCount,
}: AssessmentBrowseToolbarProps) {
  const filtersActive = hasActiveAssessmentBrowseFilters(filters)
  const schoolYearOptions = assessmentBrowseSchoolYearOptions()

  const updateFilter = <K extends keyof AssessmentBrowseFilters>(
    key: K,
    value: AssessmentBrowseFilters[K],
  ) => {
    const next = { ...filters, [key]: value }
    if (key === 'unitCode') {
      next.lessonNumber = ''
    }
    onFiltersChange(next)
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="assessment-search" className="text-xs text-muted-foreground">
            Search
          </Label>
          <SearchInput
            id="assessment-search"
            placeholder="Search by name, unit, description, subject, or tenant..."
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5 lg:w-[min(100%,56rem)]">
          <div className="space-y-1.5">
            <Label htmlFor="assessment-filter-school-year" className="text-xs text-muted-foreground">
              School year
            </Label>
            <Select
              value={schoolYear}
              onValueChange={(next) => {
                if (isAssessmentBrowseSchoolYear(next)) onSchoolYearChange(next)
              }}
            >
              <SelectTrigger id="assessment-filter-school-year" className="h-9 bg-background">
                <SelectValue placeholder="School year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <FilterSelect
            id="assessment-filter-unit"
            label="Unit"
            value={filters.unitCode}
            options={unitOptions}
            placeholder="All units"
            onChange={(value) => updateFilter('unitCode', value)}
          />
          <FilterSelect
            id="assessment-filter-lesson"
            label="Lesson"
            value={filters.lessonNumber}
            options={lessonOptions}
            placeholder="All lessons"
            onChange={(value) => updateFilter('lessonNumber', value)}
          />
          <FilterSelect
            id="assessment-filter-subject"
            label="Subject"
            value={filters.subject}
            options={subjectOptions}
            placeholder="All subjects"
            onChange={(value) => updateFilter('subject', value)}
          />
          <FilterSelect
            id="assessment-filter-type"
            label="Type"
            value={filters.type}
            options={typeOptions}
            placeholder="All types"
            onChange={(value) => updateFilter('type', value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{resultCount}</span> of{' '}
          <span className="font-medium text-foreground">{totalCount}</span> assessments
        </p>

        <div className="flex items-center gap-2">
          {filtersActive && (
            <Button.Ghost
              type="button"
              className="h-9 px-2"
              onClick={() => onFiltersChange(emptyAssessmentBrowseFilters)}
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
            aria-label="Assessment view mode"
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
