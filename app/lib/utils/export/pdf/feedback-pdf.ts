/**
 * Export feedback to PDF and DOC - Eco-friendly optimized
 * Features:
 * - Duplex printing compatible (front and back)
 * - Minimal ink usage with optimized colors
 * - Modern, readable design
 * - Learning-friendly layout
 */

import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import type { Assessment } from '../types'
import { generateFeedbackFileName, saveFile } from '../utils/file-utils'
import {  Answers, AssessmentRecord, FeedbackSection } from '@/app/types'
import { 
  ECO_COLORS, 
  ECO_COLORS_HEX as _ECO_COLORS_HEX, 
  TYPOGRAPHY, 
  TYPOGRAPHY_DOC as _TYPOGRAPHY_DOC,
  getEcoFeedbackColor,
  getEcoFeedbackColorHex,
  getEcoDocumentProperties
} from '../utils/eco-friendly-config'
import {
  addUnifiedHeaderToPDF,
  addUnifiedHeaderToDOC,
  addUnifiedPageNumbersToPDF,
  extractHeaderInfo,
  ensureEvenPagesForDuplex,
  UnifiedHeaderInfo,
} from '../utils/unified-export-helpers'

/** Optional layout toggles (export preview). Omitted fields default to true. */
export interface FeedbackExportLayoutOptions {
  includeStudentHeader?: boolean
  includeAssessmentDetails?: boolean
}

/**
 * Export feedback as PDF using jsPDF - Eco-friendly optimized
 */
export async function exportFeedbackToPDF(
  feedbackCards: FeedbackSection[],
  studentRecord: AssessmentRecord,
  assessment: Assessment,
  answers?: Answers[],
  layout?: FeedbackExportLayoutOptions,
): Promise<void> {
  // Create PDF with eco-friendly settings
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true // Enable compression for smaller file size
  })

  // Set up eco-friendly document properties
  doc.setProperties(getEcoDocumentProperties(
    `Feedback for ${studentRecord.learnerName}`,
    `Assessment: ${assessment.title}`
  ))

  let _yPosition = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const _contentWidth = pageWidth - 40 // 20mm margins on each side

  const includeStudentHeader = layout?.includeStudentHeader !== false
  const includeAssessmentDetails = layout?.includeAssessmentDetails !== false

  // Add unified header
  const headerInfo: UnifiedHeaderInfo = {
    studentName: studentRecord.learnerName || 'Unknown',
    assessmentTitle: assessment.title,
    classSection: studentRecord.classSection
  }
  _yPosition = addUnifiedHeaderToPDF(doc, headerInfo, _yPosition, {
    includeStudent: includeStudentHeader,
    includeAssessmentTitle: includeAssessmentDetails,
    includeClassSection: includeStudentHeader,
  })

  // Add assessment information in compact format
  if (includeAssessmentDetails) {
    _yPosition = addAssessmentInfo(doc, assessment, studentRecord, _yPosition, _contentWidth)
  }

  // Add student answers in eco-friendly format
  if (answers && answers.length > 0) {
    _yPosition = addStudentAnswers(doc, answers, _yPosition, _contentWidth)
  }

  // Add feedback section with modern design
  _yPosition = addFeedbackSection(doc, feedbackCards, _yPosition, _contentWidth)

  // Ensure even number of pages for duplex printing
  const originalPageCount = doc.getNumberOfPages()
  ensureEvenPagesForDuplex(doc)
  
  // Add unified page numbers with student name
  addUnifiedPageNumbersToPDF(doc, headerInfo.studentName, originalPageCount)

  // Save the document with eco-friendly filename
  const fileName = generateFeedbackFileName(studentRecord.learnerName, assessment.title, 'pdf')
  doc.save(fileName)
}

// Helper function to add eco-friendly header
function _addEcoHeader(doc: jsPDF, studentRecord: AssessmentRecord, assessment: Assessment, yPosition: number, contentWidth: number): void {
  // Use minimal ink colors
  doc.setTextColor(ECO_COLORS.primary[0], ECO_COLORS.primary[1], ECO_COLORS.primary[2])
  doc.setFontSize(TYPOGRAPHY.title.size)
  doc.setFont('helvetica', TYPOGRAPHY.title.weight as 'normal' | 'bold')
  
  // Add subtle background for header (very light)
  doc.setFillColor(ECO_COLORS.light[0], ECO_COLORS.light[1], ECO_COLORS.light[2])
  doc.rect(20, yPosition - 5, contentWidth, 25, 'F')
  
  // Add title with minimal ink
  doc.text(`Feedback for ${studentRecord.learnerName}`, 25, yPosition + 8)
  
  // Add assessment title in smaller font
  doc.setFontSize(TYPOGRAPHY.subtitle.size)
  doc.setTextColor(ECO_COLORS.secondary[0], ECO_COLORS.secondary[1], ECO_COLORS.secondary[2])
  doc.text(assessment.title, 25, yPosition + 15)
  
  // Add eco-friendly indicator
  doc.setFontSize(TYPOGRAPHY.small.size)
  doc.setTextColor(ECO_COLORS.accent[0], ECO_COLORS.accent[1], ECO_COLORS.accent[2])
  doc.text('🌱 Eco-friendly print optimized', contentWidth - 20, yPosition + 15, { align: 'right' })
}

// Helper function to add assessment information
function addAssessmentInfo(doc: jsPDF, assessment: Assessment, studentRecord: AssessmentRecord, yPosition: number, _contentWidth: number): number {
  doc.setFontSize(TYPOGRAPHY.body.size)
  doc.setFont('helvetica', TYPOGRAPHY.body.weight as 'normal' | 'bold')
  doc.setTextColor(ECO_COLORS.primary[0], ECO_COLORS.primary[1], ECO_COLORS.primary[2])
  
  const infoItems = []
  if (assessment.unitName) infoItems.push(`Unit: ${assessment.unitName}`)
  if (studentRecord.submittedAt) infoItems.push(`Submitted: ${new Date(studentRecord.submittedAt).toLocaleDateString()}`)
  
  // Add info in compact format
  for (const item of infoItems) {
    doc.text(item, 25, yPosition)
    yPosition += 6
  }
  
  return yPosition + 5
}

// Helper function to add student answers
function addStudentAnswers(doc: jsPDF, answers: Answers[], yPosition: number, contentWidth: number): number {
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }
  
  // Add section header with minimal ink
  doc.setFontSize(TYPOGRAPHY.subtitle.size)
  doc.setFont('helvetica', TYPOGRAPHY.subtitle.weight as 'normal' | 'bold')
  doc.setTextColor(ECO_COLORS.primary[0], ECO_COLORS.primary[1], ECO_COLORS.primary[2])
  doc.text('Student Responses', 25, yPosition)
  yPosition += 10
  
  doc.setFontSize(TYPOGRAPHY.body.size)
  doc.setFont('helvetica', TYPOGRAPHY.body.weight as 'normal' | 'bold')
  
  // Process each answer with eco-friendly formatting
  for (const [index, answer] of answers.entries()) {
    if (!answer.title || !answer.value) continue
    
    // Check for page break
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    // Add question with minimal ink
    doc.setTextColor(ECO_COLORS.primary[0], ECO_COLORS.primary[1], ECO_COLORS.primary[2])
    doc.setFont('helvetica', 'bold')
    const title = answer.title.replaceAll('\n', ' ').trim()
    const titleLines = doc.splitTextToSize(title, contentWidth - 10)
    doc.text(titleLines, 30, yPosition)
    yPosition += titleLines.length * 4 + 3
    
    // Add answer with lighter color
    doc.setTextColor(ECO_COLORS.secondary[0], ECO_COLORS.secondary[1], ECO_COLORS.secondary[2])
    doc.setFont('helvetica', 'normal')
    const valueLines = doc.splitTextToSize(String(answer.value), contentWidth - 15)
    doc.text(valueLines, 35, yPosition)
    yPosition += valueLines.length * 4 + 8
    
    // Add subtle separator (minimal ink)
    if (index < answers.length - 1) {
      doc.setDrawColor(ECO_COLORS.border[0], ECO_COLORS.border[1], ECO_COLORS.border[2])
      doc.line(30, yPosition, contentWidth + 10, yPosition)
      yPosition += 5
    }
  }
  
  return yPosition + 10
}

// Helper function to add feedback section
function addFeedbackSection(doc: jsPDF, feedbackCards: FeedbackSection[], yPosition: number, contentWidth: number): number {
  const sortedFeedbackCards = [...feedbackCards].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  
  if (sortedFeedbackCards.length === 0) return yPosition
  
  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }
  
  // Add feedback section header
  doc.setFontSize(TYPOGRAPHY.subtitle.size)
  doc.setFont('helvetica', TYPOGRAPHY.subtitle.weight as 'normal' | 'bold')
  doc.setTextColor(ECO_COLORS.primary[0], ECO_COLORS.primary[1], ECO_COLORS.primary[2])
  doc.text('Feedback', 25, yPosition)
  yPosition += 12
  
  doc.setFontSize(TYPOGRAPHY.body.size)
  doc.setFont('helvetica', TYPOGRAPHY.body.weight as 'normal' | 'bold')
  
  // Process each feedback card with eco-friendly design
  for (const [index, card] of sortedFeedbackCards.entries()) {
    // Check for page break
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    // Get eco-friendly color for feedback type
    const typeColor = getEcoFeedbackColor(card.type)
    const typeLabel = card.type.toUpperCase()
    
    // Add feedback item with minimal ink design
    doc.setTextColor(...typeColor)
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${typeLabel}`, 30, yPosition)
    yPosition += 6
    
    // Add section if available
    if (card.section) {
      doc.setTextColor(ECO_COLORS.secondary[0], ECO_COLORS.secondary[1], ECO_COLORS.secondary[2])
      doc.setFont('helvetica', 'normal')
      doc.text(`Section: ${card.section}`, 35, yPosition)
      yPosition += 5
    }
    
    // Add content with optimal line spacing
    doc.setTextColor(ECO_COLORS.primary[0], ECO_COLORS.primary[1], ECO_COLORS.primary[2])
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(card.content, contentWidth - 15)
    doc.text(lines, 35, yPosition)
    yPosition += lines.length * 4 + 10
  }
  
  return yPosition
}



/**
 * Export feedback as DOC using docx library - Eco-friendly optimized
 */
export async function exportFeedbackToDOC(
  feedbackCards: FeedbackSection[],
  studentRecord: AssessmentRecord,
  assessment: Assessment,
  answers?: Answers[],
  layout?: FeedbackExportLayoutOptions,
): Promise<void> {
  const children: Paragraph[] = []

  const includeStudentHeader = layout?.includeStudentHeader !== false
  const includeAssessmentDetails = layout?.includeAssessmentDetails !== false

  // Add unified header
  const headerInfo = extractHeaderInfo(studentRecord, assessment)
  addUnifiedHeaderToDOC(children, headerInfo, true, {
    includeStudent: includeStudentHeader,
    includeAssessmentTitle: includeAssessmentDetails,
    includeClassSection: includeStudentHeader,
  })

  // Additional assessment info (if needed)

  if (includeAssessmentDetails && assessment.unitName) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Unit: ${assessment.unitName}`,
            size: 18,
            color: '666666'
          })
        ],
        spacing: { after: 150 },
      }),
    )
  }

  // Add student answers in eco-friendly format
  const assessmentInfoParagraphs: Paragraph[] = []
  if (answers && answers.length > 0) {
    
    // Add Student Answers heading with minimal ink
    children.push(
      new Paragraph({
        children: [
          new TextRun({ 
            text: 'Student Responses', 
            bold: true, 
            size: 24,
            color: '333333' // Dark gray instead of black
          })
        ],
        spacing: { after: 200, before: 150 },
      })
    )
    
    // Process each answer with eco-friendly formatting
    for (const [index, answer] of answers.entries()) {
      if (!answer.title || !answer.value) continue
      
      // Add answer title with minimal ink
      assessmentInfoParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: answer.title, 
              bold: true,
              size: 20,
              color: '333333'
            })
          ],
          spacing: { after: 80 },
          indent: { left: 200 },
        })
      )
      
      // Add answer value with lighter color
      const valueParagraphs = String(answer.value).split('\n').filter(line => line.trim())
      for (const paragraph of valueParagraphs) {
        assessmentInfoParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: paragraph.trim(),
                size: 18,
                color: '666666' // Medium gray for content
              })
            ],
            spacing: { after: 80 },
            indent: { left: 400 },
          })
        )
      }
      
      // Add minimal separator between answers
      if (index < answers.length - 1) {
        assessmentInfoParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ 
                text: '•'.repeat(20), 
                color: 'CCCCCC', // Very light gray
                size: 16
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
          })
        )
      }
    }
    
    // Add minimal spacing after all answers
    assessmentInfoParagraphs.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    )
  }

  children.push(...assessmentInfoParagraphs)

  // Add feedback section with eco-friendly design
  const sortedFeedbackCards = [...feedbackCards].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  
  if (sortedFeedbackCards.length > 0) {
    // Add feedback section header with minimal ink
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Feedback',
            bold: true,
            size: 24,
            color: '333333'
          })
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 150 },
      }),
    )

    // Process feedback cards with eco-friendly formatting
    const feedbackParagraphs = sortedFeedbackCards.flatMap((card, index) => {
      const paragraphs: Paragraph[] = []

      // Get eco-friendly color for feedback type
      const typeColor = getEcoFeedbackColorHex(card.type)
      const typeLabel = card.type.toUpperCase()
      
      // Add feedback type with minimal ink
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ 
              text: `${index + 1}. ${typeLabel}`, 
              bold: true,
              size: 20,
              color: typeColor
            })
          ],
          spacing: { after: 80 },
        }),
      )

      // Add section if available
      if (card.section) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Section: ${card.section}`,
                size: 18,
                color: '666666'
              })
            ],
            spacing: { after: 60 },
          }),
        )
      }

      // Add content with optimal formatting
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: card.content,
              size: 18,
              color: '333333'
            })
          ],
          spacing: { after: 200 }, // Reduced spacing for eco-friendly design
        }),
      )

      return paragraphs
    })

    children.push(...feedbackParagraphs)
  }

  // Create eco-friendly document with optimized settings
  const doc = new Document({
    title: `Feedback for ${studentRecord.learnerName}`,
    description: `Assessment: ${assessment.title} - Eco-friendly optimized`,
    creator: 'Eddo Learning Platform',
    keywords: 'feedback, assessment, learning, eco-friendly, duplex',
    sections: [
      {
        children,
      },
    ],
  })

  // Save the document with eco-friendly filename
  const fileName = generateFeedbackFileName(studentRecord.learnerName, assessment.title, 'doc')
  const buffer = await Packer.toBuffer(doc)
  saveFile(new Blob([new Uint8Array(buffer)]), fileName)
}

