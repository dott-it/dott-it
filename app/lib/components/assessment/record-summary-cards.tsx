'use client'

import { MessageSquare, Calendar, Clock, Users } from 'lucide-react'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { SmartDate } from '@/app/lib/components/ui/feedback'

// Helper function to format response number (1st, 2nd, 3rd, etc.)
const formatResponseNumber = (num: number): string => {
  if (num === 0) return 'No responses'
  
  const lastDigit = num % 10
  const lastTwoDigits = num % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th Response`
  }
  
  switch (lastDigit) {
    case 1: {
      return `${num}st Response`
    }
    case 2: {
      return `${num}nd Response`
    }
    case 3: {
      return `${num}rd Response`
    }
    default: {
      return `${num}th Response`
    }
  }
}

// Helper function to get grid classes based on card count
const getGridClasses = (count: number): string => {
  switch (count) {
    case 1: {
      return "grid gap-4 grid-cols-1"
    }
    case 2: {
      return "grid gap-4 md:grid-cols-2"
    }
    case 3: {
      return "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    }
    case 4: {
      return "grid gap-4 md:grid-cols-2 lg:grid-cols-4"
    }
    default: {
      // For more than 4 cards, use a flexible grid
      return "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    }
  }
}

interface RecordSummaryCardsProps {
  studentName: string
  studentEmail?: string
  classSection?: string
  totalResponses?: number
  currentResponseNumber?: number
  submittedAt?: string
  lastFeedbackDate: string | null
  showStudentInfo: boolean
}

export function RecordSummaryCards({
  classSection,
  totalResponses,
  currentResponseNumber,
  submittedAt,
  lastFeedbackDate,
}: RecordSummaryCardsProps) {

  // Calculate the number of cards that will be rendered
  const cardCount = [
    classSection, // Class Section card
    true, // Current Response card (always shown)
    true, // Last Submitted card (always shown)
    lastFeedbackDate // Last Feedback card (conditional)
  ].filter(Boolean).length

  return (
    <div className={getGridClasses(cardCount)}>
      {/* Class Section */}
      {classSection && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="size-5 shrink-0 text-orange-600" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-muted-foreground">Class</p>
                <p className="truncate font-medium">
                  {classSection}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Response */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-muted-foreground">Responses</p>
              <p className="truncate font-medium">
                {currentResponseNumber ? formatResponseNumber(currentResponseNumber) : 'No responses'}
              </p>
              {totalResponses && totalResponses > 1 && (
                <p className="text-xs text-muted-foreground">
                  {totalResponses} total submissions
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Submitted */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-muted-foreground">Last Submitted</p>
              <p className="truncate font-medium">
                {submittedAt ? <SmartDate date={submittedAt} includeTime /> : 'Not submitted'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Feedback */}
      {lastFeedbackDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="size-5 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-muted-foreground">Last Feedback</p>
                <p className="truncate text-sm font-medium">
                  <SmartDate date={lastFeedbackDate} includeTime />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
