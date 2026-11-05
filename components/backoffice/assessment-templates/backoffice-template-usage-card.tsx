'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { Loading } from '@/app/lib/components/ui/layout'
import { Typography } from '@/app/lib/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { SmartDate } from '@/app/lib/components/ui/feedback'

type UsageStats = {
  totalAssessments: number
  activeAssessments: number
}

type UsageAssessment = {
  id: string
  status: string
  assignedAt: string | null
  dueAt: string | null
  title: string
  numberOfQuestions: number
}

interface BackofficeTemplateUsageCardProps {
  usageStats?: UsageStats
  assessments: UsageAssessment[]
  hasMore: boolean
  isLoading: boolean
  isFetching: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

export function BackofficeTemplateUsageCard({
  usageStats,
  assessments,
  hasMore,
  isLoading,
  isFetching,
  isLoadingMore,
  onLoadMore,
}: BackofficeTemplateUsageCardProps) {
  const renderDate = (value: string | null) => {
    if (!value) return '—'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return value
    }
    return <SmartDate date={parsed} variant="full" />
  }

  const showLoadingState = isLoading && assessments.length === 0
  const showEmptyAssessments = !showLoadingState && assessments.length === 0

  let usageContent: ReactNode

  if (showLoadingState) {
    usageContent = (
      <div className="flex justify-center py-6">
        <Loading variant="assessment" />
      </div>
    )
  } else if (showEmptyAssessments) {
    usageContent = (
      <Typography variant="body2" color="muted" className="mt-4">
        No assessments have been created from this template yet.
      </Typography>
    )
  } else {
    usageContent = (
      <div className="mt-4 overflow-hidden rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-80">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Questions</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assessments.map((assessment) => (
              <TableRow key={assessment.id} className="align-top">
                <TableCell className="font-medium">
                  <div>
                    <Link
                      href={`/backoffice/assessments/${assessment.id}`}
                      className="text-primary hover:underline"
                    >
                      {assessment.title}
                    </Link>
                  </div>
                  <Typography variant="caption" color="muted">
                    #{assessment.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="uppercase tracking-wide">
                    {assessment.status || 'unknown'}
                  </Badge>
                </TableCell>
                <TableCell>{renderDate(assessment.assignedAt)}</TableCell>
                <TableCell>{renderDate(assessment.dueAt)}</TableCell>
                <TableCell className="text-right">{assessment.numberOfQuestions}</TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  <Button.Outline asChild size="sm">
                    <Link href={`/backoffice/assessments/${assessment.id}`}>
                      View assessment
                    </Link>
                  </Button.Outline>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Usage</CardTitle>
        <CardDescription>
          Information about assessments created from this template
        </CardDescription>
      </CardHeader>
      <CardContent>
        {usageStats && (
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <BackofficeUsageStatCard label="Total Assessments" value={usageStats.totalAssessments} />
            <BackofficeUsageStatCard label="Active Assessments" value={usageStats.activeAssessments} />
          </div>
        )}

        {usageContent}

        {isFetching && assessments.length > 0 && !isLoadingMore && (
          <Typography variant="caption" color="muted" className="mt-4 block">
            Updating usage information...
          </Typography>
        )}

        {hasMore && (
          <div className="mt-6">
            <Button.Outline onClick={onLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? 'Loading assessments...' : 'Load more assessments'}
            </Button.Outline>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BackofficeUsageStatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/50 p-3">
      <Typography variant="caption" color="muted">
        {label}
      </Typography>
      <Typography variant="body1" className="mt-1 font-semibold">
        {value}
      </Typography>
    </div>
  )
}

