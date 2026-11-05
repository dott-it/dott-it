'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/app/lib/components/ui/buttons/button'
import { Card, CardHeader, CardTitle } from '@/app/lib/components/ui/layout/card'
import { Badge } from '@/app/lib/components/ui/feedback/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/app/lib/components/ui/forms/input'
import { Label } from '@/app/lib/components/ui/forms/label'
import { Download, FileText, X, Search, History } from 'lucide-react'
import {
  exportAssessmentHistoryToPDF,
  exportAssessmentHistoryToDOC,
  exportAllAssessmentRubricToPDF,
  exportAllAssessmentRubricToCSV,
  exportSingleStudentRubricToPDF,
  exportMultipleAssessmentHistoriesToPDF,
  exportMultipleAssessmentHistoriesToDOC,
} from '@/app/lib/utils/export'
import type { ActiveAssessment } from '@/types'
import { AssessmentRecord } from '@/types'
import { assessmentRecordsQueries } from '@/app/lib/services/assessment-records/assessment-records.queries'
import { feedbackQueries } from '@/app/lib/services/feedback/feedback.queries'
import { toast } from 'sonner'
import { pickCanonicalPendingFeedback } from '@/app/lib/feedback/resolve-canonical-pending-feedback'

// Helper functions
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'handed_in': {
      return 'Handed In'
    }
    case 'ready_for_review': {
      return 'Ready for Review'
    }
    case 'in_progress': {
      return 'In Progress'
    }
    case 'shared': {
      return 'Shared'
    }
    default: {
      return status
    }
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'handed_in': {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
    case 'ready_for_review': {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
    case 'in_progress': {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    }
    case 'shared': {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    default: {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }
}

const handleExportIndividualStudentHistory = async (
  assessmentRecord: AssessmentRecord,
  assessment: ActiveAssessment,
  format: 'pdf' | 'doc',
  updateFeedbackMutation: { mutateAsync: (data: { id: string; data: { status: string; completedAt?: Date } }) => Promise<unknown> },
  updateAssessmentMutation: { mutateAsync: (data: { id: string; data: { status: string } }) => Promise<unknown> },
): Promise<void> => {
  try {
    // eslint-disable-next-line
    console.log(`Starting ${format.toUpperCase()} export for ${assessmentRecord.learnerName}...`)
    
    // Mock feedback cards for now - in a real implementation, these would come from the API
    await (format === 'pdf'
      ? exportAssessmentHistoryToPDF(assessmentRecord, assessment)
      : exportAssessmentHistoryToDOC(assessmentRecord, assessment))
    
    // eslint-disable-next-line
    console.log(`${format.toUpperCase()} export completed for ${assessmentRecord.learnerName}`)
    
    // Update feedback status to completed and move to assessment history
    // eslint-disable-next-line
    console.log('Student record feedbacks:', assessmentRecord.feedbacks)
    const pendingFeedback = pickCanonicalPendingFeedback(assessmentRecord.feedbacks)
    // eslint-disable-next-line
    console.log('Pending feedback found:', pendingFeedback)
    
    if (pendingFeedback) {
      try {
        const updateData = {
          id: pendingFeedback.id,
          data: {
            status: 'completed',
            completedAt: new Date()
          }
        }
        // eslint-disable-next-line
        console.log('Updating feedback with data:', updateData)
        
        await updateFeedbackMutation.mutateAsync(updateData)
        // eslint-disable-next-line
        console.log('Feedback status updated successfully')
      } catch (feedbackError) {
        // eslint-disable-next-line
        console.error('Error updating feedback status:', feedbackError)
        // Don't throw here, continue with assessment record update
      }
    } else {
      // eslint-disable-next-line
      console.log('No pending feedback found to update')
    }
    
    // Update status to shared after successful export
    try {
      // eslint-disable-next-line
      console.log('Updating assessment record status to shared...')
      await updateAssessmentMutation.mutateAsync({
        id: assessmentRecord.id,
        data: { status: 'shared'}
      })
      // eslint-disable-next-line
      console.log('Assessment record status updated successfully')
    } catch (assessmentError) {
      // eslint-disable-next-line
      console.error('Error updating assessment record status:', assessmentError)
      // Don't throw here, show success for export but mention the issue
    }
    
    toast.success('Success! Feedback shared!', {
      description: `Assessment history for ${assessmentRecord.learnerName} has been exported and shared.`,
      duration: 4000,
    })
  } catch (exportError) {
    // eslint-disable-next-line
    console.error('Export failed:', exportError)
    toast.error('Export failed', {
      description: `There was an error exporting the ${format.toUpperCase()}. Please try again.`,
      duration: 4000,
    })
  }
}

const handleExportIndividualStudentRubric = async (
  assessmentRecord: AssessmentRecord,
  assessment: ActiveAssessment,
): Promise<void> => {
  try {
    await exportSingleStudentRubricToPDF(assessmentRecord, assessment)
    
    // Update status to shared after successful export
    const updateAssessmentMutation = assessmentRecordsQueries.updateAssessmentRecord.useMutation({
      onSuccess: () => {
        globalThis.location.reload()
      }
    })
    
    await updateAssessmentMutation.mutateAsync({
      id: assessmentRecord.id,
      data: { status: 'shared'}
    })
    
    alert(`Successfully exported rubric evaluation for ${assessmentRecord.learnerName || 'student'} as PDF`)
  } catch {
    alert('Error exporting rubric. Please try again.')
  }
}
interface AssessmentExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: ActiveAssessment
  assessmentRecords: AssessmentRecord[]
  totalStudents: number
  handedIn: number
  readyForReview: number
  inProgress: number
  sent: number
  studentResponses?: Record<string, string> // Add student responses mapping
}

export function AssessmentExportModal({
  open,
  onOpenChange,
  assessment,
  assessmentRecords,
  totalStudents: _totalStudents,
  handedIn: _handedIn,
  readyForReview: _readyForReview,
  inProgress: _inProgress,
  sent: _sent,
}: AssessmentExportModalProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [exportMode, setExportMode] = useState<'individual' | 'combined'>('individual')

  // Create mutations at component level to avoid recreation issues
  const updateFeedbackMutation = feedbackQueries.updateFeedback.useMutation()
  const updateAssessmentMutation = assessmentRecordsQueries.updateAssessmentRecord.useMutation({
    onSuccess: () => {
      // Don't reload immediately, wait for all operations to complete
    }
  })

  // Get unique classes from assessment records
  const uniqueClasses = useMemo(() => {
    const classes = assessmentRecords
      .map((record) => record.classSection)
      .filter((classSection): classSection is string => !!classSection)
      .filter((classSection, index, array) => array.indexOf(classSection) === index)
      .sort()
    return classes
  }, [assessmentRecords])

  // Filter students based on status, class, and search
  const filteredAssessmentRecord = useMemo(() => {
    let filtered = assessmentRecords

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((student) => student.status === statusFilter)
    }

    // Filter by class
    if (classFilter !== 'all') {
      filtered = filtered.filter((student) => student.classSection === classFilter)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.learnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.classSection?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filtered
  }, [assessmentRecords, statusFilter, classFilter, searchTerm])

  // Update select all when filtered students change
  useEffect(() => {
    if (filteredAssessmentRecord.length === 0) {
      setSelectAll(false)
      setSelectedStudents(new Set())
    } else if (selectedStudents.size === filteredAssessmentRecord.length) {
      setSelectAll(true)
    } else {
      setSelectAll(false)
    }
  }, [filteredAssessmentRecord.length, selectedStudents.size])

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set())
      setSelectAll(false)
    } else {
      setSelectedStudents(new Set(filteredAssessmentRecord.map((s) => s.id)))
      setSelectAll(true)
    }
  }

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleExportSelectedStudentsHistory = async (format: 'pdf' | 'doc') => {
    if (selectedStudents.size === 0) {
      toast.error('No students selected', {
        description: 'Please select at least one student to export.',
        duration: 4000,
      })
      return
    }

    const selectedStudentRecords = assessmentRecords.filter((s) => selectedStudents.has(s.id))
    // eslint-disable-next-line
    console.log(`Starting bulk ${format.toUpperCase()} export for ${selectedStudentRecords.length} students`)

    try {
      for (const assessmentRecord of selectedStudentRecords) {
        // eslint-disable-next-line
        console.log(`Processing ${assessmentRecord.learnerName}...`)
        
        await (format === 'pdf'
          ? exportAssessmentHistoryToPDF(assessmentRecord, assessment)
          : exportAssessmentHistoryToDOC(assessmentRecord, assessment))
        
        // eslint-disable-next-line
        console.log(`Export completed for ${assessmentRecord.learnerName}`)
        
        // Update feedback status to completed and move to assessment history
        // eslint-disable-next-line
        console.log('Student record feedbacks:', assessmentRecord.feedbacks)
        const pendingFeedback = pickCanonicalPendingFeedback(assessmentRecord.feedbacks)
        // eslint-disable-next-line
        console.log('Pending feedback found:', pendingFeedback)
        
        if (pendingFeedback) {
          try {
            const updateData = {
              id: pendingFeedback.id,
              data: {
                status: 'completed',
                completedAt: new Date()
              }
            }
            // eslint-disable-next-line
            console.log('Updating feedback with data:', updateData)
            
            await updateFeedbackMutation.mutateAsync(updateData)
            // eslint-disable-next-line
            console.log('Feedback status updated successfully')
          } catch (feedbackError) {
            // eslint-disable-next-line
            console.error('Error updating feedback status:', feedbackError)
            // Don't throw here, continue with assessment record update
          }
        } else {
          // eslint-disable-next-line
          console.log('No pending feedback found to update')
        }
        
        // Update status to shared after successful export
        try {
          // eslint-disable-next-line
          console.log('Updating assessment record status to shared...')
          await updateAssessmentMutation.mutateAsync({
            id: assessmentRecord.id,
            data: { status: 'shared'}
          })
          // eslint-disable-next-line
          console.log('Assessment record status updated successfully')
        } catch (assessmentError) {
          // eslint-disable-next-line
          console.error('Error updating assessment record status:', assessmentError)
          // Don't throw here, continue with next student
        }
      }
      
      // Show success message for all exports
      toast.success('Success! All feedbacks shared!', {
        description: `Assessment histories for ${selectedStudentRecords.length} students have been exported and shared.`,
        duration: 4000,
      })
      
      // Reload page to reflect changes
      globalThis.location.reload()
    } catch (exportError) {
      // eslint-disable-next-line
      console.error('Bulk export failed:', exportError)
      toast.error('Export failed', {
        description: `There was an error exporting the ${format.toUpperCase()}. Please try again.`,
        duration: 4000,
      })
    }
  }

  const handleExportSelectedStudentsRubric = async (format: 'pdf' | 'doc') => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student to export.')
      return
    }

    const selectedStudentRecords = assessmentRecords.filter((s) => selectedStudents.has(s.id))

    try {
      if (format === 'pdf') {
        await exportAllAssessmentRubricToPDF(selectedStudentRecords, assessment)
      } else {
        // For DOC format, export individual rubrics (since we don't have a combined DOC function yet)
        for (const assessmentRecord of selectedStudentRecords) {
          await exportAssessmentHistoryToDOC(assessmentRecord, assessment)
        }
      }
      
      // Update status to shared for all selected students after successful export
      for (const assessmentRecord of selectedStudentRecords) {
        const updateAssessmentMutation = assessmentRecordsQueries.updateAssessmentRecord.useMutation({
          onSuccess: () => {
            globalThis.location.reload()
          }
        })
        
        await updateAssessmentMutation.mutateAsync({
          id: assessmentRecord.id,
          data: { status: 'shared'}
        })
      }

      alert(
        `Successfully exported rubric evaluations for ${
          selectedStudents.size
        } student(s) as ${format.toUpperCase()}`,
      )
    } catch {
      alert(`Error exporting ${format.toUpperCase()}. Please try again.`)
    }
  }

  const handleExportSelectedStudentsRubricCSV = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student to export.')
      return
    }

    const selectedStudentRecords = assessmentRecords.filter((s) => selectedStudents.has(s.id))

    try {
      await exportAllAssessmentRubricToCSV(selectedStudentRecords, assessment)
      
      // Update status to shared for all selected students after successful export
      for (const assessmentRecord of selectedStudentRecords) {
        const updateAssessmentMutation = assessmentRecordsQueries.updateAssessmentRecord.useMutation({
          onSuccess: () => {
            globalThis.location.reload()
          }
        })
        
        await updateAssessmentMutation.mutateAsync({
          id: assessmentRecord.id,
          data: { status: 'shared'}
        })
      }
      
      alert(
        `Successfully exported rubric evaluations for ${selectedStudents.size} student(s) as CSV`,
      )
    } catch {
      alert('Error exporting CSV. Please try again.')
    }
  }

  const handleExportCombinedAssessmentHistories = async (format: 'pdf' | 'doc') => {
    if (selectedStudents.size === 0) {
      toast.error('No students selected', {
        description: 'Please select at least one student to export.',
        duration: 4000,
      })
      return
    }

    const selectedStudentRecords = assessmentRecords.filter((s) => selectedStudents.has(s.id))
    // eslint-disable-next-line
    console.log(`Starting combined ${format.toUpperCase()} export for ${selectedStudentRecords.length} students`)

    try {
      await (format === 'pdf'
        ? exportMultipleAssessmentHistoriesToPDF(selectedStudentRecords, assessment)
        : exportMultipleAssessmentHistoriesToDOC(selectedStudentRecords, assessment))
      
      // eslint-disable-next-line
      console.log('Combined export completed successfully')
      
      // Update feedback status to completed and move to assessment history for all students
      for (const assessmentRecord of selectedStudentRecords) {
        // eslint-disable-next-line
        console.log(`Processing feedback for ${assessmentRecord.learnerName}...`)
        // eslint-disable-next-line
        console.log('Student record feedbacks:', assessmentRecord.feedbacks)
        
        const pendingFeedback = pickCanonicalPendingFeedback(assessmentRecord.feedbacks)
        // eslint-disable-next-line
        console.log('Pending feedback found:', pendingFeedback)
        
        if (pendingFeedback) {
          try {
            const updateData = {
              id: pendingFeedback.id,
              data: {
                status: 'completed',
                completedAt: new Date()
              }
            }
            // eslint-disable-next-line
            console.log('Updating feedback with data:', updateData)
            
            await updateFeedbackMutation.mutateAsync(updateData)
            // eslint-disable-next-line
            console.log('Feedback status updated successfully')
          } catch (feedbackError) {
            // eslint-disable-next-line
            console.error('Error updating feedback status:', feedbackError)
            // Don't throw here, continue with assessment record update
          }
        } else {
          // eslint-disable-next-line
          console.log('No pending feedback found to update')
        }
      }
      
      // Update status to shared for all selected students after successful export
      for (const assessmentRecord of selectedStudentRecords) {
        try {
          // eslint-disable-next-line
          console.log(`Updating assessment record status to shared for ${assessmentRecord.learnerName}...`)
          await updateAssessmentMutation.mutateAsync({
            id: assessmentRecord.id,
            data: { status: 'shared'}
          })
          // eslint-disable-next-line
          console.log('Assessment record status updated successfully')
        } catch (assessmentError) {
          // eslint-disable-next-line
          console.error('Error updating assessment record status:', assessmentError)
          // Don't throw here, continue with next student
        }
      }

      // Show success message for all exports
      toast.success('Success! All feedbacks shared!', {
        description: `Combined assessment histories for ${selectedStudentRecords.length} students have been exported and shared.`,
        duration: 4000,
      })
      
      // Reload page to reflect changes
      globalThis.location.reload()
    } catch (exportError) {
      // eslint-disable-next-line
      console.error('Combined export failed:', exportError)
      toast.error('Export failed', {
        description: `There was an error exporting the combined ${format.toUpperCase()}. Please try again.`,
        duration: 4000,
      })
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="assessment-export-title">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal content */}
      <div className="relative z-10 h-[90vh] w-full max-w-6xl">
        <Card className="flex size-full flex-col border-0 shadow-2xl">
          {/* Fixed Header */}
          <CardHeader className="shrink-0 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle id="assessment-export-title" className="text-xl">Export Assessment Records & History</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Export individual student assessment history or the complete assessment report
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close export dialog">
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Scrollable Content */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            {/* Export Mode Selection */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">Export Mode</h3>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="individual"
                    name="exportMode"
                    value="individual"
                    checked={exportMode === 'individual'}
                    onChange={(e) => setExportMode(e.target.value as 'individual' | 'combined')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="individual" className="text-sm font-medium">
                    Individual Files
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Each student exported as a separate file
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="combined"
                    name="exportMode"
                    value="combined"
                    checked={exportMode === 'combined'}
                    onChange={(e) => setExportMode(e.target.value as 'individual' | 'combined')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="combined" className="text-sm font-medium">
                    Combined File
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    All selected students in one file with page breaks
                  </span>
                </div>
              </div>
            </div>

            {/* Student Records Section */}
            <div className="rounded-lg border bg-card p-4">
                <h3 className="text-lg font-semibold">
                  Student Assessment History ({filteredAssessmentRecord.length} of{' '}
                  {assessmentRecords.length})
                </h3>
              <div className="mb-4 flex items-center justify-between">

                {/* Export Selected Students History */}
                {selectedStudents.size > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {exportMode === 'individual' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportSelectedStudentsHistory('pdf')}
                          className="text-xs"
                        >
                          <History className="mr-2 size-3" />
                          Export {selectedStudents.size} History as PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportSelectedStudentsHistory('doc')}
                          className="text-xs"
                        >
                          <History className="mr-2 size-3" />
                          Export {selectedStudents.size} History as DOC
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportSelectedStudentsRubric('pdf')}
                          className="text-xs"
                        >
                          <History className="mr-2 size-3" />
                          Export {selectedStudents.size} Rubric as PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportSelectedStudentsRubricCSV}
                          className="text-xs"
                        >
                          <FileText className="mr-2 size-3" />
                          Export {selectedStudents.size} Rubric as CSV
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExportCombinedAssessmentHistories('pdf')}
                          className="text-xs"
                        >
                          <History className="mr-2 size-3" />
                          Export Combined History as PDF
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleExportCombinedAssessmentHistories('doc')}
                          className="text-xs"
                        >
                          <History className="mr-2 size-3" />
                          Export Combined History as DOC
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportSelectedStudentsRubric('pdf')}
                          className="text-xs"
                        >
                          <History className="mr-2 size-3" />
                          Export {selectedStudents.size} Rubric as PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportSelectedStudentsRubricCSV}
                          className="text-xs"
                        >
                          <FileText className="mr-2 size-3" />
                          Export {selectedStudents.size} Rubric as CSV
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Filters and Search */}
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-xs text-muted-foreground">
                    Search Students
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, or class..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status-filter" className="text-xs text-muted-foreground">
                    Filter by Status
                  </Label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    aria-label='status-filter'
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="all">All Statuses</option>
                    <option value="handed_in">Handed In</option>
                    <option value="ready_for_review">Ready for Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="shared">Shared</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="class-filter" className="text-xs text-muted-foreground">
                    Filter by Class
                  </Label>
                  <select
                    id="class-filter"
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    aria-label='select-classes'
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="all">All Classes</option>
                    {uniqueClasses.map((classSection) => (
                      <option key={classSection} value={classSection}>
                        {classSection}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select All */}
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-muted/30 p-2">
                <Checkbox id="select-all" checked={selectAll} onCheckedChange={handleSelectAll} />
                <Label htmlFor="select-all" className="text-sm font-medium">
                  Select All ({filteredAssessmentRecord.length} students)
                </Label>
              </div>

              {/* Student List */}
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {filteredAssessmentRecord.map((assessmentRecord, index) => (
                  <div
                    key={assessmentRecord.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedStudents.has(assessmentRecord.id)}
                        onCheckedChange={() => handleSelectStudent(assessmentRecord.id)}
                      />
                      <span className="w-6 text-sm font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{assessmentRecord.learnerName}</span>

                        {assessmentRecord.classSection && (
                          <span className="text-xs text-muted-foreground">
                            {assessmentRecord.classSection}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(assessmentRecord.status)}`}
                      >
                        {getStatusLabel(assessmentRecord.status)}
                      </Badge>

                      {/* Individual Export History Buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleExportIndividualStudentHistory(
                              assessmentRecord,
                              assessment,
                              'pdf',
                              updateFeedbackMutation,
                              updateAssessmentMutation,
                            )
                          }
                          className="h-7 px-2 text-xs"
                          title="Export Assessment History as PDF"
                        >
                          <Download className="mr-1 size-3" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleExportIndividualStudentHistory(
                              assessmentRecord,
                              assessment,
                              'doc',
                              updateFeedbackMutation,
                              updateAssessmentMutation,
                            )
                          }
                          className="h-7 px-2 text-xs"
                          title="Export Assessment History as DOC"
                        >
                          <Download className="mr-1 size-3" />
                          DOC
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleExportIndividualStudentRubric(
                              assessmentRecord,
                              assessment,
                            )
                          }
                          className="h-7 px-2 text-xs"
                          title="Export Rubric Evaluation as PDF"
                        >
                          <FileText className="mr-1 size-3" />
                          Rubric
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredAssessmentRecord.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    No students found matching the current filters.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="shrink-0 border-t bg-muted/30 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedStudents.size > 0
                  ? `${selectedStudents.size} student(s) selected for ${exportMode === 'combined' ? 'combined' : 'individual'} history export`
                  : `Ready to export assessment history for ${filteredAssessmentRecord.length} student records`}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  <X className="mr-2 size-4" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
