'use client'

import { useMemo, useState, type JSX } from 'react'
import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/backoffice/common/empty-state'
import { LoadingState } from '@/components/backoffice/common/loading-state'
import { AssessmentBrowseToolbar } from '@/components/backoffice/assessments/assessment-browse-toolbar'
import { AssessmentListRow } from '@/components/backoffice/assessments/assessment-list-row'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'
import { AssessmentBackofficeCard } from '@/app/lib/components/assessment'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  assessmentListSchoolYearParam,
  collectAssessmentBrowseOptions,
  defaultAssessmentBrowseSchoolYear,
  emptyAssessmentBrowseFilters,
  filterAssessments,
  lessonOptionsForAssessmentUnit,
  sortAssessmentsByUnit,
  type AssessmentBrowseFilters,
  type AssessmentBrowseSchoolYear,
  type AssessmentBrowseViewMode,
} from '@/lib/assessment-browse'

export default function AssessmentListComponent(): JSX.Element {
  const [schoolYear, setSchoolYear] = useState<AssessmentBrowseSchoolYear>(
    defaultAssessmentBrowseSchoolYear,
  )
  const [filters, setFilters] = useState<AssessmentBrowseFilters>(emptyAssessmentBrowseFilters)
  const [viewMode, setViewMode] = useState<AssessmentBrowseViewMode>('list')

  const {
    data: assessments,
    isLoading: assessmentsLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = assessmentQueries.getAssessments.useQuery({
    variables: assessmentListSchoolYearParam(schoolYear),
    // Global QueryClient sets refetchOnMount:false; always refresh when opening this tab.
    refetchOnMount: 'always',
  })

  const browseOptions = useMemo(
    () => collectAssessmentBrowseOptions(assessments ?? []),
    [assessments],
  )

  const lessonOptions = useMemo(
    () => lessonOptionsForAssessmentUnit(assessments ?? [], filters.unitCode),
    [assessments, filters.unitCode],
  )

  const filteredAssessments = useMemo(
    () => sortAssessmentsByUnit(filterAssessments(assessments ?? [], filters)),
    [assessments, filters],
  )

  const totalCount = assessments?.length ?? 0
  const catalogIsEmpty = !assessmentsLoading && !isError && totalCount === 0 && schoolYear === 'all'

  if (catalogIsEmpty) {
    return (
      <EmptyState
        icon={FileText}
        title="No assessments found"
        description="You haven't created any assessments yet."
        actionLabel="Create your first assessment"
        actionHref="/backoffice/assessments/create"
      />
    )
  }

  const handleSchoolYearChange = (next: AssessmentBrowseSchoolYear) => {
    setSchoolYear(next)
    setFilters(emptyAssessmentBrowseFilters)
  }

  return (
    <div className="space-y-4">
      <AssessmentBrowseToolbar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        unitOptions={browseOptions.units}
        lessonOptions={lessonOptions}
        subjectOptions={browseOptions.subjects}
        typeOptions={browseOptions.types}
        schoolYear={schoolYear}
        onSchoolYearChange={handleSchoolYearChange}
        resultCount={assessmentsLoading || isError ? 0 : filteredAssessments.length}
        totalCount={assessmentsLoading ? 0 : totalCount}
      />

      {assessmentsLoading && <LoadingState />}

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-6 text-center">
          <p className="font-medium text-foreground">Could not load assessments</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load assessments.'}
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
      )}

      {!assessmentsLoading && !isError && totalCount === 0 && (
        <EmptyState
          icon={FileText}
          title="No assessments for this school year"
          description="Choose another school year, or select All years to see the full catalog."
        />
      )}

      {!assessmentsLoading && !isError && totalCount > 0 && filteredAssessments.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No matching assessments"
          description="Try adjusting or clearing your filters to see more assessments."
        />
      )}

      {!assessmentsLoading && !isError && filteredAssessments.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssessments.map((assessment) => (
            <AssessmentBackofficeCard
              key={assessment.id}
              assessment={assessment}
              basePath="/backoffice/assessments"
            />
          ))}
        </div>
      )}

      {!assessmentsLoading && !isError && filteredAssessments.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {filteredAssessments.map((assessment) => (
            <AssessmentListRow
              key={assessment.id}
              assessment={assessment}
              basePath="/backoffice/assessments"
            />
          ))}
        </div>
      )}
    </div>
  )
}
