'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { AssessmentTemplate } from '@/types'

interface AssessmentTemplateListRowProps {
  template: AssessmentTemplate
  basePath?: string
}

export function AssessmentTemplateListRow({
  template,
  basePath = '/backoffice/assessment-templates',
}: AssessmentTemplateListRowProps) {
  return (
    <Link
      href={`${basePath}/${template.id}`}
      className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium text-foreground">{template.title}</p>
        {template.description ? (
          <p className="line-clamp-1 text-sm text-muted-foreground">{template.description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {template.type ? <Badge variant="secondary">{template.type}</Badge> : null}
        {template.subject ? <Badge variant="outline">{template.subject}</Badge> : null}
        {template.unitCode ? <Badge variant="outline">Unit {template.unitCode}</Badge> : null}
        {typeof template.lessonNumber === 'number' ? (
          <Badge variant="outline">Lesson {template.lessonNumber}</Badge>
        ) : null}
      </div>
    </Link>
  )
}
