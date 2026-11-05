import React, { ReactNode } from 'react'
import { GenericPageHeader } from '@/app/lib/components/ui/layout'
import { studentResponseBackHref } from '@/app/lib/assessment/assessment-detail-tab'
import { ActiveAssessment } from '@/types'

export interface StudentAssessmentHeaderProps {
  assessment: ActiveAssessment
  studentName: string
  onBack: () => void
  actions?: ReactNode
}

export function StudentAssessmentHeader({
  assessment,
  studentName,
  onBack,
  actions,
}: StudentAssessmentHeaderProps) {
  const breadcrumbItems = [
    { label: 'Workspace', href: '/workspace' },
    { label: 'Assessments', href: '/workspace/assessments' },
    {
      label: assessment?.title ?? 'Assessment',
      href: assessment?.id ? studentResponseBackHref(assessment.id) : undefined,
    },
    { label: studentName ?? 'Student', isLast: true },
  ]

  return (
    <GenericPageHeader
      breadcrumbItems={breadcrumbItems}
      showBackButton={true}
      onBack={onBack}
      backButtonText="Back"
      actions={actions}
    />
  )
}
