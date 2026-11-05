import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getCategorySwatchClass, browseActivityElementId } from '@/lib/library/browse'
import type { AssessmentBrowseItem } from '@/lib/library/browse'
import { assessmentDetailPath } from '@/lib/library/browse/paths'
import { cn } from '@/lib/utils'

interface AssessmentRowProps {
  assessment: AssessmentBrowseItem
  grade: number
  unitCode: string
  focused?: boolean
}

export function AssessmentRow({ assessment, grade, unitCode, focused = false }: AssessmentRowProps) {
  const href = assessmentDetailPath(grade, unitCode, assessment.slug)

  return (
    <Link
      id={browseActivityElementId('assessment', assessment.slug)}
      href={href}
      className={cn(
        'group flex min-w-0 w-full items-start gap-3 rounded-md py-1.5 transition-colors hover:bg-accent/40',
        focused && 'bg-accent/50 ring-2 ring-primary ring-offset-2 ring-offset-background',
      )}
    >
      <span
        className={cn('mt-1.5 size-2.5 shrink-0', getCategorySwatchClass(assessment.category))}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="break-words font-semibold text-emerald-700 group-hover:underline dark:text-emerald-400">
          {assessment.title}
        </p>
        <p className="text-sm text-muted-foreground">
          Assessment · {assessment.categoryLabel}
        </p>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-emerald-700/70 group-hover:text-emerald-700 dark:text-emerald-400" />
    </Link>
  )
}
