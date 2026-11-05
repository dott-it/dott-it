'use client'

import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Play } from 'lucide-react'

interface ThematicAnalysisHeaderProps {
  responsesCount: number
  onRerun: () => void
  isRerunning: boolean
  hasExistingAnalysis: boolean
}

export function ThematicAnalysisHeader({
  responsesCount,
  onRerun,
  isRerunning,
  hasExistingAnalysis,
}: ThematicAnalysisHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <span className="text-sm">💡</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">What Students Are Working On</h2>
          <p className="text-sm text-muted-foreground">
            Key concepts and common patterns across student responses
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {responsesCount} Student Responses
        </span>
      </div>

      <Button
        type="button"
        onClick={onRerun}
        disabled={isRerunning}
        className="bg-green-600 text-white hover:bg-green-700"
        size="sm"
      >
        <Play className="mr-1.5 size-4" />
        {hasExistingAnalysis ? 'Re-run analysis' : 'Run analysis'}
      </Button>
    </div>
  )
}
