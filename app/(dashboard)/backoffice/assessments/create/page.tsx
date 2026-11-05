'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { assessmentTemplateQueries } from '@/app/lib/services/assessment-templates/assessment-template.queries'
import { assessmentQueries } from '@/app/lib/services/assesssments/assessment.queries'
import { tenantQueries, tenantTeachersQueries } from '@/app/lib/services/tenants/tenant.queries'
import type { AssessmentTemplate } from '@/types'
import { createAssessmentSchema, type CreateAssessmentFormState } from '../schemas'
import { AssessmentCreateForm } from '@/components/backoffice/assessments/assessment-create-form'
import { getCurrentSchoolYear, listRecentSchoolYears } from '@/lib/school-year'
import { listOpenSciEdUnitOptions } from '@/lib/openscied-unit-options'

type CreateAssessmentFormErrors = Partial<Record<keyof CreateAssessmentFormState, string>>

export default function CreateAssessmentPage() {
  const router = useRouter()
  const schoolYearOptions = useMemo(() => listRecentSchoolYears(), [])
  const unitOptions = useMemo(() => listOpenSciEdUnitOptions(), [])

  const [formData, setFormData] = useState<CreateAssessmentFormState>({
    templateId: '',
    tenantId: '',
    assignedBy: '',
    assignedTo: '',
    schoolYear: getCurrentSchoolYear(),
    unitCode: '',
    dueDate: '',
    instructions: '',
    status: 'draft',
    submissionUrl: '',
    googleFormId: '',
    numberOfQuestions: '5',
  })
  const [formErrors, setFormErrors] = useState<CreateAssessmentFormErrors>({})

  const templatesQuery = assessmentTemplateQueries.list.useQuery()
  const tenantsQuery = tenantQueries.list.useQuery()
  const tenantTeachersQuery = tenantTeachersQueries.list.useQuery({
    variables: { tenantId: formData.tenantId },
    enabled: Boolean(formData.tenantId),
  })

  const createAssessmentMutation = assessmentQueries.createAssessment.useMutation({
    onSuccess: (response) => {
      router.push(`/backoffice/assessments/${response.assessment.id}`)
    },
    onError: (error: unknown) => {
      let message = 'Error creating assessment'
      if (error instanceof Error) {
        message = error.message || message
      } else if (typeof error === 'string') {
        message = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        message = String((error as { message: unknown }).message) || message
      }
      alert(message || 'An unexpected error occurred while creating the assessment')
    },
  })

  const handleInputChange = (field: keyof CreateAssessmentFormState, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'tenantId' && value !== prev.tenantId) {
        next.assignedBy = ''
      }
      if (field === 'templateId') {
        const template = (templatesQuery.data ?? []).find((item) => item.id === value) as
          | AssessmentTemplate
          | undefined
        next.unitCode = template?.unitCode || ''
      }
      return next
    })
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    const parsedResult = createAssessmentSchema.safeParse(formData)

    if (!parsedResult.success) {
      const fieldErrors = parsedResult.error.flatten().fieldErrors
      setFormErrors({
        templateId: fieldErrors.templateId?.[0],
        tenantId: fieldErrors.tenantId?.[0],
        assignedBy: fieldErrors.assignedBy?.[0],
        assignedTo: fieldErrors.assignedTo?.[0],
        schoolYear: fieldErrors.schoolYear?.[0],
        unitCode: fieldErrors.unitCode?.[0],
        status: fieldErrors.status?.[0],
        numberOfQuestions: fieldErrors.numberOfQuestions?.[0],
        dueDate: fieldErrors.dueDate?.[0],
        instructions: fieldErrors.instructions?.[0],
        submissionUrl: fieldErrors.submissionUrl?.[0],
        googleFormId: fieldErrors.googleFormId?.[0],
      })
      return
    }

    createAssessmentMutation.mutate({
      templateId: parsedResult.data.templateId,
      tenantId: parsedResult.data.tenantId,
      assignedBy: parsedResult.data.assignedBy,
      assignedTo: parsedResult.data.assignedTo,
      schoolYear: parsedResult.data.schoolYear,
      unitCode: parsedResult.data.unitCode,
      dueDate:
        parsedResult.data.dueDate && parsedResult.data.dueDate.length > 0
          ? new Date(parsedResult.data.dueDate).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      instructions: parsedResult.data.instructions || '',
      status: parsedResult.data.status,
      submissionUrl: parsedResult.data.submissionUrl || null,
      googleFormId: parsedResult.data.googleFormId || null,
      numberOfQuestions: Number.parseInt(parsedResult.data.numberOfQuestions, 10),
    })
  }

  const templates = (templatesQuery.data ?? []) as AssessmentTemplate[]
  const teachers = tenantTeachersQuery.data?.teachers ?? []
  const tenants = tenantsQuery.data ?? []

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title="Create New Assessment"
        subtitle="Set up a new assessment for your students"
        breadcrumbItems={[{ label: 'Create Assessment', isLast: true }]}
      />

      <AssessmentCreateForm
        formData={formData}
        formErrors={formErrors}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isSubmitting={createAssessmentMutation.isPending}
        templates={templates}
        teachers={teachers}
        tenants={tenants}
        schoolYearOptions={schoolYearOptions}
        unitOptions={unitOptions}
        templatesLoading={templatesQuery.isLoading}
        teachersLoading={tenantTeachersQuery.isLoading}
        tenantsLoading={tenantsQuery.isLoading}
      />
    </div>
  )
}
