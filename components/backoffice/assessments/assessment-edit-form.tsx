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
import type { ActiveAssessment } from '@/types'
import type { EditAssessmentFormState } from '@/app/(dashboard)/backoffice/assessments/schemas'
import { gradeLevelsMatch, type OpenSciEdUnitOption } from '@/lib/openscied-unit-options'

type EditAssessmentFormErrors = Partial<Record<keyof EditAssessmentFormState, string>>

export interface AssessmentEditFormProps {
  assessment: ActiveAssessment
  formData: EditAssessmentFormState
  formErrors?: EditAssessmentFormErrors
  onChange: (field: keyof EditAssessmentFormState, value: string) => void
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  schoolYearOptions: string[]
  unitOptions: OpenSciEdUnitOption[]
}

export function AssessmentEditForm({
  assessment,
  formData,
  formErrors = {},
  onChange,
  onSubmit,
  isSubmitting,
  schoolYearOptions,
  unitOptions,
}: AssessmentEditFormProps) {
  const gradeLevel = assessment.template?.gradeLevel
  const filteredUnitOptions = gradeLevel
    ? unitOptions.filter((unit) => gradeLevelsMatch(unit.gradeLevel, gradeLevel))
    : unitOptions
  const unitOptionsWithCurrent =
    formData.unitCode && !filteredUnitOptions.some((unit) => unit.value === formData.unitCode)
      ? [
          ...filteredUnitOptions,
          {
            value: formData.unitCode,
            label: `${formData.unitCode} (current)`,
            gradeLevel: gradeLevel || 'Unknown',
          },
        ]
      : filteredUnitOptions

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Assessment Information</CardTitle>
          <CardDescription>Update the details of this assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <Label className="text-sm font-medium text-muted-foreground">Template Information</Label>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Title:</span>
                <p className="font-medium">{assessment.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">{assessment.type || 'N/A'}</p>
              </div>
              {assessment.subject && (
                <div>
                  <span className="text-muted-foreground">Subject:</span>
                  <p className="font-medium">{assessment.subject}</p>
                </div>
              )}
              {assessment.grade && (
                <div>
                  <span className="text-muted-foreground">Grade:</span>
                  <p className="font-medium">{assessment.grade}</p>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Template information cannot be changed. Create a new assessment from a different
              template if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => onChange('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolYear">
              School Year <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.schoolYear}
              onValueChange={(value) => onChange('schoolYear', value)}
            >
              <SelectTrigger
                id="schoolYear"
                aria-required
                aria-invalid={formErrors.schoolYear ? 'true' : undefined}
                aria-describedby={formErrors.schoolYear ? 'error-schoolYear' : undefined}
              >
                <SelectValue placeholder="Select school year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.schoolYear && (
              <p id="error-schoolYear" className="text-sm text-destructive" role="alert">
                {formErrors.schoolYear}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitCode">
              Unit <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.unitCode}
              onValueChange={(value) => onChange('unitCode', value)}
            >
              <SelectTrigger
                id="unitCode"
                aria-required
                aria-invalid={formErrors.unitCode ? 'true' : undefined}
                aria-describedby={formErrors.unitCode ? 'error-unitCode' : undefined}
              >
                <SelectValue placeholder="Select OpenSciEd unit" />
              </SelectTrigger>
              <SelectContent>
                {unitOptionsWithCurrent.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.unitCode && (
              <p id="error-unitCode" className="text-sm text-destructive" role="alert">
                {formErrors.unitCode}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfQuestions">Number of Questions</Label>
            <Input
              id="numberOfQuestions"
              type="number"
              min="1"
              max="50"
              placeholder="e.g., 5"
              value={formData.numberOfQuestions}
              onChange={(event) => onChange('numberOfQuestions', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Reviewer&apos;s Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Instructions for reviewers evaluating this assessment"
              rows={4}
              value={formData.instructions || ''}
              onChange={(event) => onChange('instructions', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate || ''}
              onChange={(event) => onChange('dueDate', event.target.value)}
            />
          </div>

          <div className="flex gap-3 border-t pt-4">
            <Button.Outline asChild className="flex-1">
              <Link href={`/backoffice/assessments/${assessment.id}`}>Cancel</Link>
            </Button.Outline>
            <Button.SubmitWithLoading
              isLoading={isSubmitting}
              loadingText="Saving..."
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
