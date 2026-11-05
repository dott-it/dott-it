'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { Loading } from '@/app/lib/components/ui/layout'
import { assessmentTemplateQueries } from '@/app/lib/services/assessment-templates/assessment-template.queries'
import { AssessmentTemplateEditForm } from '@/components/backoffice/assessment-templates/assessment-template-edit-form'
import {
  abortSignalWithTimeout,
  applyTemplateDraftToForm,
  isAbortError,
  isTemplateContentField,
  isTimeoutAbort,
  type TemplateContentField,
  type TemplateDraftFields,
} from '@/components/backoffice/assessment-templates/apply-template-draft'
import {
  lessonFieldError,
  savedTemplateStructureMatches,
} from '@/components/backoffice/assessment-templates/lesson-field-error'
import { applyEditStructureChange } from '@/components/backoffice/assessment-templates/template-edit-structure'
import {
  gradeNumberForUnit,
  useOpenSciEdUnitLessons,
} from '@/components/backoffice/assessment-templates/use-openscied-unit-lessons'
import { gradeLevelForUnitCode } from '@/lib/openscied-unit-options'

export default function EditAssessmentTemplatePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const templateId = params.id as string

  const [formErrors, setFormErrors] = useState<{ lessonNumber?: string }>({})
  const [hydrateLesson, setHydrateLesson] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [answerKeyWarning, setAnswerKeyWarning] = useState<string | null>(null)
  const dirtyFieldsRef = useRef(new Set<TemplateContentField>())
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    curriculumTeachersEdition: '',
    curriculumAnswerKey: '',
    subject: '',
    gradeLevel: '',
    unitCode: '',
    lessonNumber: '',
  })

  const { lessonOptions, lessonsLoading, catalogReady, lessonsError } = useOpenSciEdUnitLessons(
    formData.unitCode,
  )

  const { data: template, isLoading, error } = assessmentTemplateQueries.detail.useQuery({
    variables: { id: templateId },
    enabled: Boolean(templateId),
  })
  const templateHasUnit = Boolean(template?.unitCode)
  const savedStructure = {
    title: template?.title || '',
    type: template?.type || '',
    description: template?.description || '',
    curriculumTeachersEdition: template?.curriculumTeachersEdition || '',
    curriculumAnswerKey: template?.curriculumAnswerKey || '',
    subject: template?.subject || '',
    gradeLevel: template?.gradeLevel || '',
    unitCode: template?.unitCode || '',
    lessonNumber: typeof template?.lessonNumber === 'number' ? String(template.lessonNumber) : '',
  }
  const structureUnchanged = savedTemplateStructureMatches({
    unitCode: formData.unitCode,
    lessonNumber: formData.lessonNumber,
    savedUnitCode: savedStructure.unitCode,
    savedLessonNumber: savedStructure.lessonNumber,
  })

  const updateTemplateMutation = assessmentTemplateQueries.update.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: assessmentTemplateQueries.getKey(),
      })
      router.push(`/backoffice/assessment-templates/${templateId}`)
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : 'Unknown error occurred'
      alert(`Error updating template: ${message}`)
    },
  })

  useEffect(() => {
    if (!formData.unitCode) {
      return
    }
    const structureMessage = lessonFieldError({
      unitCode: formData.unitCode,
      lessonNumber: formData.lessonNumber,
      lessonOptions,
      lessonsLoading,
      catalogReady,
      savedUnitCode: savedStructure.unitCode,
      savedLessonNumber: savedStructure.lessonNumber,
    })
    const unchanged = savedTemplateStructureMatches({
      unitCode: formData.unitCode,
      lessonNumber: formData.lessonNumber,
      savedUnitCode: savedStructure.unitCode,
      savedLessonNumber: savedStructure.lessonNumber,
    })
    const browseBlocked =
      Boolean(lessonsError) && !unchanged && !formData.lessonNumber.trim()
    const message = browseBlocked ? undefined : structureMessage
    setFormErrors((prev) => {
      if (!message) {
        return prev.lessonNumber ? {} : prev
      }
      if (prev.lessonNumber === message) {
        return prev
      }
      return { lessonNumber: message }
    })
  }, [
    formData.unitCode,
    formData.lessonNumber,
    lessonOptions,
    lessonsLoading,
    catalogReady,
    savedStructure.unitCode,
    savedStructure.lessonNumber,
    lessonsError,
  ])

  useEffect(() => {
    if (!hydrateLesson) {
      setDraftLoading(false)
      return
    }

    const unitCode = formData.unitCode.trim()
    const lessonNumber = formData.lessonNumber.trim()
    if (!unitCode || !lessonNumber) {
      setDraftLoading(false)
      setAnswerKeyWarning(null)
      return
    }

    const grade = gradeNumberForUnit(unitCode)
    if (grade === null) {
      setDraftLoading(false)
      setDraftError(
        'Could not load curriculum for this lesson. You can fill the fields manually or try another unit/lesson.',
      )
      return
    }

    const controller = new AbortController()
    const timed = abortSignalWithTimeout(controller.signal)
    setDraftLoading(true)
    setDraftError(null)

    const search = new URLSearchParams({ grade: String(grade) })
    void fetch(
      `/api/library/units/${encodeURIComponent(unitCode)}/lessons/${encodeURIComponent(lessonNumber)}/template-draft?${search}`,
      { signal: timed.signal },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load template draft')
        }
        return (await response.json()) as TemplateDraftFields
      })
      .then((draft) => {
        setFormData((prev) => {
          if (prev.unitCode !== unitCode || prev.lessonNumber !== lessonNumber) {
            return prev
          }
          return applyTemplateDraftToForm(prev, draft, dirtyFieldsRef.current)
        })
        setAnswerKeyWarning(draft.answerKeyWarning ?? null)
        setDraftError(null)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }
        if (isTimeoutAbort(error) || isTimeoutAbort(timed.signal.reason)) {
          setDraftError(
            'Curriculum draft timed out. You can fill the fields manually or try another unit/lesson.',
          )
          return
        }
        if (isAbortError(error)) {
          return
        }
        const message =
          error instanceof Error && error.message
            ? error.message
            : 'Could not load curriculum for this lesson'
        setDraftError(
          `${message}. You can fill the fields manually or try another unit/lesson.`,
        )
      })
      .finally(() => {
        timed.clear()
        if (!controller.signal.aborted) {
          setDraftLoading(false)
        }
      })

    return () => {
      timed.clear()
      controller.abort()
    }
  }, [hydrateLesson, formData.unitCode, formData.lessonNumber])

  const seededTemplateId = useRef<string | null>(null)
  useEffect(() => {
    if (!template || template.id !== templateId || seededTemplateId.current === template.id) {
      return
    }
    seededTemplateId.current = template.id
    dirtyFieldsRef.current = new Set()
    setHydrateLesson(false)
    setDraftError(null)
    setAnswerKeyWarning(null)
    setFormData({
      title: template.title || '',
      type: template.type || '',
      description: template.description || '',
      curriculumTeachersEdition: template.curriculumTeachersEdition || '',
      curriculumAnswerKey: template.curriculumAnswerKey || '',
      subject: template.subject || '',
      gradeLevel: template.gradeLevel || '',
      unitCode: template.unitCode || '',
      lessonNumber:
        typeof template.lessonNumber === 'number' ? String(template.lessonNumber) : '',
    })
  }, [template, templateId])

  const handleInputChange = (field: string, value: string) => {
    if (field === 'unitCode' || field === 'lessonNumber') {
      const next = applyEditStructureChange(
        formData,
        field,
        value,
        savedStructure,
      )
      dirtyFieldsRef.current = new Set()
      setFormData(next.form)
      setHydrateLesson(next.hydrateLesson)
      setDraftLoading(next.hydrateLesson)
      setDraftError(null)
      setAnswerKeyWarning(null)
      setFormErrors({})
      return
    }
    if (isTemplateContentField(field)) {
      dirtyFieldsRef.current.add(field)
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (draftLoading) {
      return
    }

    if (!formData.title || !formData.type) {
      alert('Please fill in all required fields: Title and Type')
      return
    }

    const lessonError = lessonFieldError({
      unitCode: formData.unitCode,
      lessonNumber: formData.lessonNumber,
      lessonOptions,
      lessonsLoading,
      catalogReady,
      savedUnitCode: savedStructure.unitCode,
      savedLessonNumber: savedStructure.lessonNumber,
    })
    if (lessonError) {
      setFormErrors({ lessonNumber: lessonError })
      return
    }

    const unitCode = formData.unitCode || null
    const parsedLesson = Number.parseInt(formData.lessonNumber, 10)
    const lessonNumber =
      unitCode && Number.isInteger(parsedLesson) && parsedLesson >= 1 ? parsedLesson : null

    updateTemplateMutation.mutate({
      id: templateId,
      data: {
        title: formData.title,
        type: formData.type.trim(),
        description: formData.description || null,
        curriculumTeachersEdition: formData.curriculumTeachersEdition || null,
        curriculumAnswerKey: formData.curriculumAnswerKey || null,
        subject: formData.subject || null,
        gradeLevel: gradeLevelForUnitCode(unitCode) ?? (formData.gradeLevel.trim() || null),
        unitCode,
        lessonNumber,
      },
    })
  }

  const showEmptyState = !isLoading && (!template || error)

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title="Edit Assessment Template"
        subtitle={
          template
            ? 'Update template information'
            : 'Review template status or return to the backoffice'
        }
        breadcrumbItems={[
          {
            label: template?.title || 'Template',
            href: `/backoffice/assessment-templates/${templateId}`,
          },
          { label: 'Edit', isLast: true },
        ]}
        onBack={() => router.push(`/backoffice/assessment-templates/${templateId}`)}
        backButtonText="Back to Template"
      />

      {isLoading && (
        <div className="flex justify-center">
          <Loading variant="assessment" />
        </div>
      )}

      {showEmptyState && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-2 text-lg font-semibold">Template not found</p>
            <p className="mb-4 text-muted-foreground">
              The template you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button.Outline onClick={() => router.push('/backoffice')}>
              Back to Backoffice
            </Button.Outline>
          </CardContent>
        </Card>
      )}

      {draftError && (
        <div
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm"
          role="alert"
        >
          <p className="font-medium text-foreground">Curriculum draft unavailable</p>
          <p className="mt-1 text-muted-foreground">{draftError}</p>
        </div>
      )}

      {template && !isLoading && (
        <AssessmentTemplateEditForm
          templateId={templateId}
          formData={formData}
          formErrors={formErrors}
          lessonOptions={lessonOptions}
          lessonsLoading={lessonsLoading}
          lessonsError={lessonsError}
          answerKeyWarning={answerKeyWarning}
          lessonRequired={Boolean(formData.unitCode) && !structureUnchanged}
          draftLoading={draftLoading}
          allowEmptyUnit={!templateHasUnit}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isSubmitting={updateTemplateMutation.isPending}
        />
      )}
    </div>
  )
}
