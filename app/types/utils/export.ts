// Import types from domain

/**
 * Export Format Types
 */
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json'

/**
 * Export Options
 */
export interface ExportOptions {
  format: ExportFormat
  includeAnswers?: boolean
  includeFeedback?: boolean
  includeMetadata?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: {
    status?: string[]
    grade?: number[]
    subject?: string[]
  }
}

/**
 * PDF Export Options
 */
export interface PDFExportOptions extends ExportOptions {
  format: 'pdf'
  includeCoverPage?: boolean
  includeTableOfContents?: boolean
  pageSize?: 'A4' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  header?: string
  footer?: string
}

/**
 * Excel Export Options
 */
export interface ExcelExportOptions extends ExportOptions {
  format: 'excel'
  sheetName?: string
  includeCharts?: boolean
  includeFormulas?: boolean
}

/**
 * CSV Export Options
 */
export interface CSVExportOptions extends ExportOptions {
  format: 'csv'
  delimiter?: ',' | ';' | '\t'
  encoding?: 'utf8' | 'utf16'
  includeHeaders?: boolean
}

/**
 * Export Result
 */
export interface ExportResult {
  success: boolean
  fileUrl?: string
  fileName?: string
  fileSize?: number
  error?: string
}

/**
 * Export Progress
 */
export interface ExportProgress {
  current: number
  total: number
  percentage: number
  status: 'preparing' | 'processing' | 'generating' | 'completed' | 'error'
  message?: string
}
