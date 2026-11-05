'use client'

import { Users, GraduationCap, FileText } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import type { ActiveAssessment } from '@/types'
import { DetailItem } from '../common/detail-item'
import { DateItem } from '../common/date-item'
import { RelationItem } from '../common/relation-item'

interface BackofficeAssessmentDetailsGridProps {
  assessment: ActiveAssessment
}

export function BackofficeAssessmentDetailsGrid({
  assessment,
}: BackofficeAssessmentDetailsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Assessment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem label="Title" value={assessment.title} />

          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              label="Subject"
              value={assessment.subject || 'N/A'}
            />
            <DetailItem
              label="Grade Level"
              value={assessment.grade == null ? 'N/A' : String(assessment.grade)}
            />
          </div>

          <DetailItem label="Unit" value={assessment.unitName || 'N/A'} />

          <DetailItem
            label="School Year"
            value={assessment.schoolYear || 'N/A'}
          />

          {assessment.description && (
            <DetailItem label="Description" value={assessment.description} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Typography variant="caption" color="muted">
              Status
            </Typography>
            <div className="mt-1">
              <Badge variant="default">{assessment.status || 'active'}</Badge>
            </div>
          </div>

          <DateItem label="Assigned Date" date={assessment.assignedAt} />
          <DateItem label="Due Date" date={assessment.dueAt} />
          <DetailItem
            label="Total Students"
            value={String(assessment.totalRecords || 0)}
          />
          <DetailItem
            label="Pending Submissions"
            value={String(assessment.pendingRecords || 0)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relations</CardTitle>
          <CardDescription>Tenant, template, and teacher information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RelationItem
            label="Tenant"
            icon={<Users className="size-4 text-muted-foreground" />}
            value={assessment.tenant?.name}
            secondaryValue={
              assessment.tenant ? (
                <Badge variant="outline" className="ml-2">
                  {assessment.tenant.slug}
                </Badge>
              ) : undefined
            }
            emptyMessage="No tenant assigned"
          />
          <RelationItem
            label="Template"
            icon={<FileText className="size-4 text-muted-foreground" />}
            value={assessment.template?.title ?? assessment.templateId}
            secondaryValue={
              assessment.template ? (
                <Badge variant="outline" className="ml-2">
                  {assessment.template.type}
                </Badge>
              ) : undefined
            }
            isCodeFallback={!assessment.template}
          />
          <RelationItem
            label="Teacher"
            icon={<GraduationCap className="size-4 text-muted-foreground" />}
            value={
              assessment.teacher?.name ||
              assessment.teacher?.email ||
              assessment.assignedBy ||
              'Unknown'
            }
            secondaryValue={
              assessment.teacher?.email ? (
                <Typography variant="caption" color="muted" className="ml-2">
                  ({assessment.teacher.email})
                </Typography>
              ) : undefined
            }
            isCodeFallback={!assessment.teacher}
          />
        </CardContent>
      </Card>
    </div>
  )
}

