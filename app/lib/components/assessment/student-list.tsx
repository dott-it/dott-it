import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/lib/components/ui/layout/card'
import { SmartDate } from '@/app/lib/components/ui/feedback'
import { DataTable, Column } from '@/app/lib/components/ui/layout'

import { Search, Users, Eye, EyeOff, Download } from 'lucide-react'
import { buildStudentDetailUrl } from '@/app/lib/assessment/student-response-navigation'
import { getStudentDisplayName } from '@/app/lib/utils/student-display-name'
import { AssessmentRecord, AssessmentRecordStatus } from '@/types'

/** Get initials from display name (e.g. "Emma Johnson" -> "EJ"). */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] ?? '').toUpperCase() + (parts[1][0] ?? '').toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || '?'
}

const STATUS_DOT_COLOR: Record<string, string> = {
  ready_for_review: 'bg-blue-500',
  in_progress: 'bg-yellow-500',
  shared: 'bg-green-500',
  handed_in: 'bg-orange-500',
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ready_for_review: 'Ready for Review',
    in_progress: 'In Progress',
    shared: 'Shared',
    handed_in: 'Handed In',
  }
  return labels[status] ?? status
}

interface StudentListProps {
  assessmentRecords: AssessmentRecord[]
  externalStatusFilter?: string
  onFilterChange?: (status: string) => void
  assessmentId?: string
  showRealNames?: boolean
  onToggleNames?: () => void
  /** When true and onExport is provided, shows an Export button in the filters row (e.g. next to All Classes). */
  showExportButton?: boolean
  onExport?: () => void
}

export function StudentList({
  assessmentRecords,
  externalStatusFilter,
  onFilterChange,
  assessmentId,
  showRealNames = false,
  onToggleNames,
  showExportButton = false,
  onExport,
}: StudentListProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const itemsPerPage = 10

  // Extract unique classes from assessment records
  const availableClasses = React.useMemo(() => {
    const classes = new Set<string>()
    for (const record of assessmentRecords) {
      if (record.classSection) {
        classes.add(record.classSection)
      }
    }
    return [...classes].sort()
  }, [assessmentRecords])

  // Sync with external filter
  useEffect(() => {
    if (externalStatusFilter) {
      setStatusFilter(externalStatusFilter)
      setCurrentPage(1)
    }
  }, [externalStatusFilter])

  // Helper function to get display name (moved to outer scope)
  const getDisplayName = useCallback(
    (record: AssessmentRecord) =>
      getStudentDisplayName({
        showRealNames,
        learnerName: record.learnerName,
        learnerId: record.learnerId,
      }),
    [showRealNames],
  )

  // Define table columns (reference: Student with avatar, Class, Status dot+text, Last Action date + "View >"; whole row clickable)
  const columns: Column<AssessmentRecord>[] = React.useMemo(() => [
    {
      key: 'name',
      header: 'Student',
      sortable: true,
      sortFunction: (a, b) => {
        const nameA = getDisplayName(a)
        const nameB = getDisplayName(b)
        return nameA.localeCompare(nameB)
      },
      cell: (student) => {
        const displayName = getStudentDisplayName({
          showRealNames,
          learnerName: student.learnerName,
          learnerId: student.learnerId,
        })
        const initials = getInitials(displayName)
        return (
          <div className="flex items-center gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
              aria-hidden
            >
              {initials}
            </div>
            <span className="font-medium">{displayName}</span>
          </div>
        )
      },
    },
    {
      key: 'class',
      header: 'Class',
      sortable: true,
      sortFunction: (a, b) => (a.classSection || '').localeCompare(b.classSection || ''),
      cell: (student) => (
        <span className="text-muted-foreground">{student.classSection ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortFunction: (a, b) => {
        const statusOrder = {
          'handed_in': 1,
          'ready_for_review': 2,
          'in_progress': 3,
          'shared': 4
        }
        const orderA = statusOrder[a.status as keyof typeof statusOrder] || 5
        const orderB = statusOrder[b.status as keyof typeof statusOrder] || 5
        return orderA - orderB
      },
      cell: (student) => {
        const status = student.status as AssessmentRecordStatus
        const dotColor = STATUS_DOT_COLOR[status] ?? 'bg-muted-foreground'
        const label = getStatusLabel(status)
        return (
          <span className="flex items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${dotColor}`} aria-hidden />
            <span className="text-sm">{label}</span>
          </span>
        )
      },
    },
    {
      key: 'lastAction',
      header: 'Last Action',
      sortable: true,
      sortFunction: (a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime()
        const dateB = new Date(b.updatedAt || 0).getTime()
        return dateA - dateB
      },
      cell: (student) => (
        <span className="text-sm text-muted-foreground">
          {student.updatedAt ? <SmartDate date={student.updatedAt} includeTime={false} /> : '-'}
        </span>
      ),
    },
    {
      key: 'view',
      header: '',
      sortable: false,
      className: 'w-0 text-right',
      cell: () => (
        <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">View &gt;</span>
      ),
    },
  ], [showRealNames, getDisplayName])

  const getStudentDetailUrl = useCallback(
    (student: AssessmentRecord) =>
      buildStudentDetailUrl(student, assessmentId, {
        statusFilter,
        classFilter,
        searchTerm,
        sortColumn,
        sortDirection,
      }),
    [assessmentId, statusFilter, classFilter, searchTerm, sortColumn, sortDirection],
  )

  // Filter students
  const filteredStudents = assessmentRecords.filter((student) => {
    const matchesSearch = (student.learnerName||'').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    const matchesClass = classFilter === 'all' || student.classSection === classFilter
    return matchesSearch && matchesStatus && matchesClass
  })

  // Sort students
  const sortedStudents = React.useMemo(() => {
    if (!sortColumn) return filteredStudents

    const column = columns.find(col => col.key === sortColumn)
    if (!column?.sortFunction) return filteredStudents

    return [...filteredStudents].sort((a, b) => {
      const result = column.sortFunction!(a, b)
      return sortDirection === 'asc' ? result : -result
    })
  }, [filteredStudents, sortColumn, sortDirection, columns])

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage)
  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  // Reset to first page when filters change
  const handleFilterChange = (newFilter: string, filterType: 'status' | 'class') => {
    setCurrentPage(1)
    if (filterType === 'status') {
      setStatusFilter(newFilter)
      if (onFilterChange) {
        onFilterChange(newFilter)
      }
    } else {
      setClassFilter(newFilter)
    }
  }

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortFunction) return

    setCurrentPage(1) // Reset to first page when sorting

    if (sortColumn === columnKey) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, default to ascending
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Records</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-2">
            {onToggleNames && (
              <Button
                variant="outline"
                size="icon"
                onClick={onToggleNames}
                aria-label={showRealNames ? 'Hide names' : 'Show names'}
                title={showRealNames ? 'Hide names' : 'Show names'}
                className="shrink-0"
              >
                {showRealNames ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            )}
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                aria-label='search-student'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              aria-label='status-filter'
              onChange={(e) => handleFilterChange(e.target.value, 'status')}
              className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="handed_in">Handed In</option>
              <option value="ready_for_review">Ready for Review</option>
              <option value="in_progress">In Progress</option>
              <option value="shared">Shared</option>
            </select>
            <select
              value={classFilter}
              onChange={(e) => handleFilterChange(e.target.value, 'class')}
              className="rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label='select-classes'
            >
              <option value="all">All Classes</option>
              {availableClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
            {showExportButton && onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="shrink-0"
                aria-label="Export assessment data"
              >
                <Download className="mr-2 size-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Student Table */}
        <DataTable
          data={paginatedStudents}
          columns={columns}
          sortable={true}
          externalPagination={true}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyText={
            assessmentRecords.length === 0
              ? 'No student submissions yet. Students will submit their responses.'
              : 'No students match your current filters.'
          }
          emptyIcon={<Users className="mx-auto size-8 text-muted-foreground" />}
          rowHoverClassName="hover:bg-green-50 dark:hover:bg-green-950/20"
          onRowClick={(student) => {
            const url = getStudentDetailUrl(student)
            if (url) router.push(url)
          }}
          getRowAriaLabel={(record) => `View submission for ${getDisplayName(record)}`}
        />

        {/* External Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedStudents.length)} to{' '}
              {Math.min(currentPage * itemsPerPage, sortedStudents.length)} of {sortedStudents.length} students
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
