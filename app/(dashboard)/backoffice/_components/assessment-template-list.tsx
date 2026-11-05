'use client'

import { useMemo, useState, type JSX } from 'react'
import { ClipboardList } from 'lucide-react'
import { EmptyState } from '@/components/backoffice/common/empty-state'
import { LoadingState } from '@/components/backoffice/common/loading-state'
import { AssessmentTemplateBrowseToolbar } from '@/components/backoffice/assessment-templates/assessment-template-browse-toolbar'
import { AssessmentTemplateListRow } from '@/components/backoffice/assessment-templates/assessment-template-list-row'
import { assessmentTemplateQueries } from '@/app/lib/services/assessment-templates/assessment-template.queries'
import { AssessmentTemplateCard } from '@/app/lib/components/assessment/assessment-template-card'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  collectTemplateBrowseOptions,
  emptyTemplateBrowseFilters,
  filterAssessmentTemplates,
  hasActiveTemplateBrowseFilters,
  lessonOptionsForUnit,
  sortAssessmentTemplatesByUnit,
  type TemplateBrowseFilters,
  type TemplateBrowseViewMode,
} from '@/lib/assessment-template-browse'

export default function AssessmentTemplateListComponent(): JSX.Element {
  const {
    data: templates,
    isLoading: templatesLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = assessmentTemplateQueries.list.useQuery({
    // Global QueryClient sets refetchOnMount:false; always refresh when opening this tab.
    refetchOnMount: 'always',
  })

  const [filters, setFilters] = useState<TemplateBrowseFilters>(emptyTemplateBrowseFilters)
  const [viewMode, setViewMode] = useState<TemplateBrowseViewMode>('list')

  const browseOptions = useMemo(
    () => collectTemplateBrowseOptions(templates ?? []),
    [templates],
  )

  const lessonOptions = useMemo(
    () => lessonOptionsForUnit(templates ?? [], filters.unitCode),
    [templates, filters.unitCode],
  )

  const filteredTemplates = useMemo(
    () =>
      sortAssessmentTemplatesByUnit(filterAssessmentTemplates(templates ?? [], filters)),
    [templates, filters],
  )

  if (templatesLoading) return <LoadingState />

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
        <p className="font-medium text-foreground">Could not load templates</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : 'Failed to load assessment templates.'}
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

  const totalCount = templates?.length ?? 0
  const filtersActive = hasActiveTemplateBrowseFilters(filters)

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No templates found"
        description="You haven't created any assessment templates yet."
        actionLabel="Create your first template"
        actionHref="/backoffice/assessment-templates/create"
      />
    )
  }

  return (
    <div className="space-y-4">
      <AssessmentTemplateBrowseToolbar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        unitOptions={browseOptions.units}
        lessonOptions={lessonOptions}
        subjectOptions={browseOptions.subjects}
        typeOptions={browseOptions.types}
        resultCount={filteredTemplates.length}
        totalCount={totalCount}
      />

      {filteredTemplates.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No matching templates"
          description={
            filtersActive
              ? 'Try adjusting or clearing your filters to see more templates.'
              : 'No templates match the current search.'
          }
          actionLabel={filtersActive ? undefined : 'Create your first template'}
          actionHref={filtersActive ? undefined : '/backoffice/assessment-templates/create'}
        />
      )}

      {filteredTemplates.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <AssessmentTemplateCard
              key={template.id}
              template={template}
              basePath="/backoffice/assessment-templates"
            />
          ))}
        </div>
      )}

      {filteredTemplates.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <AssessmentTemplateListRow
              key={template.id}
              template={template}
              basePath="/backoffice/assessment-templates"
            />
          ))}
        </div>
      )}
    </div>
  )
}
