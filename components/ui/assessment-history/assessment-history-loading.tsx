'use client'

import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { AssessmentHistoryAvatar } from './assessment-history-avatar'

export function AssessmentHistoryLoading() {
  return (
    <div className="flex justify-end gap-4">
      <Card className="border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="flex space-x-1">
              <div className="size-2 animate-bounce rounded-full bg-muted-foreground"></div>
              <div
                className="size-2 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="size-2 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
            <span className="text-sm text-muted-foreground">Assistant is thinking...</span>
          </div>
        </CardContent>
      </Card>
      <AssessmentHistoryAvatar type="assistant" />
    </div>
  )
}
