import React from 'react'
import { Typography } from '../typography'
import { AssessmentFeedbackCard } from './assessment-card'
import { Assessment } from '@/types'

interface AssessmentCollectionProps {
  title: string
  assessments: Assessment[]
  getAssessmentHref?: (assessment: Assessment) => string
  className?: string
}

export function AssessmentCollection({
  title,
  assessments,
  getAssessmentHref,
  className,
}: AssessmentCollectionProps) {
  if (assessments.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <Typography variant="h2" className="mb-8">
        {title}
      </Typography>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assessments.map((assessment) => (
          <AssessmentFeedbackCard
            key={assessment.id}
            assessment={assessment}
            href={getAssessmentHref?.(assessment)}
          />
        ))}
      </div>
    </div>
  )
}
