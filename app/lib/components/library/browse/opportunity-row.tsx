import Link from 'next/link'
import { getOpportunityMarkerClass, browseActivityElementId } from '@/lib/library/browse'
import type { TeOpportunityBrowseItem } from '@/lib/library/browse'
import { opportunityDetailPath } from '@/lib/library/browse/paths'
import { cn } from '@/lib/utils'

interface OpportunityRowProps {
  opportunity: TeOpportunityBrowseItem
  grade: number
  unitCode: string
  focused?: boolean
}

export function OpportunityRow({
  opportunity,
  grade,
  unitCode,
  focused = false,
}: OpportunityRowProps) {
  const href = opportunityDetailPath(grade, unitCode, opportunity.slug)

  return (
    <Link
      id={browseActivityElementId('opportunity', opportunity.slug)}
      href={href}
      className={cn(
        'group block rounded-md py-1.5 pl-5 transition-colors hover:bg-accent/20',
        focused && 'bg-accent/50 ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <p className="font-semibold text-foreground group-hover:underline">{opportunity.title}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className={cn('size-2 shrink-0', getOpportunityMarkerClass())} aria-hidden />
        <span>Assessment opportunity · {opportunity.categoryLabel}</span>
      </p>
    </Link>
  )
}
