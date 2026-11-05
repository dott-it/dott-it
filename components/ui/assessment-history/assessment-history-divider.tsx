'use client'

import { SmartDate } from '@/app/lib/components/ui/feedback'

interface AssessmentHistoryDividerProps {
  date: string
}

export function AssessmentHistoryDivider({ date }: AssessmentHistoryDividerProps) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1 border-t border-border" />
      <div className="text-xs font-medium text-muted-foreground">
        {date === 'Unknown date' ? 'Unknown date' : <SmartDate date={date} includeTime />}
      </div>
      <div className="flex-1 border-t border-border" />
    </div>
  )
}
