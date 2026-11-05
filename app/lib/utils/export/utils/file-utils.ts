/**
 * File utility functions for export operations
 */

import { saveAs } from 'file-saver'

/**
 * Generate a safe filename by replacing spaces and special characters
 */
export const generateSafeFileName = (baseName: string, extension: string): string => {
  const safeName = baseName
    .replaceAll(/\s+/g, '_')
    .replaceAll(/[^a-zA-Z0-9_-]/g, '')
    .toLowerCase()

  return `${safeName}.${extension}`
}

/**
 * Save a file using file-saver
 */
export const saveFile = (content: Blob, fileName: string): void => {
  saveAs(content, fileName)
}

/**
 * Generate feedback filename
 */
export const generateFeedbackFileName = (
  studentName: string,
  assessmentTitle: string,
  format: 'pdf' | 'doc',
): string => {
  const baseName = `feedback_${studentName}_${assessmentTitle}`
  return generateSafeFileName(baseName, format)
}

/**
 * Generate assessment report filename
 */
export const generateAssessmentReportFileName = (
  assessmentTitle: string,
  format: 'pdf' | 'doc',
): string => {
  const baseName = `assessment_report_${assessmentTitle}`
  return generateSafeFileName(baseName, format)
}

/**
 * Generate assessment history filename
 */
export const generateAssessmentHistoryFileName = (
  studentName: string,
  assessmentTitle: string,
  format: 'pdf' | 'doc',
): string => {
  const baseName = `assessment_history_${studentName}_${assessmentTitle}`
  return generateSafeFileName(baseName, format)
}
