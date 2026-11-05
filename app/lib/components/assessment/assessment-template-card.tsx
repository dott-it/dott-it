'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Badge } from '@/components/ui/badge'
import { AssessmentTemplate } from '@/types'

interface AssessmentTemplateCardProps {
  template: AssessmentTemplate
  basePath?: string
  className?: string
}

export function AssessmentTemplateCard({
  template,
  basePath = '/backoffice/assessment-templates',
  className,
}: AssessmentTemplateCardProps) {
  return (
    <Link href={`${basePath}/${template.id}`} className="block h-full">
      <Card className={`h-full transition-all duration-200 hover:border-border/80 hover:shadow-md ${className ?? ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-1">{template.title}</CardTitle>
          {template.description && (
            <CardDescription className="line-clamp-2">{template.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {template.type && <Badge variant="secondary">{template.type}</Badge>}
            {template.subject && <Badge variant="outline">{template.subject}</Badge>}
            {template.gradeLevel && <Badge variant="outline">Grade {template.gradeLevel}</Badge>}
            {template.unitCode && <Badge variant="outline">Unit {template.unitCode}</Badge>}
            {typeof template.lessonNumber === 'number' && (
              <Badge variant="outline">Lesson {template.lessonNumber}</Badge>
            )}
          </div>
        </CardContent>
        {/* Do not render an inner link/button to avoid nested anchors */}
      </Card>
    </Link>
  )
}


