/**
 * Export utilities - Main entry point
 *
 * This module provides a clean API for exporting various types of data
 * in different formats (PDF, DOC).
 */

// Export all types
export type * from './types'

// Export all utility functions
export * from './utils'
export * from './utils/unified-export-helpers'

// Export PDF functions (which now include both PDF and DOC)
export * from './pdf'

// Export DOC functions
export * from './doc'

// Legacy exports for backward compatibility
export { exportFeedbackToPDF, exportFeedbackToDOC } from './pdf/feedback-pdf'
export { exportAssessmentToPDF, exportAssessmentToDOC } from './pdf/assessment-pdf'
export { 
  exportAssessmentHistoryToPDF, 
  exportAssessmentHistoryToDOC, 
  exportAllAssessmentRubricToPDF, 
  exportAllAssessmentRubricToCSV, 
  exportSingleStudentRubricToPDF,
  exportMultipleAssessmentHistoriesToPDF,
  exportMultipleAssessmentHistoriesToDOC
} from './pdf/history-pdf'
