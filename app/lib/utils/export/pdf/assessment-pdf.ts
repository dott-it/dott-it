/**
 * Export assessment to PDF and DOC
 */

import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, HeadingLevel } from 'docx'
import type { Assessment, StudentRecord } from '../types'
import { generateAssessmentReportFileName, saveFile } from '../utils/file-utils'
import { getStatusLabel } from '../utils/status-utils'

/**
 * Export assessment as PDF using jsPDF
 */
export async function exportAssessmentToPDF(
  assessment: Assessment,
  students: StudentRecord[],
  totalStudents: number,
  handedIn: number,
  readyForReview: number,
  inProgress: number,
  sent: number,
): Promise<void> {
  const doc = new jsPDF()

  // Set up the document
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`Assessment Report: ${assessment.title}`, 20, 20)

  // Assessment info
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  if (assessment.unitName) {
    doc.text(`Unit: ${assessment.unitName}`, 20, 35)
  }
  if (assessment.maxScore) {
    doc.text(`Total Questions: ${assessment.maxScore}`, 20, 45)
  }
  if (assessment.dueDate) {
    doc.text(`Due Date: ${new Date(assessment.dueDate).toLocaleDateString()}`, 20, 55)
  }

  let yPosition = 70

  // Student Statistics
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT STATISTICS', 20, yPosition)
  yPosition += 15

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Students: ${totalStudents}`, 20, yPosition)
  yPosition += 8
  doc.text(`Handed In: ${handedIn}`, 20, yPosition)
  yPosition += 8
  doc.text(`Ready for Review: ${readyForReview}`, 20, yPosition)
  yPosition += 8
  doc.text(`In Progress: ${inProgress}`, 20, yPosition)
  yPosition += 8
  doc.text(`Sent: ${sent}`, 20, yPosition)
  yPosition += 15

  // Student List
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT LIST', 20, yPosition)
  yPosition += 15

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  for (const [index, student] of students.entries()) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    const studentText = `${index + 1}. ${student.name} - ${getStatusLabel(
      student.status || 'unknown',
    )}${student.score ? ` (Score: ${student.score}/${student.maxScore || 100})` : ''}`

    const lines = doc.splitTextToSize(studentText, 170)
    doc.text(lines, 20, yPosition)
    yPosition += lines.length * 5 + 5
  }

  // Save the PDF
  const fileName = generateAssessmentReportFileName(assessment.title, 'pdf')
  doc.save(fileName)
}

/**
 * Export assessment as DOC using docx library
 */
export async function exportAssessmentToDOC(
  assessment: Assessment,
  students: StudentRecord[],
  totalStudents: number,
  handedIn: number,
  readyForReview: number,
  inProgress: number,
  sent: number,
): Promise<void> {
  const children: Paragraph[] = []

  // Title
  children.push(
    new Paragraph({
      text: `Assessment Report: ${assessment.title}`,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 400 },
    }),
  )

  // Assessment info
  if (assessment.unitName) {
    children.push(
      new Paragraph({
        text: `Unit: ${assessment.unitName}`,
        spacing: { after: 200 },
      }),
    )
  }

  if (assessment.maxScore) {
    children.push(
      new Paragraph({
        text: `Total Questions: ${assessment.maxScore}`,
        spacing: { after: 200 },
      }),
    )
  }

  if (assessment.dueDate) {
    children.push(
      new Paragraph({
        text: `Due Date: ${new Date(assessment.dueDate).toLocaleDateString()}`,
        spacing: { after: 200 },
      }),
    )
  }

  // Student Statistics
  children.push(
    new Paragraph({
      text: 'Student Statistics',
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    }),
  )

  const statistics = [
    `Total Students: ${totalStudents}`,
    `Handed In: ${handedIn}`,
    `Ready for Review: ${readyForReview}`,
    `In Progress: ${inProgress}`,
    `Sent: ${sent}`,
  ]

  for (const stat of statistics) {
    children.push(
      new Paragraph({
        text: stat,
        spacing: { after: 100 },
      }),
    )
  }

  // Student List
  children.push(
    new Paragraph({
      text: 'Student List',
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 200 },
    }),
  )

  for (const [index, student] of students.entries()) {
    const studentText = `${index + 1}. ${student.name} - ${getStatusLabel(
      student.status || 'unknown',
    )}${student.score ? ` (Score: ${student.score}/${student.maxScore || 100})` : ''}`

    children.push(
      new Paragraph({
        text: studentText,
        spacing: { after: 100 },
      }),
    )
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  // Save the document
  const fileName = generateAssessmentReportFileName(assessment.title, 'doc')
  const buffer = await Packer.toBuffer(doc)
  saveFile(new Blob([new Uint8Array(buffer)]), fileName)
}
