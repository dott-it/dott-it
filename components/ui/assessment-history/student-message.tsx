'use client'

import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { cn } from '@/app/lib/utils/utils'
import { getStudentDisplayName } from '@/app/lib/utils/student-display-name'
import { useState } from 'react'

interface StudentMessageProps {
  studentName: string
  learnerId?: string
  content: string
  showStudentInfo: boolean
  initiallyOpen?: boolean
}

export function StudentMessage({
  studentName,
  learnerId,
  content,
  showStudentInfo,
  initiallyOpen = false,
}: StudentMessageProps) {

  const [submissionOpen, setSubmissionOpen] = useState(initiallyOpen)
  return (
    <div className="w-full">
      <Card
        className={cn(
          'w-full',
          'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
          'hover:shadow-md hover:border-border/80 dark:hover:border-border/60',
        )}
      >
        <div className="w-full">
          {/* Header */}
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="min-w-0 truncate text-sm font-medium">
                {getStudentDisplayName({
                  showRealNames: showStudentInfo,
                  learnerName: studentName,
                  learnerId,
                })}{' '}
                Response:
              </span>
            </div>
          </CardContent>

          {/* Content with partial preview */}
          <div className="relative">
            <CardContent
              className={`p-4 pt-0 transition-all duration-300 ${
                submissionOpen ? 'max-h-none' : 'max-h-32 overflow-hidden'
              }`}
            >
              {/* Fade overlay when collapsed */}
              {!submissionOpen && (
                <>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-blue-50/80 to-transparent dark:from-blue-950/80" />
                  {/* Chevron button in center bottom */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mb-1 size-8 border border-blue-200/50 bg-blue-50/90 hover:bg-blue-100/90 dark:border-blue-800/50 dark:bg-blue-950/90 dark:hover:bg-blue-900/90"
                      onClick={() => setSubmissionOpen(!submissionOpen)}
                    >
                      <ChevronDown className="size-4" />
                      <span className="sr-only">Expand submission</span>
                    </Button>
                  </div>
                </>
              )}

              {/* Chevron up button when expanded - positioned at the end */}
              {submissionOpen && (
                <div className="absolute inset-x-0 bottom-0 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mb-1 mt-4 size-8 border border-blue-200/50 bg-blue-50/90 hover:bg-blue-100/90 dark:border-blue-800/50 dark:bg-blue-950/90 dark:hover:bg-blue-900/90"
                    onClick={() => setSubmissionOpen(!submissionOpen)}
                  >
                    <ChevronUp className="size-4" />
                    <span className="sr-only">Collapse submission</span>
                  </Button>
                </div>
              )}
              <div
                className="prose prose-zinc dark:prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  )
}
