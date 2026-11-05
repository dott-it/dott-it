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
import type { AssessmentTemplate } from '@/types'
import type { CreateAssessmentFormState } from '@/app/(dashboard)/backoffice/assessments/schemas'
import type { TenantTeacher } from '@/app/lib/services/tenants/tenant.service'
import type { Tenant } from '@/app/types/api/tenant'
import { gradeLevelsMatch, type OpenSciEdUnitOption } from '@/lib/openscied-unit-options'

type CreateAssessmentFormErrors = Partial<Record<keyof CreateAssessmentFormState, string>>

export interface AssessmentCreateFormProps {
  formData: CreateAssessmentFormState
  formErrors: CreateAssessmentFormErrors
  onChange: (field: keyof CreateAssessmentFormState, value: string) => void
  onSubmit: (event: FormEvent) => void
  isSubmitting: boolean
  templates: AssessmentTemplate[]
  teachers: TenantTeacher[]
  tenants: Tenant[]
  schoolYearOptions: string[]
  unitOptions: OpenSciEdUnitOption[]
  templatesLoading: boolean
  teachersLoading: boolean
  tenantsLoading: boolean
}

export function AssessmentCreateForm({
  formData,
  formErrors,
  onChange,
  onSubmit,
  isSubmitting,
  templates,
  teachers,
  tenants,
  schoolYearOptions,
  unitOptions,
  templatesLoading,
  teachersLoading,
  tenantsLoading,
}: AssessmentCreateFormProps) {
  const selectedTemplate = templates.find((template) => template.id === formData.templateId)
  const gradeLevel = selectedTemplate?.gradeLevel
  const filteredUnitOptions = gradeLevel
    ? unitOptions.filter((unit) => gradeLevelsMatch(unit.gradeLevel, gradeLevel))
    : []
  const hasTemplate = Boolean(formData.templateId)

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Assessment Information</CardTitle>
          <CardDescription>Fill in the details to create a new assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="templateId">
              Assessment Template <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.templateId}
              onValueChange={(value) => onChange('templateId', value)}
              disabled={templatesLoading}
            >
              <SelectTrigger
                id="templateId"
                aria-required
                aria-invalid={formErrors.templateId ? 'true' : undefined}
                aria-describedby={formErrors.templateId ? 'error-templateId' : undefined}
              >
                <SelectValue
                  placeholder={
                    templatesLoading ? 'Loading templates...' : 'Select a template'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                    {template.subject ? ` • ${template.subject}` : ''}
                    {template.gradeLevel ? ` (${template.gradeLevel})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.templateId && (
              <p id="error-templateId" className="text-sm text-destructive" role="alert">
                {formErrors.templateId}
              </p>
            )}
            {templates.length === 0 && !templatesLoading && (
              <p className="text-sm text-muted-foreground">
                No templates available.{' '}
                <Link
                  href="/backoffice/assessment-templates/create"
                  className="text-primary hover:underline"
                >
                  Create a template first
                </Link>
                .
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenantId">
              Tenant <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.tenantId}
              onValueChange={(value) => onChange('tenantId', value)}
              disabled={tenantsLoading}
            >
              <SelectTrigger
                id="tenantId"
                aria-required
                aria-invalid={formErrors.tenantId ? 'true' : undefined}
                aria-describedby={formErrors.tenantId ? 'error-tenantId' : undefined}
              >
                <SelectValue
                  placeholder={
                    tenantsLoading ? 'Loading tenants...' : 'Select a tenant'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                    {tenant.slug ? ` (${tenant.slug})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.tenantId && (
              <p id="error-tenantId" className="text-sm text-destructive" role="alert">
                {formErrors.tenantId}
              </p>
            )}
            {tenants.length === 0 && !tenantsLoading && (
              <p className="text-sm text-muted-foreground">
                No tenants available. Please create a tenant first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedBy">
              Assigned By <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.assignedBy}
              onValueChange={(value) => onChange('assignedBy', value)}
              disabled={!formData.tenantId || teachersLoading}
            >
              <SelectTrigger
                id="assignedBy"
                aria-required
                aria-invalid={formErrors.assignedBy ? 'true' : undefined}
                aria-describedby={formErrors.assignedBy ? 'error-assignedBy' : undefined}
              >
                <SelectValue
                  placeholder={
                    formData.tenantId
                      ? (teachersLoading ? 'Loading teachers...' : 'Select a teacher')
                      : 'Select a tenant first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.teacherNickname || `${teacher.firstName} ${teacher.lastName}`}
                    {teacher.email ? ` (${teacher.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.assignedBy && (
              <p id="error-assignedBy" className="text-sm text-destructive" role="alert">
                {formErrors.assignedBy}
              </p>
            )}
            {formData.tenantId && teachers.length === 0 && !teachersLoading && (
              <p className="text-sm text-muted-foreground">
                No teachers available for this tenant. Add teachers in the tenant management section.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">
              Assigned To <span className="text-destructive">*</span>
            </Label>
            <Input
              id="assignedTo"
              placeholder="e.g., Class A, Grade 8"
              value={formData.assignedTo}
              onChange={(event) => onChange('assignedTo', event.target.value)}
              required
              aria-required
              aria-invalid={formErrors.assignedTo ? 'true' : undefined}
              aria-describedby={formErrors.assignedTo ? 'error-assignedTo' : undefined}
            />
            {formErrors.assignedTo && (
              <p id="error-assignedTo" className="text-sm text-destructive" role="alert">
                {formErrors.assignedTo}
              </p>
            )}
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
              disabled={!hasTemplate}
            >
              <SelectTrigger
                id="unitCode"
                aria-required
                aria-invalid={formErrors.unitCode ? 'true' : undefined}
                aria-describedby={formErrors.unitCode ? 'error-unitCode' : undefined}
              >
                <SelectValue
                  placeholder={
                    hasTemplate ? 'Select OpenSciEd unit' : 'Select a template first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredUnitOptions.map((unit) => (
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
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => onChange('status', value)}
            >
              <SelectTrigger
                id="status"
                aria-invalid={formErrors.status ? 'true' : undefined}
                aria-describedby={formErrors.status ? 'error-status' : undefined}
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            {formErrors.status && (
              <p id="error-status" className="text-sm text-destructive" role="alert">
                {formErrors.status}
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
              aria-invalid={formErrors.numberOfQuestions ? 'true' : undefined}
              aria-describedby={formErrors.numberOfQuestions ? 'error-numberOfQuestions' : undefined}
            />
            {formErrors.numberOfQuestions && (
              <p id="error-numberOfQuestions" className="text-sm text-destructive" role="alert">
                {formErrors.numberOfQuestions}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="submissionUrl">Submission URL</Label>
            <Input
              id="submissionUrl"
              type="url"
              placeholder="e.g., https://forms.google.com/..."
              value={formData.submissionUrl || ''}
              onChange={(event) => onChange('submissionUrl', event.target.value)}
              aria-invalid={formErrors.submissionUrl ? 'true' : undefined}
              aria-describedby={
                [
                  'hint-submissionUrl',
                  formErrors.submissionUrl && 'error-submissionUrl',
                ]
                  .filter(Boolean)
                  .join(' ') || 'hint-submissionUrl'
              }
            />
            <p id="hint-submissionUrl" className="text-sm text-muted-foreground">
              Optional: URL where students will submit their responses
            </p>
            {formErrors.submissionUrl && (
              <p id="error-submissionUrl" className="text-sm text-destructive" role="alert">
                {formErrors.submissionUrl}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleFormId">Google Form ID</Label>
            <Input
              id="googleFormId"
              placeholder="e.g., 1FAIpQLSd..."
              value={formData.googleFormId || ''}
              onChange={(event) => onChange('googleFormId', event.target.value)}
              aria-invalid={formErrors.googleFormId ? 'true' : undefined}
              aria-describedby={
                ['hint-googleFormId', formErrors.googleFormId && 'error-googleFormId']
                  .filter(Boolean)
                  .join(' ') || 'hint-googleFormId'
              }
            />
            <p id="hint-googleFormId" className="text-sm text-muted-foreground">
              Optional: Google Form ID for integration
            </p>
            {formErrors.googleFormId && (
              <p id="error-googleFormId" className="text-sm text-destructive" role="alert">
                {formErrors.googleFormId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Reviewer&apos;s Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Instructions for reviewers evaluating this assessment"
              rows={4}
              value={formData.instructions || ''}
              onChange={(event) => onChange('instructions', event.target.value)}
              aria-invalid={formErrors.instructions ? 'true' : undefined}
              aria-describedby={formErrors.instructions ? 'error-instructions' : undefined}
            />
            {formErrors.instructions && (
              <p id="error-instructions" className="text-sm text-destructive" role="alert">
                {formErrors.instructions}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate || ''}
              onChange={(event) => onChange('dueDate', event.target.value)}
              aria-invalid={formErrors.dueDate ? 'true' : undefined}
              aria-describedby={formErrors.dueDate ? 'error-dueDate' : undefined}
            />
            {formErrors.dueDate && (
              <p id="error-dueDate" className="text-sm text-destructive" role="alert">
                {formErrors.dueDate}
              </p>
            )}
          </div>

          <div className="flex gap-3 border-t pt-4">
            <Button.Outline asChild className="flex-1">
              <Link href="/backoffice">Cancel</Link>
            </Button.Outline>
            <Button.SubmitWithLoading
              isLoading={isSubmitting}
              loadingText="Creating..."
              className="flex-1"
            >
              Create Assessment
            </Button.SubmitWithLoading>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

