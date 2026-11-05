'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { getOpportunityMarkerClass } from '@/lib/library/browse'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OpportunitySummaryRowProps {
  count: number
  expanded: boolean
  onToggle: () => void
}

export function OpportunitySummaryRow({ count, expanded, onToggle }: OpportunitySummaryRowProps) {
  if (count === 0) {
    return null
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto w-full justify-start gap-2 px-0 py-1 text-xs font-normal text-muted-foreground/80 hover:bg-transparent hover:text-muted-foreground"
      onClick={onToggle}
    >
      {expanded ? <ChevronDown className="size-3.5 shrink-0" /> : <ChevronRight className="size-3.5 shrink-0" />}
      <span className={cn('size-2 shrink-0', getOpportunityMarkerClass())} aria-hidden />
      <span>
        {count} assessment {count === 1 ? 'opportunity' : 'opportunities'}
      </span>
      <span className="text-[11px] text-muted-foreground/70">{expanded ? 'Hide' : 'Show'}</span>
    </Button>
  )
}
