'use client'

import React from 'react'

interface AssessmentHistoryFooterProps {
  studentName?: string
  showStudentInfo?: boolean
  isLoading?: boolean
}

/**
 * Minimal footer for assessment history (thread layout).
 * When lastSubmissionMessage exists, the container does not render this footer;
 * feedback is managed in the main FeedbackSection area.
 */
export function AssessmentHistoryFooter({
  studentName: _studentName,
  showStudentInfo: _showStudentInfo = false,
  isLoading = false,
}: AssessmentHistoryFooterProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background" aria-hidden={isLoading}>
      {/* Footer content removed: draft and message composer live in FeedbackSection (main content) when in Lovable layout */}
    </div>
  )
}
