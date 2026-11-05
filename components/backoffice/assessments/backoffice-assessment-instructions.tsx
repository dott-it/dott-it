'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'

interface BackofficeAssessmentInstructionsProps {
  instructions: string
  formatInstructions: (instructions: string) => string
}

export function BackofficeAssessmentInstructions({
  instructions,
  formatInstructions,
}: BackofficeAssessmentInstructionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instructions</CardTitle>
        <CardDescription>Instructions for reviewers evaluating this assessment</CardDescription>
      </CardHeader>
      <CardContent>
        <Typography variant="body1" className="whitespace-pre-wrap">
          {formatInstructions(instructions)}
        </Typography>
      </CardContent>
    </Card>
  )
}

