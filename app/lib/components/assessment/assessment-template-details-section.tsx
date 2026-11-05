import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'
import { type AssessmentTemplate } from '@/types'

type AssessmentTemplateDetailsSectionProps = {
  template: AssessmentTemplate
}

function CurriculumPromptField({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div>
      <Typography variant="caption" color="muted">
        {label}
      </Typography>
      <Typography variant="body1" className="mt-1 whitespace-pre-wrap">
        {value?.trim() ? value : 'Not set'}
      </Typography>
    </div>
  )
}

export function AssessmentTemplateDetailsSection({
  template,
}: AssessmentTemplateDetailsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Typography variant="caption" color="muted">
                Title
              </Typography>
              <Typography variant="body1" className="mt-1">
                {template.title}
              </Typography>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography variant="caption" color="muted">
                  Type
                </Typography>
                <div className="mt-1">
                  <Badge variant="default">{template.type}</Badge>
                </div>
              </div>
              <div>
                <Typography variant="caption" color="muted">
                  Subject
                </Typography>
                <Typography variant="body1" className="mt-1">
                  {template.subject || 'N/A'}
                </Typography>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography variant="caption" color="muted">
                  Grade Level
                </Typography>
                <Typography variant="body1" className="mt-1">
                  {template.gradeLevel || 'N/A'}
                </Typography>
              </div>
              <div>
                <Typography variant="caption" color="muted">
                  Unit Code
                </Typography>
                <Typography variant="body1" className="mt-1">
                  {template.unitCode || 'N/A'}
                </Typography>
              </div>
            </div>

            <div>
              <Typography variant="caption" color="muted">
                Lesson
              </Typography>
              <Typography variant="body1" className="mt-1">
                {typeof template.lessonNumber === 'number' ? template.lessonNumber : 'N/A'}
              </Typography>
            </div>

            {template.description && (
              <div>
                <Typography variant="caption" color="muted">
                  Description
                </Typography>
                <Typography variant="body1" className="mt-1 whitespace-pre-wrap">
                  {template.description}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Typography variant="caption" color="muted">
                Template ID
              </Typography>
              <Typography variant="body1" className="mt-1 font-mono text-sm break-all">
                {template.id}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" color="muted">
                Created
              </Typography>
              <Typography variant="body1" className="mt-1">
                {template.createdAt
                  ? new Date(template.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" color="muted">
                Last Updated
              </Typography>
              <Typography variant="body1" className="mt-1">
                {template.updatedAt
                  ? new Date(template.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thematic Analysis Reviewer Instructions</CardTitle>
          <CardDescription>
            Curriculum fields are defined on this template. Custom instructions for thematic
            analysis are set per assessment on the assessment&apos;s student instructions field.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <CurriculumPromptField
            label="Curriculum Teacher's Edition"
            value={template.curriculumTeachersEdition}
          />
          <CurriculumPromptField
            label="Curriculum Answer Key"
            value={template.curriculumAnswerKey}
          />
        </CardContent>
      </Card>
    </div>
  )
}
