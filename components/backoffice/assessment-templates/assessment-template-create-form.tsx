'use client'

import type { FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { BackofficeFormCard } from '@/components/backoffice/common/backoffice-form-card'
import {
  FormInput,
  FormSelect,
  FormTextarea,
  type FormSelectOption,
} from '@/components/backoffice/common/form-field'
import {
  templateSubjectSelectOptions,
  templateTypeSelectOptions,
  templateUnitSelectOptions,
} from '@/components/backoffice/assessment-templates/assessment-template-options'
import { FormActions } from '@/components/backoffice/common/form-actions'
import type { CreateTemplateFormState } from '@/app/(dashboard)/backoffice/assessment-templates/schemas'

type CreateTemplateFormErrors = Partial<Record<keyof CreateTemplateFormState, string>>

export interface AssessmentTemplateCreateFormProps {
  formData: CreateTemplateFormState
  formErrors: CreateTemplateFormErrors
  onChange: (field: keyof CreateTemplateFormState, value: string) => void
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  lessonOptions: FormSelectOption[]
  lessonsLoading?: boolean
  lessonsError?: string | null
  answerKeyWarning?: string | null
  draftLoading?: boolean
}

export function AssessmentTemplateCreateForm({
  formData,
  formErrors,
  onChange,
  onSubmit,
  isSubmitting,
  lessonOptions,
  lessonsLoading = false,
  lessonsError = null,
  answerKeyWarning = null,
  draftLoading = false,
}: AssessmentTemplateCreateFormProps) {
  const structureDisabled = isSubmitting
  const lessonDisabled =
    structureDisabled || !formData.unitCode || lessonsLoading || lessonOptions.length === 0
  const contentDisabled = draftLoading || isSubmitting

  const lessonPlaceholder = (() => {
    if (lessonsLoading) {
      return 'Loading lessons...'
    }
    if (lessonsError) {
      return 'Lessons unavailable'
    }
    if (formData.unitCode) {
      return 'Select a lesson'
    }
    return 'Select a unit first'
  })()

  return (
    <form onSubmit={onSubmit} noValidate>
      <BackofficeFormCard
        title="Template Information"
        description="Choose an OpenSciEd unit and lesson to pull curriculum guidance, then finish the template details"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            id="unitCode"
            label="Unit"
            required
            placeholder="Select an OpenSciEd unit"
            value={formData.unitCode}
            onChange={(value) => onChange('unitCode', value)}
            options={templateUnitSelectOptions}
            error={formErrors.unitCode}
            disabled={structureDisabled}
          />
          <FormSelect
            id="lessonNumber"
            label="Lesson"
            required
            placeholder={lessonPlaceholder}
            value={formData.lessonNumber}
            onChange={(value) => onChange('lessonNumber', value)}
            options={lessonOptions}
            error={formErrors.lessonNumber}
            disabled={lessonDisabled}
          />
        </div>

        {lessonsError && (
          <div
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm"
            role="alert"
          >
            <p className="font-medium text-foreground">Could not load lessons</p>
            <p className="mt-1 text-muted-foreground">{lessonsError}</p>
          </div>
        )}

        {draftLoading && (
          <div
            className="flex items-start gap-3 rounded-md border border-border bg-muted/40 px-3 py-3"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">Loading curriculum for this lesson…</p>
              <p className="text-muted-foreground">
                Pulling teacher edition guidance and answer key from the library. This can take a few
                seconds. You can change unit or lesson to cancel and try another.
              </p>
            </div>
          </div>
        )}

        <FormInput
          id="title"
          label="Template Title"
          required
          placeholder="e.g., Ecosystems Assessment Template"
          value={formData.title}
          onChange={(value) => onChange('title', value)}
          error={formErrors.title}
          disabled={contentDisabled}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            id="type"
            label="Type"
            required
            placeholder="Select a type"
            value={formData.type}
            onChange={(value) => onChange('type', value)}
            options={templateTypeSelectOptions}
            error={formErrors.type}
            disabled={contentDisabled}
          />
          <FormSelect
            id="subject"
            label="Subject"
            required
            placeholder="Select a subject"
            value={formData.subject || ''}
            onChange={(value) => onChange('subject', value)}
            options={templateSubjectSelectOptions}
            error={formErrors.subject}
            disabled={contentDisabled}
          />
        </div>

        <FormTextarea
          id="curriculumTeachersEdition"
          label="Curriculum Teacher's Edition"
          placeholder="Teacher's edition content for thematic analysis reviewer instructions"
          value={formData.curriculumTeachersEdition || ''}
          onChange={(value) => onChange('curriculumTeachersEdition', value)}
          error={formErrors.curriculumTeachersEdition}
          disabled={contentDisabled}
        />

        {answerKeyWarning && (
          <div
            className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm"
            role="alert"
          >
            <p className="font-medium text-foreground">Answer key unavailable</p>
            <p className="mt-1 text-muted-foreground">{answerKeyWarning}</p>
          </div>
        )}

        <FormTextarea
          id="curriculumAnswerKey"
          label="Curriculum Answer Key"
          placeholder="Answer key content for thematic analysis reviewer instructions"
          value={formData.curriculumAnswerKey || ''}
          onChange={(value) => onChange('curriculumAnswerKey', value)}
          error={formErrors.curriculumAnswerKey}
          disabled={contentDisabled}
        />

        <FormTextarea
          id="description"
          label="Description"
          placeholder="Provide a brief description of this template"
          value={formData.description || ''}
          onChange={(value) => onChange('description', value)}
          error={formErrors.description}
          disabled={contentDisabled}
        />

        <FormActions
          submitLabel="Create Template"
          isLoading={isSubmitting || draftLoading}
          loadingText={draftLoading ? 'Loading curriculum...' : 'Creating...'}
        />
      </BackofficeFormCard>
    </form>
  )
}
