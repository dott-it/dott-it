'use client'

import { MessageSquare } from 'lucide-react'
import { Card, CardHeader } from '@/app/lib/components/ui/layout/card'

interface AssessmentHistoryHeaderProps {
  title?: string
}

export function AssessmentHistoryHeader({
  title = 'Assessment History',
}: AssessmentHistoryHeaderProps) {
  return (
    <Card className="relative rounded-t-lg border-t bg-muted/50">
      <CardHeader className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          <h2 className="text-base font-semibold lg:text-lg">{title}</h2>
        </div>
      </CardHeader>
    </Card>
  )
}
