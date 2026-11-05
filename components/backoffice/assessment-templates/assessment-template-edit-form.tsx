'use client'

import type { FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormSelect, type FormSelectOption } from '@/components/backoffice/common/form-field'
import {
  resolveEditLessonOptions,
  resolveEditUnitOptions,
} from '@/components/backoffice/assessment-templates/lesson-field-error'
import { templateUnitSelectOptionsWithNone } from '@/components/backoffice/assessment-templates/assessment-template-options'

export interface AssessmentTemplateEditFormProps {
  templateId: string
  formData: {
    title: string
    type: string
    description: string
    curriculumTeachersEdition: string
    curriculumAnswerKey: string
    subject: string
    gradeLevel: string
    unitCode: string
    lessonNumber: string
  }
  formErrors?: {
    lessonNumber?: string
  }
  lessonOptions: FormSelectOption[]
  lessonsLoading?: boolean
  lessonsError?: string | null
  answerKeyWarning?: string | null
  /** False when the saved unit and lesson are unchanged, including a unit with no lesson. */
  lessonRequired?: boolean
  draftLoading?: boolean
  /** Legacy templates with no unit may clear it. A saved unit stays required. */
  allowEmptyUnit?: boolean
  onChange: (field: string, value: string) => void
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
}

export function AssessmentTemplateEditForm({
  templateId,
  formData,
  formErrors,
  lessonOptions,
  lessonsLoading = false,
  lessonsError = null,
  answerKeyWarning = null,
  lessonRequired = Boolean(formData.unitCode),
  draftLoading = false,
  allowEmptyUnit = true,
  onChange,
  onSubmit,
  isSubmitting,
}: AssessmentTemplateEditFormProps) {
  const resolvedUnitOptions = resolveEditUnitOptions(templateUnitSelectOptionsWithNone, {
    allowEmptyUnit,
    unitCode: formData.unitCode,
  })
  const resolvedLessonOptions = resolveEditLessonOptions(lessonOptions, formData.lessonNumber)

  const contentDisabled = draftLoading || isSubmitting
  const lessonDisabled =
    !formData.unitCode || isSubmitting || resolvedLessonOptions.length === 0
  const lessonPlaceholder = (() => {
    if (!formData.unitCode) {
      return 'Select a unit first'
    }
    if (lessonsLoading) {
      return 'Loading lessons...'
    }
    if (lessonsError) {
      return 'Lessons unavailable'
    }
    return 'Select a lesson'
  })()

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
          <CardDescription>Update the details of this assessment template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">
              Template Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Ecosystems Assessment Template"
              value={formData.title}
              onChange={(e) => onChange('title', e.target.value)}
              required
              disabled={contentDisabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Input
                id="type"
                placeholder="e.g., Formative"
                value={formData.type}
                onChange={(e) => onChange('type', e.target.value)}
                required
                disabled={contentDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Science"
                value={formData.subject}
                onChange={(e) => onChange('subject', e.target.value)}
                disabled={contentDisabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitCode">Unit</Label>
              <Select
                value={formData.unitCode || (allowEmptyUnit ? 'none' : undefined)}
                onValueChange={(value) => {
                  if (!allowEmptyUnit && value === 'none') {
                    return
                  }
                  onChange('unitCode', value === 'none' ? '' : value)
                }}
              >
                <SelectTrigger id="unitCode">
                  <SelectValue placeholder="Select an OpenSciEd unit" />
                </SelectTrigger>
                <SelectContent>
                  {resolvedUnitOptions.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormSelect
              id="lessonNumber"
              label="Lesson"
              required={lessonRequired}
              placeholder={lessonPlaceholder}
              value={formData.lessonNumber}
              onChange={(value) => onChange('lessonNumber', value)}
              options={resolvedLessonOptions}
              error={formErrors?.lessonNumber}
              disabled={lessonDisabled}
            />
          </div>

          {lessonsError && lessonRequired && (
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
              className="rounded-md border border-border bg-muted/40 px-3 py-3 text-sm"
              role="status"
              aria-live="polite"
            >
              <p className="font-medium text-foreground">Loading curriculum for this lesson…</p>
              <p className="mt-1 text-muted-foreground">
                Pulling teacher edition guidance and answer key from the library. You can change unit
                or lesson to cancel and try another.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="curriculumTeachersEdition">Curriculum Teacher&apos;s Edition</Label>
            <Textarea
              id="curriculumTeachersEdition"
              placeholder="Teacher's edition content for thematic analysis reviewer instructions"
              rows={6}
              value={formData.curriculumTeachersEdition}
              onChange={(e) => onChange('curriculumTeachersEdition', e.target.value)}
              disabled={contentDisabled}
            />
          </div>

          {answerKeyWarning && (
            <div
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm"
              role="alert"
            >
              <p className="font-medium text-foreground">Answer key unavailable</p>
              <p className="mt-1 text-muted-foreground">{answerKeyWarning}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="curriculumAnswerKey">Curriculum Answer Key</Label>
            <Textarea
              id="curriculumAnswerKey"
              placeholder="Answer key content for thematic analysis reviewer instructions"
              rows={6}
              value={formData.curriculumAnswerKey}
              onChange={(e) => onChange('curriculumAnswerKey', e.target.value)}
              disabled={contentDisabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a brief description of this template"
              rows={4}
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              disabled={contentDisabled}
            />
          </div>

          <div className="flex gap-3 border-t pt-4">
            <Button.Outline asChild className="flex-1">
              <Link href={`/backoffice/assessment-templates/${templateId}`}>Cancel</Link>
            </Button.Outline>
            <Button.SubmitWithLoading
              isLoading={isSubmitting || draftLoading}
              loadingText={draftLoading ? 'Loading curriculum...' : 'Saving...'}
              className="flex-1"
            >
              Save Changes
            </Button.SubmitWithLoading>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
