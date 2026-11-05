'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LessonContextExpandProps {
  lessonNumber: number
  topic: string
  pacingDays?: number
  drivingQuestion?: string
}

export function LessonContextExpand({
  lessonNumber,
  topic,
  pacingDays,
  drivingQuestion,
}: LessonContextExpandProps) {
  const [expanded, setExpanded] = useState(false)

  if (!drivingQuestion) {
    return (
      <div>
        <p className="line-clamp-2 font-medium text-foreground">{topic}</p>
        {pacingDays ? (
          <p className="text-xs text-muted-foreground">length: {pacingDays} days</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        className="h-auto justify-start gap-1.5 px-0 py-0 text-left font-medium text-foreground hover:bg-transparent hover:text-foreground"
        aria-expanded={expanded}
        aria-controls={`lesson-${lessonNumber}-context`}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className={cn(!expanded && 'line-clamp-2')}>{topic}</span>
      </Button>
      {pacingDays ? (
        <p className="pl-5 text-xs text-muted-foreground">length: {pacingDays} days</p>
      ) : null}
      {expanded ? (
        <p id={`lesson-${lessonNumber}-context`} className="pl-5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Driving question: </span>
          {drivingQuestion}
        </p>
      ) : null}
    </div>
  )
}
