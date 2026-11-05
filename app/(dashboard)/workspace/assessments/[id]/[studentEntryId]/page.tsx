'use client'

// Setup
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Components
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Typography } from '@/app/lib/components/ui/typography'
import { ChevronsUpDown } from 'lucide-react'

import { Loading } from '@/app/lib/components/ui/layout'
import {
  StudentAssessmentHeader,
  StudentAssessmentSecondaryBar,
  type ActiveFilter,
} from '@/app/lib/components/assessment'
import { StudentExportModal } from '@/app/lib/components/assessment/student-export-modal'
import { getStatusLabel } from '@/app/lib/utils/export/utils/status-utils'

// Assessment History Components
import {
  AssessmentHistoryContainer,
  completedFeedbackToResumeMessage,
} from '@/components/ui/assessment-history'
import type { Message } from '@/components/ui/assessment-history/types'

// Services / Hooks
import { assessmentRecordsQueries } from '@/app/lib/services/assessment-records/assessment-records.queries'
import { successOrThrow } from '@/utils/result'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'
import { getExportPreviewFeedbackSections } from '@/app/lib/feedback/export-preview-feedback'
import {
  getAdjacentStudentRecordId,
  getStudentNavigationState,
  isStudentPageLoadError,
  resolveMismatchedRecordRedirect,
} from '@/app/lib/assessment/student-response-navigation'
import { studentResponseBackHref } from '@/app/lib/assessment/assessment-detail-tab'

// Types for API response processing
import type { FeedbackSection, AssessmentRecordStatus, Feedback, AssessmentRecord } from '@/types'
import { feedbackQueries } from '@/app/lib/services/feedback/feedback.queries'
import { toast } from 'sonner'
import { getStudentDisplayName } from '@/app/lib/utils/student-display-name'
import { thematicAnalysisQueries } from '@/app/lib/services/thematic-analysis/thematic-analysis.queries'
import {
  buildHtmlWithThematicHighlights,
  escapeHtml,
} from '@/app/lib/utils/thematic-analysis-response-highlights'
import { useFeedbackColumnsAvailableHeight } from '@/app/lib/hooks/use-feedback-columns-available-height'

export default function StudentAssessmentViewPage({
  params,
}: {
  params: Promise<{ id: string; studentEntryId: string }>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showStudentInfo, setShowStudentInfo] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [detailsExpanded, setDetailsExpanded] = useState(true)
  const lastScrollYRef = useRef(0)
  const ignoreScrollCollapseUntilRef = useRef(0)
  const pageRootRef = useRef<HTMLDivElement>(null)
  const stickyHeaderRef = useRef<HTMLDivElement>(null)
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { id: assessmentId, studentEntryId } = React.use(params)
  
  // Read filter and sort values from URL query parameters
  const statusFilter = searchParams.get('status') || 'all'
  const classFilter = searchParams.get('class') || 'all'
  const searchTerm = searchParams.get('search') || ''
  const sortColumn = searchParams.get('sortColumn') || null
  const sortDirection = (searchParams.get('sortDirection') || 'asc') as 'asc' | 'desc'

  const [assessment, studentAssessmentRecord] = useQueries({
    queries: [
      assessmentQueries.getAssessment.getOptions({ id: assessmentId }),
      assessmentRecordsQueries.getAssessmentRecord.getOptions({ id: studentEntryId }),
    ],
  })

  const mismatchedRecordRedirectUrl = resolveMismatchedRecordRedirect({
    routeAssessmentId: assessmentId,
    routeStudentEntryId: studentEntryId,
    record: studentAssessmentRecord.data,
    filters: {
      statusFilter,
      classFilter,
      searchTerm,
      sortColumn,
      sortDirection,
    },
  })

  // Fix stale/wrong deep links: record belongs to a different assessment than the URL.
  useEffect(() => {
    if (!mismatchedRecordRedirectUrl || studentAssessmentRecord.isLoading) return
    router.replace(mismatchedRecordRedirectUrl)
  }, [
    mismatchedRecordRedirectUrl,
    router,
    studentAssessmentRecord.isLoading,
  ])

  const learnerId = studentAssessmentRecord.data?.learnerId ?? ''

  const { data: thematicHighlights } =
    thematicAnalysisQueries.getHighlightPhrases.useQuery({
      variables: { assessmentId, learnerId },
      enabled: Boolean(assessmentId && learnerId),
    })

  const isLoading = assessment.isLoading || studentAssessmentRecord.isLoading
  const isError = isStudentPageLoadError({
    assessmentFailed: assessment.isError,
    recordFailed: studentAssessmentRecord.isError,
    redirectingToOwningAssessment: Boolean(mismatchedRecordRedirectUrl),
  })
  const error = studentAssessmentRecord.error || assessment.error
  const assessmentRecord= studentAssessmentRecord.data

  // Re-run after loading so sticky/page refs exist (early returns skip that chrome).
  useFeedbackColumnsAvailableHeight(
    stickyHeaderRef,
    pageRootRef,
    `${isLoading}:${detailsExpanded}`,
  )

  const assessmentRecordStatus= useMemo(() => {
    return assessmentRecord?.status as AssessmentRecordStatus
  }, [assessmentRecord?.status])

  // Process feedback cards from API response
  /** Matches export preview: pending draft if any; otherwise latest completed (so markings survive after export → completed + reload). */
  const initialFeedbackCards: FeedbackSection[] = useMemo(() => {
    const extendedRecord = studentAssessmentRecord.data
    if (!assessmentRecord?.feedbacks) return []

    // Defensive check: Ensure we're processing feedback for the correct studentEntryId
    if (!extendedRecord || extendedRecord.id !== studentEntryId) {
      // eslint-disable-next-line no-console -- defensive warn for ID mismatch
      console.warn('Mismatch between studentEntryId and record ID:', { studentEntryId, recordId: extendedRecord?.id })
      return []
    }

    const feedbacks = extendedRecord?.feedbacks
    if (!feedbacks || !Array.isArray(feedbacks)) return []

    return getExportPreviewFeedbackSections(feedbacks)
  }, [assessmentRecord?.feedbacks, studentAssessmentRecord.data, studentEntryId])
  const feedbackCards = initialFeedbackCards

  const exportPreviewFeedbackCards = useMemo(
    () => getExportPreviewFeedbackSections(assessmentRecord?.feedbacks),
    [assessmentRecord?.feedbacks],
  )

  // Collapse secondary bar when user scrolls down; reopen only when page touches top (hysteresis to avoid flicker)
  useEffect(() => {
    const closeThreshold = 80
    const openThreshold = 10 // reopen only when scroll is at top
    lastScrollYRef.current = globalThis.window?.scrollY ?? 0
    const handleScroll = () => {
      if (globalThis.window === undefined) return
      const y = globalThis.window.scrollY
      const lastScrollY = lastScrollYRef.current
      if (y <= openThreshold) {
        setDetailsExpanded(true)
      } else if (y > closeThreshold && y > lastScrollY && Date.now() >= ignoreScrollCollapseUntilRef.current) {
        setDetailsExpanded(false)
      }
      lastScrollYRef.current = y
    }
    globalThis.window.addEventListener('scroll', handleScroll, { passive: true })
    return () => globalThis.window.removeEventListener('scroll', handleScroll)
  }, [])

  // Callbacks for AssessmentHistoryContainer
  const handleRegenerateFeedback = useCallback(
    async (messageId = 'regenerating-feedback'): Promise<void> => {
      setRegeneratingMessageId(messageId)

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } finally {
        setRegeneratingMessageId(null)
      }
    },
    [],
  )


  const feedbackUpdateMutation= feedbackQueries.updateFeedback.useMutation({
    onSuccess:()=>{
      globalThis.location.reload()
    }
  })
  
  const updateAssessmentMutation = assessmentRecordsQueries.updateAssessmentRecord.useMutation({
    onSuccess: () => {
      // Show success message
      toast.success('Success! Feedback shared!', {
        description: `Feedback for ${studentAssessmentRecord.data?.learnerName} has been exported and shared.`,
        duration: 4000,
      })
      globalThis.location.reload()
    }
  })

  // Apply the same filters and sorting as StudentList
  const filteredAndSortedRecords = useMemo(() => {
    if (!assessment.data?.assessmentRecords) return []

    // Filter records (same logic as StudentList)
    const filtered = assessment.data.assessmentRecords.filter((record) => {
      const matchesSearch = (record.learnerName || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter
      const matchesClass = classFilter === 'all' || record.classSection === classFilter
      return matchesSearch && matchesStatus && matchesClass
    })

    // Sort records (same logic as StudentList)
    if (!sortColumn) return filtered

    // Define sort functions (same as StudentList columns)
    const getSortFunction = (columnKey: string) => {
      switch (columnKey) {
        case 'name': {
          return (a: AssessmentRecord, b: AssessmentRecord) => {
            const getDisplayName = (record: AssessmentRecord) =>
              getStudentDisplayName({
                showRealNames: showStudentInfo,
                learnerName: record.learnerName,
                learnerId: record.learnerId,
              })
            const nameA = getDisplayName(a)
            const nameB = getDisplayName(b)
            return nameA.localeCompare(nameB)
          }
        }
        case 'class': {
          return (a: AssessmentRecord, b: AssessmentRecord) => 
            (a.classSection || '').localeCompare(b.classSection || '')
        }
        case 'status': {
          return (a: AssessmentRecord, b: AssessmentRecord) => {
            const statusOrder = {
              'handed_in': 1,
              'ready_for_review': 2,
              'in_progress': 3,
              'sent': 4
            }
            const orderA = statusOrder[a.status as keyof typeof statusOrder] || 5
            const orderB = statusOrder[b.status as keyof typeof statusOrder] || 5
            return orderA - orderB
          }
        }
        case 'lastAction': {
          return (a: AssessmentRecord, b: AssessmentRecord) => {
            const dateA = new Date(a.updatedAt || 0).getTime()
            const dateB = new Date(b.updatedAt || 0).getTime()
            return dateA - dateB
          }
        }
        default: {
          return () => 0
        }
      }
    }

    const sortFn = getSortFunction(sortColumn)
    const sorted = [...filtered].sort((a, b) => {
      const result = sortFn(a, b)
      return sortDirection === 'asc' ? result : -result
    })

    return sorted
  }, [assessment.data?.assessmentRecords, statusFilter, classFilter, searchTerm, sortColumn, sortDirection, showStudentInfo])

  // Helper function to build navigation URLs with query parameters preserved
  const buildNavigationUrl = useCallback((recordId: string) => {
    const params = new URLSearchParams()
    
    // Preserve all current query parameters
    if (statusFilter !== 'all') {
      params.set('status', statusFilter)
    }
    if (classFilter !== 'all') {
      params.set('class', classFilter)
    }
    if (searchTerm.trim() !== '') {
      params.set('search', searchTerm.trim())
    }
    if (sortColumn) {
      params.set('sortColumn', sortColumn)
      params.set('sortDirection', sortDirection)
    }
    
    const queryString = params.toString()
    return queryString
      ? `/workspace/assessments/${assessmentId}/${recordId}?${queryString}`
      : `/workspace/assessments/${assessmentId}/${recordId}`
  }, [assessmentId, statusFilter, classFilter, searchTerm, sortColumn, sortDirection])

  const handlePrevious = () => {
    const recordIds = filteredAndSortedRecords.map((r) => r.id)
    const previousId = getAdjacentStudentRecordId(recordIds, studentEntryId, 'previous')
    if (previousId) {
      router.push(buildNavigationUrl(previousId))
    }
  }

  const handleNext = () => {
    const recordIds = filteredAndSortedRecords.map((r) => r.id)
    const nextId = getAdjacentStudentRecordId(recordIds, studentEntryId, 'next')
    if (nextId) {
      router.push(buildNavigationUrl(nextId))
    }
  }

  // Calculate navigation state based on filtered and sorted records
  const navigationState = useMemo(
    () =>
      getStudentNavigationState(
        filteredAndSortedRecords.map((r) => r.id),
        studentEntryId,
      ),
    [filteredAndSortedRecords, studentEntryId],
  )

  // Build active filters for secondary bar (status and class when not 'all')
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = []
    if (statusFilter !== 'all') {
      filters.push({ type: 'status', value: statusFilter, label: getStatusLabel(statusFilter) })
    }
    if (classFilter !== 'all') {
      filters.push({ type: 'class', value: classFilter, label: classFilter })
    }
    return filters
  }, [statusFilter, classFilter])

  const handleRemoveFilter = useCallback(
    (type: 'status' | 'class') => {
      const params = new URLSearchParams(searchParams.toString())
      if (type === 'status') {
        params.delete('status')
      } else {
        params.delete('class')
      }
      const queryString = params.toString()
      const url = queryString
        ? `/workspace/assessments/${assessmentId}/${studentEntryId}?${queryString}`
        : `/workspace/assessments/${assessmentId}/${studentEntryId}`
      router.push(url)
    },
    [assessmentId, studentEntryId, router, searchParams]
  )

  const handleResumeFeedback = useCallback(async (message: Message) => {
    const feedback = message.metadata.eventData;
    
    try {
      await feedbackUpdateMutation.mutateAsync({
        id: feedback?.id as string,
        data: {
          status: 'pending',
        },
      })

      if (studentAssessmentRecord.data?.status === 'shared') {
        try {
          await updateAssessmentMutation.mutateAsync({
            id: studentAssessmentRecord.data.id,
            data: { status: 'in_progress'}
          })
        } catch (assessmentError) {
          // eslint-disable-next-line no-console
          console.error('Error updating assessment record status:', assessmentError)
        }
      }

      await queryClient.invalidateQueries({
        queryKey: assessmentQueries.getAssessment.getKey({ id: assessmentId }),
      })
      await queryClient.invalidateQueries({
        queryKey: assessmentRecordsQueries.getAssessmentRecord.getKey({ id: studentEntryId }),
      })
      
    } catch (feedbackError) {
      // eslint-disable-next-line no-console
      console.error('Error resuming feedback:', feedbackError)
      toast.error('Error resuming feedback', {
        description: 'There was an error resuming the feedback for editing. Please try again.',
        duration: 4000,
      })
    }
    
  }, [
    feedbackUpdateMutation,
    updateAssessmentMutation,
    studentAssessmentRecord.data,
    queryClient,
    assessmentId,
    studentEntryId,
  ])

  const thematicHighlightPhrases = useMemo(
    () => thematicHighlights?.phrases ?? [],
    [thematicHighlights?.phrases],
  )

  // Process assessment history and student answers into messages
  const assessmentMessages = useMemo(() => {

    const extendedRecord = assessmentRecord 
    const messages: Message[] = []

    // Process student answers as separate messages
    if (extendedRecord?.studentAnswers && Array.isArray(extendedRecord.studentAnswers)) {
      for (const studentAnswer of extendedRecord.studentAnswers) {
        if (studentAnswer.answers && Array.isArray(studentAnswer.answers)) {
          const answerObj = studentAnswer.answers as Array<{title: string, value: string}>;
          // Create a separate message for each question
          const filteredQuestions=answerObj.filter((answer: {title: string, value: string}) => {return (answer.title.includes('Question')||answer.title.startsWith('Directions'))|| !(answer.title.toLowerCase().includes('student name')||answer.title.toLowerCase().includes('hour')||answer.title.toLowerCase().includes('name') || answer.title.toLowerCase().includes('Please write your name in this format: Last Name, First Name'))})
          const content= filteredQuestions.map((answer: {title: string, value: string}) => {
            const body = buildHtmlWithThematicHighlights(
              answer.value,
              thematicHighlightPhrases,
            )
            return `<b>${escapeHtml(answer.title)}</b> <br/> ${body}`
          }).join('<br/><br/>')
          
          messages.push({
            id: `student-answer-${studentAnswer.id}`,
            content: content,
            role: 'user' as const,
            timestamp: new Date(studentAnswer.createdAt),
            studentAnswerId: studentAnswer.id,
            aiSuggestions: studentAnswer.aiSuggestions,
            metadata: {
              type: 'submission' as const,
              studentAnswerId: studentAnswer.id,
              questionKey: 'any',
            },
          })
        }
      }
    }

    
    if (!extendedRecord?.feedbacks || !Array.isArray(extendedRecord.feedbacks)) return messages


    const completedFeedbacks=extendedRecord.feedbacks.filter((feedback) => {return feedback.status==='completed'})


    const historyMessages = completedFeedbacks.map((feedback) =>
      completedFeedbackToResumeMessage(feedback as Feedback),
    )

    // Combine student answers and assessment history messages
    const allMessages = [...messages, ...historyMessages]


    // Sort all messages by timestamp
    return allMessages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
  }, [assessmentRecord, thematicHighlightPhrases])

  const displayStudentName = useMemo(
    () =>
      getStudentDisplayName({
        showRealNames: showStudentInfo,
        learnerName: assessmentRecord?.learnerName,
        learnerId: assessmentRecord?.learnerId,
      }),
    [assessmentRecord?.learnerName, assessmentRecord?.learnerId, showStudentInfo],
  )

  if (!successOrThrow(assessment.data || assessment.data === undefined)) {
    return null
  }
  if (!successOrThrow(studentAssessmentRecord.data) || studentAssessmentRecord.data === undefined) {
    return null
  }

  const handleBack = () => {
    router.push(studentResponseBackHref(assessmentId))
  }

  const handleToggleStudentInfo = () => {
    setShowStudentInfo(!showStudentInfo)
  }

  const handleExportInteractionLog = () => {
    setShowExportModal(true)
  }

  // Keep the loading shell while the URL is replaced, so a missing assessment
  // does not flash the error or not-found screen.
  if (isLoading || mismatchedRecordRedirectUrl) {
    return <Loading variant="assessment" />
  }

  // Show error state
  if (isError) {
    return (
      <div className="py-12 text-center">
        <Typography variant="h2" className="mb-2">
          Error loading student assessment
        </Typography>
        <Typography variant="body1" color="muted" className="mb-4">
          {error?.message || 'An error occurred while loading the student assessment'}
        </Typography>
        <Button onClick={handleBack}>Back to Assessment</Button>
      </div>
    )
  }

  // Show not found state
  if (!assessment.data) {
    return (
      <div className="py-12 text-center">
        <Typography variant="h2" className="mb-2">
          Student assessment not found
        </Typography>
        <Typography variant="body1" color="muted" className="mb-4">
          The student assessment you&apos;re looking for doesn&apos;t exist.
        </Typography>
        <Button onClick={handleBack}>Back to Assessment</Button>
      </div>
    )
  }

  // Filters apply to prev/next only; direct URLs must still open the student if the record belongs to this assessment.
  return (
    <div ref={pageRootRef} className="space-y-8">
      {/* Sticky header: breadcrumbs always visible; secondary bar collapses on scroll */}
      <div
        ref={stickyHeaderRef}
        className="sticky top-0 z-10 w-full bg-background shadow-sm"
      >
        <div className="mx-auto max-w-7xl px-6 py-3 sm:px-10">
          <StudentAssessmentHeader
            studentName={displayStudentName}
            assessment={assessment.data}
            onBack={handleBack}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailsExpanded((prev) => {
                    if (!prev) ignoreScrollCollapseUntilRef.current = Date.now() + 400
                    return !prev
                  })
                }}
                title={detailsExpanded ? 'Collapse details' : 'Expand details'}
              >
                <ChevronsUpDown className="mr-2 size-4" />
                {detailsExpanded ? 'Hide Details' : 'Show Details'}
              </Button>
            }
          />
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              detailsExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <StudentAssessmentSecondaryBar
              studentName={assessmentRecord?.learnerName || ''}
              learnerId={assessmentRecord?.learnerId}
              showStudentInfo={showStudentInfo}
              onToggleStudentInfo={handleToggleStudentInfo}
              onPrevious={handlePrevious}
              onNext={handleNext}
              isFirstRecord={navigationState.isFirst}
              isLastRecord={navigationState.isLast}
              classSection={assessmentRecord?.classSection}
              assessmentRecordStatus={assessmentRecordStatus ?? 'handed_in'}
              activeFilters={activeFilters}
              onRemoveFilter={handleRemoveFilter}
              currentPosition={navigationState.currentPosition}
              totalCount={navigationState.totalCount}
              onExport={handleExportInteractionLog}
            />
          </div>
        </div>
        {/* Full-width divider: absolute so it doesn't expand layout; 100vw centered so it touches viewport edges without horizontal scroll */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-screen bottom-0 overflow-x-hidden pointer-events-none"
          aria-hidden
        >
          <div className="w-full border-b border-border" aria-hidden />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Feedback Content */}
        <div className="space-y-4">
          <AssessmentHistoryContainer
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            record={assessmentRecord as any}
            isLoading={false}
            onResumeFeedback={handleResumeFeedback}
            showStudentInfo={showStudentInfo}
            assessment={assessment.data}
            messages={assessmentMessages}
            initialFeedbackCards={feedbackCards}
            onFeedbackToggle={()=>{}}
            onRegenerateFeedback={handleRegenerateFeedback}
            regeneratingMessageId={regeneratingMessageId}
            onUpdateMessage={()=>{}}
            isSavingFeedback={false}
            onClearAllFeedback={()=>{}}
            thematicHighlightPhrases={thematicHighlightPhrases}
          />
        </div>
      </div>

      {assessmentRecord && (
      <StudentExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        assessmentRecord={assessmentRecord}
        assessment={assessment.data}
        feedbackCards={exportPreviewFeedbackCards}
      />
      )}
    </div>
  )
}
