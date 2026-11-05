'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Eye, MessageSquare, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMemo, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from './ui/switch'
import { formatScoreForDisplay } from '@/app/lib/utils/score-format'

interface AssessmentRecord {
  id: string
  assessmentId: string
  studentName: string
  studentId: string
  className?: string | null
  teacherName?: string | null
  status: string
  submittedDate: string
  score?: number
  maxScore?: number
  reviewedDate?: string
  flagged: boolean
  feedback: Array<{
    type: string
    section: string
    content: string
  }>
  content?: string
}

interface StudentRecordListProps {
  records: AssessmentRecord[]
}

const pseudonymsColor = [
  'Red ',
  'Blue',
  'Silver',
  'Golden',
  'Green',
  'Purple',
  'Orange',
  'Yellow',
  'Indigo',
  'Crimson',
]
const pseudonymsAnimal = [
  'Panda',
  'Whale',
  'Fox',
  'Eagle',
  'Turtle',
  'Finch',
  'Tiger',
  'Canary',
  'Shark',
  'Otter',
]

function getPseudonym(id: string) {
  const hash = [...id].reduce((acc, char) => acc + (char.codePointAt(0) ?? 0), 0)
  return `${pseudonymsColor[hash % pseudonymsColor.length]} ${
    pseudonymsAnimal[hash % pseudonymsAnimal.length]
  }`
}

export function AssessmentRecordList({ records }: StudentRecordListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'student' | 'status' | 'submittedDate'>('student')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showNames, setShowNames] = useState(false)
  const [classFilter, setClassFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const depeersonilizedRecords = records.map((record) => {
    return { ...record, studentName: getPseudonym(record.studentId) }
  })

  const classOptions = [...new Set(records.map((r) => r.className).filter(Boolean))] as string[]

  const sortedRecords = useMemo(() => {
    return (showNames ? records : depeersonilizedRecords)
      .filter((record) => {
        const matchesSearch =
          record.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
        const matchesClass = classFilter === 'all' || record.className === classFilter
        const matchesStatus = statusFilter === 'all' || record.status === statusFilter
        return matchesSearch && matchesClass && matchesStatus
      })
      .sort((a, b) => sortAssesments(a, b, sortField, sortDirection))
  }, [
    depeersonilizedRecords,
    searchTerm,
    sortField,
    sortDirection,
    showNames,
    classFilter,
    statusFilter,
    records,
  ])

  const handedInCount = records.filter((r) => r.status === 'handed_in').length
  const readyForReviewCount = records.filter((r) => r.status === 'ready_for_review').length
  const inProgressCount = records.filter((r) => r.status === 'in_progress').length
  const sharedCount = records.filter((r) => r.status === 'shared').length
  const progressPercent = records.length > 0 ? (sharedCount / records.length) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Records</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search and Sort Controls */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[150px] flex-1">
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                aria-label="Search students"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Show me</span>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>records that are</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent 
                    aria-label='status-filter'
                >
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="handed_in">Handed In</SelectItem>
                  <SelectItem value="ready_for_review">Ready for Review</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Switch id="show-names" checked={showNames} onCheckedChange={setShowNames} />
              <label htmlFor="show-names" className="text-sm">
                Show Names
              </label>
            </div>
            <Select
              value={sortField}
              onValueChange={(value: 'student' | 'status' | 'submittedDate') => setSortField(value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="submittedDate">Submitted Date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          {/* Progress Overview */}
          <div
            className="grid gap-4 md:grid-cols-5"
            role="status"
            aria-live="polite"
            aria-label="Assessment record counts"
          >
            <div className="text-center">
              <div className="text-2xl font-bold">{records.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sharedCount}</div>
              <div className="text-sm text-muted-foreground">Shared</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{readyForReviewCount}</div>
              <div className="text-sm text-muted-foreground">Ready for Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{inProgressCount}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{handedInCount}</div>
              <div className="text-sm text-muted-foreground">Handed In</div>
            </div>
          </div>

          <Progress value={progressPercent} className="h-2" />

          <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
            Showing {sortedRecords.length} of {records.length} record
            {records.length === 1 ? '' : 's'}
          </p>

          {/* Records Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.studentName}</TableCell>
                  <TableCell className="font-medium">{record.className ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 capitalize">
                      <Badge
                        variant={
                          (record.status === 'shared'
                            ? 'default'
                            : (record.status === 'in_progress'
                            ? 'secondary'
                            : 'outline'))
                        }
                      >
                        {record.status}
                      </Badge>
                      {record.flagged && <Star className="size-4 text-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell>{record.submittedDate || '—'}</TableCell>
                  <TableCell>
                    {formatScoreForDisplay(record.score, undefined, record.maxScore)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" asChild>
                        <Link href={`/workspace/assessments/${record.assessmentId}/${record.id}`}>
                          <Eye className="mr-1 size-4" />
                          Review
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Add Feedback</DropdownMenuItem>
                          <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function sortAssesments(
  a: AssessmentRecord,
  b: AssessmentRecord,
  sortField: string,
  sortDirection: 'asc' | 'desc',
) {
  if (sortField === 'student') {
    const nameA = a.studentName || ''
    const nameB = b.studentName || ''
    return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
  }

  if (sortField === 'status') {
    return sortDirection === 'asc'
      ? a.status.localeCompare(b.status)
      : b.status.localeCompare(a.status)
  }

  if (sortField === 'submittedDate') {
    return sortDirection === 'asc'
      ? a.submittedDate.localeCompare(b.submittedDate)
      : b.submittedDate.localeCompare(a.submittedDate)
  }

  return 0
}
