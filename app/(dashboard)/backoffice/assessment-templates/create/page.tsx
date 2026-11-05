'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { assessmentTemplateQueries } from '@/app/lib/services/assessment-templates/assessment-template.queries'
import {
  createTemplateSchema,
  emptyCreateTemplateFormState,
  type CreateTemplateFormState,
} from '../schemas'
import { AssessmentTemplateCreateForm } from '@/components/backoffice/assessment-templates/assessment-template-create-form'
import {
  TEMPLATE_SUBJECT_OPTIONS,
  TEMPLATE_TYPE_OPTIONS,
} from '@/components/backoffice/assessment-templates/assessment-template-options'
import {
  abortSignalWithTimeout,
  applyTemplateDraftToForm,
  isAbortError,
  isTemplateContentField,
  isTimeoutAbort,
  type TemplateContentField,
  type TemplateDraftFields,
} from '@/components/backoffice/assessment-templates/apply-template-draft'
import { gradeLevelForUnitCode } from '@/lib/openscied-unit-options'
import {
  gradeNumberForUnit,
  useOpenSciEdUnitLessons,
} from '@/components/backoffice/assessment-templates/use-openscied-unit-lessons'
import type { AssessmentTemplate } from '@/types'
import {
  findStructuralTemplateDuplicates,
  titleMatchesExistingTemplate,
} from '@/lib/assessment-template-duplicates'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type CreateTemplateFormErrors = Partial<Record<keyof CreateTemplateFormState, string>>

type PendingCreatePayload = {
  title: string
  type: string
  subject: string
  description: string | null
  curriculumTeachersEdition: string | null
  curriculumAnswerKey: string | null
  gradeLevel: string | null
  unitCode: string
  lessonNumber: number
}

function isTemplateSubject(
  value: string,
): value is (typeof TEMPLATE_SUBJECT_OPTIONS)[number] {
  return (TEMPLATE_SUBJECT_OPTIONS as readonly string[]).includes(value)
}

function isTemplateType(value: string): value is (typeof TEMPLATE_TYPE_OPTIONS)[number] {
  return (TEMPLATE_TYPE_OPTIONS as readonly string[]).includes(value)
}

function buildCreatePayload(form: CreateTemplateFormState): PendingCreatePayload | null {
  const parsedResult = createTemplateSchema.safeParse(form)
  if (!parsedResult.success) {
    return null
  }

  const unitCode = parsedResult.data.unitCode.trim()
  const lessonNumber = Number.parseInt(parsedResult.data.lessonNumber, 10)
  return {
    title: parsedResult.data.title.trim(),
    type: parsedResult.data.type.trim(),
    subject: parsedResult.data.subject.trim(),
    description: parsedResult.data.description?.trim() || null,
    curriculumTeachersEdition:
      parsedResult.data.curriculumTeachersEdition?.trim() || null,
    curriculumAnswerKey: parsedResult.data.curriculumAnswerKey?.trim() || null,
    gradeLevel: gradeLevelForUnitCode(unitCode),
    unitCode,
    lessonNumber,
  }
}

export default function CreateAssessmentTemplatePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<CreateTemplateFormState>(emptyCreateTemplateFormState)
  const [formErrors, setFormErrors] = useState<CreateTemplateFormErrors>({})
  const { lessonOptions, lessonsLoading, lessonsError } = useOpenSciEdUnitLessons(formData.unitCode)
  const [draftLoading, setDraftLoading] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [answerKeyWarning, setAnswerKeyWarning] = useState<string | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateMatches, setDuplicateMatches] = useState<AssessmentTemplate[]>([])
  const [pendingCreate, setPendingCreate] = useState<PendingCreatePayload | null>(null)
  const [versionTitleRequired, setVersionTitleRequired] = useState(false)
  const [creatingNewVersion, setCreatingNewVersion] = useState(false)
  const dirtyFieldsRef = useRef(new Set<TemplateContentField>())

  const templatesQuery = assessmentTemplateQueries.list.useQuery({
    refetchOnMount: 'always',
  })

  const createTemplateMutation = assessmentTemplateQueries.create.useMutation({
    onSuccess: async (template) => {
      await queryClient.invalidateQueries({
        queryKey: assessmentTemplateQueries.getKey(),
      })
      router.push(`/backoffice/assessment-templates/${template.id}`)
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Error creating assessment template'
      alert(message)
    },
  })

  useEffect(() => {
    const unitCode = formData.unitCode.trim()
    const lessonNumber = formData.lessonNumber.trim()
    if (!unitCode || !lessonNumber) {
      setDraftLoading(false)
      setDraftError(null)
      setAnswerKeyWarning(null)
      return
    }

    const grade = gradeNumberForUnit(unitCode)
    if (grade === null) {
      setDraftLoading(false)
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
          return applyTemplateDraftToForm(prev, draft, dirtyFieldsRef.current, {
            isSubject: isTemplateSubject,
            isType: isTemplateType,
          })
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
  }, [formData.unitCode, formData.lessonNumber])

  const handleInputChange = (field: keyof CreateTemplateFormState, value: string) => {
    if (field === 'unitCode') {
      dirtyFieldsRef.current = new Set()
      setDraftLoading(false)
      setDraftError(null)
      setAnswerKeyWarning(null)
      setCreatingNewVersion(false)
      setVersionTitleRequired(false)
      setDuplicateMatches([])
      setPendingCreate(null)
      setFormData((prev) => ({
        ...prev,
        unitCode: value,
        lessonNumber: '',
        title: '',
        type: '',
        subject: '',
        description: '',
        curriculumTeachersEdition: '',
        curriculumAnswerKey: '',
      }))
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
      return
    }

    if (field === 'lessonNumber') {
      dirtyFieldsRef.current = new Set()
      setDraftLoading(Boolean(formData.unitCode.trim() && value.trim()))
      setDraftError(null)
      setAnswerKeyWarning(null)
      setCreatingNewVersion(false)
      setVersionTitleRequired(false)
      setDuplicateMatches([])
      setPendingCreate(null)
      setFormData((prev) => ({
        ...prev,
        lessonNumber: value,
        title: '',
        type: '',
        subject: '',
        description: '',
        curriculumTeachersEdition: '',
        curriculumAnswerKey: '',
      }))
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
      return
    }

    if (isTemplateContentField(field)) {
      dirtyFieldsRef.current.add(field)
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    if (field === 'title') {
      setVersionTitleRequired(false)
    }
    if (field === 'type') {
      setCreatingNewVersion(false)
      setVersionTitleRequired(false)
      setDuplicateMatches([])
      setPendingCreate(null)
    }
  }

  const requireDifferentTitle = (matches: AssessmentTemplate[]) => {
    setDuplicateMatches(matches)
    setCreatingNewVersion(true)
    setVersionTitleRequired(true)
    setFormErrors((prev) => ({
      ...prev,
      title:
        'Change the title to save a new version (for example, add a district or tenant name).',
    }))
  }

  const submitCreate = (payload: PendingCreatePayload) => {
    createTemplateMutation.mutate(payload)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setVersionTitleRequired(false)

    const parsedResult = createTemplateSchema.safeParse(formData)

    if (!parsedResult.success) {
      const fieldErrors = parsedResult.error.flatten().fieldErrors
      setFormErrors({
        title: fieldErrors.title?.[0],
        type: fieldErrors.type?.[0],
        subject: fieldErrors.subject?.[0],
        description: fieldErrors.description?.[0],
        curriculumTeachersEdition: fieldErrors.curriculumTeachersEdition?.[0],
        curriculumAnswerKey: fieldErrors.curriculumAnswerKey?.[0],
        gradeLevel: fieldErrors.gradeLevel?.[0],
        unitCode: fieldErrors.unitCode?.[0],
        lessonNumber: fieldErrors.lessonNumber?.[0],
      })
      return
    }

    const payload = buildCreatePayload(formData)
    if (!payload) {
      return
    }

    let templates: AssessmentTemplate[] = []
    try {
      const result = await templatesQuery.refetch()
      templates = result.data ?? []
    } catch {
      templates = templatesQuery.data ?? []
    }

    const matches = findStructuralTemplateDuplicates(templates, {
      unitCode: payload.unitCode,
      lessonNumber: payload.lessonNumber,
      type: payload.type,
    })

    if (matches.length === 0) {
      setCreatingNewVersion(false)
      submitCreate(payload)
      return
    }

    if (creatingNewVersion) {
      if (titleMatchesExistingTemplate(matches, payload.title)) {
        requireDifferentTitle(matches)
        return
      }
      submitCreate(payload)
      return
    }

    setDuplicateMatches(matches)
    setPendingCreate(payload)
    setDuplicateDialogOpen(true)
  }

  const handleEditExisting = (templateId: string) => {
    setDuplicateDialogOpen(false)
    router.push(`/backoffice/assessment-templates/${templateId}/edit`)
  }

  const handleCreateNewVersion = () => {
    // Prefer live form values so edits made while the dialog is open are kept.
    const livePayload = buildCreatePayload(formData) ?? pendingCreate
    if (!livePayload) {
      return
    }

    if (titleMatchesExistingTemplate(duplicateMatches, livePayload.title)) {
      setDuplicateDialogOpen(false)
      requireDifferentTitle(duplicateMatches)
      return
    }

    setDuplicateDialogOpen(false)
    setCreatingNewVersion(true)
    submitCreate(livePayload)
  }

  const existingTitles = duplicateMatches.map((template) => template.title).join(', ')

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title="Create Assessment Template"
        subtitle="Create a reusable template for assessments"
        breadcrumbItems={[{ label: 'Create Template', isLast: true }]}
      />

      {versionTitleRequired && (
        <div
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm"
          role="status"
        >
          <p className="font-medium text-foreground">New version needs a different title</p>
          <p className="mt-1 text-muted-foreground">
            A template already exists for this unit, lesson, and type
            {existingTitles ? ` (${existingTitles})` : ''}. Update the title — for example add{' '}
            <span className="font-medium">- TenantName</span> — then save again.
          </p>
        </div>
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

      <AssessmentTemplateCreateForm
        formData={formData}
        formErrors={formErrors}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isSubmitting={createTemplateMutation.isPending}
        lessonOptions={lessonOptions}
        lessonsLoading={lessonsLoading}
        lessonsError={formData.unitCode ? lessonsError : null}
        answerKeyWarning={answerKeyWarning}
        draftLoading={draftLoading}
      />

      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Template already exists</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  There is already at least one template for unit{' '}
                  <span className="font-medium text-foreground">{pendingCreate?.unitCode}</span>,
                  lesson{' '}
                  <span className="font-medium text-foreground">{pendingCreate?.lessonNumber}</span>
                  , type{' '}
                  <span className="font-medium text-foreground">{pendingCreate?.type}</span>.
                </p>
                <p>
                  You can edit an existing template, or create a new version. To save a second
                  version, change the title first (for example, add a district or tenant name).
                </p>
                {duplicateMatches.length > 0 && (
                  <ul className="space-y-2 pt-1">
                    {duplicateMatches.map((template) => (
                      <li key={template.id}>
                        <button
                          type="button"
                          className="w-full rounded-md border bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted/50"
                          onClick={() => handleEditExisting(template.id)}
                        >
                          <span className="font-medium">{template.title || 'Untitled'}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Edit this version
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={handleCreateNewVersion}>
              Create new version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
