'use client'

import { Suspense, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { LiveCollectionModal } from '@/app/lib/components/ui/feedback'
import { Typography } from '@/app/lib/components/ui/typography'
import { Assessment } from '@/types'
import {
  AssessmentHeader,
  AssessmentSecondaryBar,
  StudentList,
  StatusFilterSidebar,
  AssessmentExportModal,
} from '@/app/lib/components/assessment'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThematicAnalysisTab } from '@/app/lib/components/assessment/thematic-analysis'
import { ArrowLeft, BarChart3, Users } from 'lucide-react'
import { Loading } from '@/app/lib/components/ui/layout'
import { isResultError } from '@/utils/result'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'
import { assessmentRecordsQueries } from '@/app/lib/services/assessment-records/assessment-records.queries'
import {
  assessmentDetailHref,
  assessmentDetailTabFromQuery,
  type AssessmentDetailTab,
} from '@/app/lib/assessment/assessment-detail-tab'

function AssessmentDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showLiveCollectionModal, setShowLiveCollectionModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isStatusUpdating, setIsStatusUpdating] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showRealNames, setShowRealNames] = useState(false)

  const params = useParams()
  const assessmentId = params.id as string

  const { data: assessment } = assessmentQueries.getAssessment.useQuery({
    variables: { id: assessmentId },
    refetchInterval: 5000,
  })

  const {
    data: assessmentRecords,
    isLoading,
    isError,
    error,
  } = assessmentRecordsQueries.getAssessmentRecordsByAssessment.useQuery({
    variables: { assessmentId },
  })

  const responsesReceivedCount = useMemo(() => {
    if (assessmentRecords === undefined || isResultError(assessmentRecords)) {
      return 0
    }
    return assessmentRecords.filter((r) => (r.studentAnswers?.length ?? 0) > 0)
      .length
  }, [assessmentRecords])

  const activeTab = assessmentDetailTabFromQuery(searchParams.get('tab'))

  const handleTabChange = (tab: AssessmentDetailTab) => {
    router.replace(assessmentDetailHref(assessmentId, tab, searchParams.toString()), {
      scroll: false,
    })
  }

  const handleBack = () => {
    router.push('/workspace')
  }

  const handleExport = () => {
    setShowExportModal(true)
  }

  const handleLiveCollection = () => {
    setShowLiveCollectionModal(true)
  }

  const handleStatusChange = async (_newStatus: Assessment['status']) => {
    if (!assessment) return

    try {
      setIsStatusUpdating(true)
      // TODO: Implement API call to update assessment status
    } catch {
      // Error handling will be implemented when API call is added
    } finally {
      setIsStatusUpdating(false)
    }
  }

  // Completed count for secondary bar progress (e.g. shared submissions)
  const completedCount = assessment?.submissionStatus?.shared ?? 0

  if (isLoading || assessmentRecords === undefined) {
    return <Loading variant="assessment" />
  }

  if (isError || isResultError(assessmentRecords)) {
    return (
      <div className="py-12 text-center">
        <Typography variant="h2" className="mb-2">
          Error loading assessment
        </Typography>
        <Typography variant="body1" color="muted" className="mb-4">
          {error?.message || 'An error occurred while loading the assessment'}
        </Typography>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Workspace
        </Button>
      </div>
    )
  }

  const totalStudents = assessmentRecords.length || 0

  if (!assessment) {
    return (
      <div className="py-12 text-center">
        <Typography variant="h2" className="mb-2">
          Assessment not found
        </Typography>
        <Typography variant="body1" color="muted" className="mb-4">
          The assessment you&apos;re looking for doesn&apos;t exist.
        </Typography>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Workspace
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AssessmentHeader
        assessment={assessment}
        onBack={handleBack}
        onExport={handleExport}
        onLiveCollection={handleLiveCollection}
        onStatusChange={handleStatusChange}
        isStatusUpdating={isStatusUpdating}
        showHandoutInHeader={false}
        showExportInHeader={false}
      />

      {/* Secondary bar: metadata + progress + Assessment Handout */}
      <AssessmentSecondaryBar
        assessment={assessment}
        totalStudents={totalStudents}
        completedCount={completedCount}
        onAssessmentHandout={handleLiveCollection}
        handoutDisabled={assessment.status !== 'live'}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(assessmentDetailTabFromQuery(value))}
      >
        <TabsList>
          <TabsTrigger value="thematic-analysis" className="gap-1.5">
            <BarChart3 className="size-4" />
            Thematic Analysis
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5">
            <Users className="size-4" />
            Student Records ({responsesReceivedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="thematic-analysis">
          <ThematicAnalysisTab
            assessmentId={assessmentId}
            hasResponses={responsesReceivedCount > 0}
            responsesCount={responsesReceivedCount}
          />
        </TabsContent>

        <TabsContent value="students">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <StudentList
                assessmentRecords={assessmentRecords}
                externalStatusFilter={statusFilter}
                onFilterChange={setStatusFilter}
                assessmentId={assessmentId}
                showRealNames={showRealNames}
                onToggleNames={() => setShowRealNames(!showRealNames)}
                onExport={handleExport}
                showExportButton
              />
            </div>
            <StatusFilterSidebar
              assessmentRecords={assessmentRecords}
              statusFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
          </div>
        </TabsContent>
      </Tabs>

      {assessment && (
        <LiveCollectionModal
          assessment={assessment}
          open={showLiveCollectionModal}
          onOpenChange={setShowLiveCollectionModal}
        />
      )}

      {assessment && (
        <AssessmentExportModal
          open={showExportModal}
          onOpenChange={setShowExportModal}
          assessment={assessment}
          assessmentRecords={assessmentRecords}
          totalStudents={totalStudents}
          handedIn={assessment?.submissionStatus?.handedIn || 0}
          readyForReview={assessment?.submissionStatus?.readyForReview || 0}
          inProgress={assessment?.submissionStatus?.inProgress || 0}
          sent={assessment?.submissionStatus?.shared || 0}
        />
      )}
    </div>
  )
}

export default function AssessmentDetailPageRoute() {
  return (
    <Suspense fallback={<Loading variant="assessment" />}>
      <AssessmentDetailPage />
    </Suspense>
  )
}
