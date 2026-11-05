'use client'

import { Button } from '@/components/ui/button'
import type { BrowseViewMode } from '@/lib/library/browse'
import { cn } from '@/lib/utils'

interface BrowseViewToggleProps {
  value: BrowseViewMode
  onChange: (value: BrowseViewMode) => void
  assessmentCount: number
  opportunityCount: number
}

export function BrowseViewToggle({
  value,
  onChange,
  assessmentCount,
  opportunityCount,
}: BrowseViewToggleProps) {
  const combinedCount = assessmentCount + opportunityCount

  return (
    <div className="inline-flex rounded-lg border p-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(value === 'all' && 'bg-accent text-accent-foreground')}
        onClick={() => onChange('all')}
      >
        Assessments &amp; opportunities ({combinedCount})
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(value === 'assessments-only' && 'bg-accent text-accent-foreground')}
        onClick={() => onChange('assessments-only')}
      >
        Assessments only ({assessmentCount})
      </Button>
    </div>
  )
}
