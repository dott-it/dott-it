/**
 * Unified Export Helpers
 * 
 * This module provides centralized functions for consistent export formatting
 * across all export locations in the application.
 */

import jsPDF from 'jspdf'
import { Paragraph, TextRun, HeadingLevel } from 'docx'
import type { AssessmentRecord, FeedbackSection as _FeedbackSection } from '@/types'

/**
 * Unified header information interface
 */
export interface UnifiedHeaderInfo {
  studentName: string
  assessmentTitle: string
  classSection?: string
}

export interface UnifiedHeaderPdfOptions {
  includeStudent?: boolean
  includeAssessmentTitle?: boolean
  includeClassSection?: boolean
}

/**
 * Add unified header to PDF document
 */
export function addUnifiedHeaderToPDF(
  doc: jsPDF,
  headerInfo: UnifiedHeaderInfo,
  yPosition: number,
  options?: UnifiedHeaderPdfOptions
): number {
  const includeStudent = options?.includeStudent !== false
  const includeAssessmentTitle = options?.includeAssessmentTitle !== false
  const includeClassSection = options?.includeClassSection !== false

  if (includeStudent) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(headerInfo.studentName, 20, yPosition)
    yPosition += 12
  }

  if (includeAssessmentTitle) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(headerInfo.assessmentTitle, 20, yPosition)
    yPosition += 10
  }

  if (includeClassSection && headerInfo.classSection) {
    doc.text(`Class: ${headerInfo.classSection}`, 20, yPosition)
    yPosition += 10
  }
  yPosition += 10

  return yPosition
}

export interface UnifiedHeaderDocOptions {
  includeStudent?: boolean
  includeAssessmentTitle?: boolean
  includeClassSection?: boolean
}

/**
 * Add unified header to DOC document
 */
export function addUnifiedHeaderToDOC(
  children: Paragraph[],
  headerInfo: UnifiedHeaderInfo,
  isFirstStudent: boolean = false,
  options?: UnifiedHeaderDocOptions
): void {
  const includeStudent = options?.includeStudent !== false
  const includeAssessmentTitle = options?.includeAssessmentTitle !== false
  const includeClassSection = options?.includeClassSection !== false

  const headerParagraphs: Paragraph[] = []

  if (includeStudent) {
    headerParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: headerInfo.studentName,
            bold: true,
            size: 24,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 150, before: isFirstStudent ? 0 : 400 },
      }),
    )
  }

  if (includeAssessmentTitle) {
    headerParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: headerInfo.assessmentTitle,
            size: 18,
          }),
        ],
        spacing: { after: 150 },
      }),
    )
  }

  if (includeClassSection && headerInfo.classSection) {
    headerParagraphs.push(
      new Paragraph({
        text: `Class: ${headerInfo.classSection}`,
        spacing: { after: 200 },
      }),
    )
  }

  children.push(...headerParagraphs)
}

/**
 * Add unified page numbering with student name to PDF
 */
export function addUnifiedPageNumbersToPDF(
  doc: jsPDF,
  studentName: string,
  totalPages: number
): void {
  const finalTotalPages = doc.getNumberOfPages() // Use actual total after duplex adjustment
  
  for (let i = 1; i <= finalTotalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    // Check if this is a blank page for duplex printing
    const isBlankPage = i > totalPages
    
    if (isBlankPage) {
      // Don't add page numbers to blank pages, just leave them blank
      continue
    }
    
    // Add student name and page number in footer
    const pageText = `${studentName} (${i}/${totalPages})`
    // Position text further from the right edge to prevent cutting
    const textWidth = doc.getTextWidth(pageText)
    const xPosition = doc.internal.pageSize.getWidth() - textWidth - 20
    doc.text(pageText, xPosition, doc.internal.pageSize.getHeight() - 10)
  }
}

/**
 * Add unified page numbering with student name to PDF for multiple students
 */
export function addUnifiedPageNumbersToPDFMultiple(
  doc: jsPDF,
  studentPageRanges: { start: number; end: number; studentIndex: number; originalEnd: number }[],
  assessmentRecords: AssessmentRecord[]
): void {
  for (let i = 1; i <= doc.getNumberOfPages(); i++) {
    doc.setPage(i)
    
    // Find which student this page belongs to
    const studentRange = studentPageRanges.find(range => i >= range.start && i <= range.end)
    
    if (studentRange) {
      const pageInStudent = i - studentRange.start + 1
      const totalPagesForStudent = studentRange.originalEnd - studentRange.start + 1
      const studentName = assessmentRecords[studentRange.studentIndex].learnerName || 'Unknown'
      
      // Check if this is a blank page for duplex printing
      const isBlankPage = i > studentRange.originalEnd
      
      if (isBlankPage) {
        // Don't add page numbers to blank pages, just leave them blank
        continue
      }
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      // Add student name and page number in footer
      const pageText = `${studentName} (${pageInStudent}/${totalPagesForStudent})`
      // Position text further from the right edge to prevent cutting
      const textWidth = doc.getTextWidth(pageText)
      const xPosition = doc.internal.pageSize.getWidth() - textWidth - 20
      doc.text(pageText, xPosition, doc.internal.pageSize.getHeight() - 10)
    }
  }
}

/**
 * Extract header information from assessment record and assessment
 */
export function extractHeaderInfo(
  assessmentRecord: AssessmentRecord,
  assessment: { title: string }
): UnifiedHeaderInfo {
  return {
    studentName: assessmentRecord.learnerName || 'Unknown',
    assessmentTitle: assessment.title,
    classSection: assessmentRecord.classSection
  }
}

/**
 * Ensure even number of pages for duplex printing compatibility
 */
export function ensureEvenPagesForDuplex(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages()
  
  // If odd number of pages, add a blank page
  if (totalPages % 2 !== 0) {
    doc.addPage()
    
    // Add a small note on the blank page (optional)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(150, 150, 150) // Light gray
    doc.text('This page intentionally left blank for duplex printing', 20, doc.internal.pageSize.getHeight() - 10)
  }
}

/**
 * Generate consistent filename for exports
 */
export function generateUnifiedFileName(
  studentName: string,
  assessmentTitle: string,
  format: 'pdf' | 'doc',
  suffix?: string
): string {
  const cleanStudentName = studentName.replaceAll(/[^a-zA-Z0-9]/g, '_')
  const cleanAssessmentTitle = assessmentTitle.replaceAll(/[^a-zA-Z0-9]/g, '_')
  const suffixText = suffix ? `_${suffix}` : ''
  
  return `${cleanStudentName}_${cleanAssessmentTitle}${suffixText}.${format}`
}
