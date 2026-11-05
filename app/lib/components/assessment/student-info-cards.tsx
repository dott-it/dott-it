import { Card, CardContent, CardHeader, CardTitle } from '@/app/lib/components/ui/layout/card'
// import { StudentStatusBadge } from '@/app/lib/components/ui/feedback'
import { User, Calendar, FileText, MessageSquare } from 'lucide-react'
import { formatScoreForDisplay } from '@/app/lib/utils/score-format'

interface StudentInfoCardsProps {
  student: {
    name: string
    email?: string
    classSection?: string
    status: 'done' | 'ready_for_review' | 'revision_requested' | 'shared' | 'handed_in' | 'not_submitted'
    submittedAt?: string
    totalResponses?: number
    lastFeedbackDate?: string
    score?: number
    maxScore?: number
  }
  showStudentInfo: boolean
}

export function StudentInfoCards({ student, showStudentInfo }: StudentInfoCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Student Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Student Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="size-4 text-muted-foreground" />
            <span>{showStudentInfo ? student.name : 'Anonymous Student'}</span>
          </div>
          {showStudentInfo && student.email && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Email:</span>
              <span>{student.email}</span>
            </div>
          )}
          {student.classSection && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Class:</span>
              <span>{student.classSection}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Submission Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span>
              {student.submittedAt
                ? `Last submitted: ${new Date(student.submittedAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'No response submitted yet'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            <span>
              {student.totalResponses
                ? `${student.totalResponses} responses submitted`
                : 'No responses yet'}
            </span>
          </div>
          {student.lastFeedbackDate && (
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="size-4 text-muted-foreground" />
              <span>
                Last feedback:{' '}
                {new Date(student.lastFeedbackDate).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade and Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Grade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {student.score !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Grade:</span>
              <span className="font-medium">
                {formatScoreForDisplay(student.score, undefined, student.maxScore)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
