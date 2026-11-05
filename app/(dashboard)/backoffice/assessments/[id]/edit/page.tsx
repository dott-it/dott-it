'use client'

import { useState, useEffect, useMemo } from 'react'
import type { FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import {
  Card,
  CardContent,
} from '@/app/lib/components/ui/layout/card'
import { Loading } from '@/app/lib/components/ui/layout'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'
import { AssessmentEditForm } from '@/components/backoffice/assessments/assessment-edit-form'
import {
  editAssessmentSchema,
  type EditAssessmentFormState,
} from '@/app/(dashboard)/backoffice/assessments/schemas'
import { getCurrentSchoolYear, listRecentSchoolYears } from '@/lib/school-year'
import { listOpenSciEdUnitOptions } from '@/lib/openscied-unit-options'

type EditAssessmentFormErrors = Partial<Record<keyof EditAssessmentFormState, string>>

export default function EditAssessmentPage() {
  const router = useRouter()
  const params = useParams()
  const assessmentId = params.id as string
  const schoolYearOptions = useMemo(() => listRecentSchoolYears(), [])
  const unitOptions = useMemo(() => listOpenSciEdUnitOptions(), [])

  const {
    data: assessment,
    isLoading,
    error,
  } = assessmentQueries.getAssessment.useQuery({
    variables: { id: assessmentId },
    enabled: Boolean(assessmentId),
  })

  const [formData, setFormData] = useState<EditAssessmentFormState>({
    status: 'draft',
    schoolYear: getCurrentSchoolYear(),
    unitCode: '',
    dueDate: '',
    instructions: '',
    numberOfQuestions: '5',
  })
  const [formErrors, setFormErrors] = useState<EditAssessmentFormErrors>({})

  useEffect(() => {
    if (assessment) {
      const dueDate = assessment.dueAt
        ? new Date(assessment.dueAt).toISOString().slice(0, 16)
        : ''

      setFormData({
        status: (assessment.status as EditAssessmentFormState['status']) || 'draft',
        schoolYear: assessment.schoolYear || getCurrentSchoolYear(),
        unitCode: assessment.unitCode || assessment.template?.unitCode || '',
        dueDate,
        instructions: assessment.instructions || '',
        numberOfQuestions: String(assessment.numberOfQuestions || 5),
      })
    }
  }, [assessment])

  const handleInputChange = (field: keyof EditAssessmentFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const updateAssessmentMutation = assessmentQueries.updateAssessment.useMutation({
    onSuccess: () => {
      router.push(`/backoffice/assessments/${assessmentId}`)
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : 'Unknown error occurred'
      alert(`Error updating assessment: ${message}`)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const parsed = editAssessmentSchema.safeParse(formData)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setFormErrors({
        status: fieldErrors.status?.[0],
        schoolYear: fieldErrors.schoolYear?.[0],
        unitCode: fieldErrors.unitCode?.[0],
        numberOfQuestions: fieldErrors.numberOfQuestions?.[0],
        dueDate: fieldErrors.dueDate?.[0],
        instructions: fieldErrors.instructions?.[0],
      })
      return
    }

    updateAssessmentMutation.mutate({
      id: assessmentId,
      data: {
        status: parsed.data.status,
        schoolYear: parsed.data.schoolYear,
        unitCode: parsed.data.unitCode,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
        instructions: parsed.data.instructions || undefined,
        numberOfQuestions: Number.parseInt(parsed.data.numberOfQuestions, 10) || undefined,
      },
    })
  }

  const pageTitle = 'Edit Assessment'

  const breadcrumbItems = useMemo(() => {
    return [
      {
        label: assessment?.title || 'Assessment',
        href: `/backoffice/assessments/${assessmentId}`,
      },
      { label: 'Edit', isLast: true },
    ]
  }, [assessment?.title, assessmentId])

  const showEmptyState = !isLoading && (!assessment || error)

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title={pageTitle}
        subtitle={
          assessment
            ? 'Update assessment information'
            : 'Review assessment status or return to the backoffice'
        }
        breadcrumbItems={breadcrumbItems}
        onBack={() => router.push(`/backoffice/assessments/${assessmentId}`)}
        backButtonText="Back to Assessment"
      />

      {isLoading && (
        <div className="flex justify-center">
          <Loading variant="assessment" />
        </div>
      )}

      {showEmptyState && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-2 text-lg font-semibold">Assessment not found</p>
            <p className="mb-4 text-muted-foreground">
              The assessment you&apos;re trying to edit doesn&apos;t exist.
            </p>
            <Button.Outline asChild>
              <Link href="/backoffice">Back to Backoffice</Link>
            </Button.Outline>
          </CardContent>
        </Card>
      )}

      {assessment && !isLoading && (
        <AssessmentEditForm
          assessment={assessment}
          formData={formData}
          formErrors={formErrors}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isSubmitting={updateAssessmentMutation.isPending}
          schoolYearOptions={schoolYearOptions}
          unitOptions={unitOptions}
        />
      )}
    </div>
  )
}
