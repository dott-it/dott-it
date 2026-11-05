/**
 * Export assessment history to PDF and DOC
 */

import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx'
import { generateAssessmentHistoryFileName, saveFile } from '../utils/file-utils'
import { addUnifiedHeaderToPDF, addUnifiedHeaderToDOC, addUnifiedPageNumbersToPDF, addUnifiedPageNumbersToPDFMultiple, extractHeaderInfo, ensureEvenPagesForDuplex } from '../utils/unified-export-helpers'
import { AssessmentRecord, StudentAnswer, Feedback } from '@/types'
import { ActiveAssessment } from '@/types'
import { filterAnswersForExport } from '@/app/lib/export/student-answer-filters'
import { feedbacksForHistoryExport } from '@/app/lib/export/feedbacks-for-history-export'

// A timeline item can be a student's answer submission or a feedback instance
type TimelineItem =
  | { type: 'answer'; date: Date; data: StudentAnswer }
  | { type: 'feedback'; date: Date; data: Feedback }






/**
 * Export assessment rubric as PDF using jsPDF
 */
export async function exportAllAssessmentRubricToPDF(
  assessmentRecords: AssessmentRecord[],
  assessment: ActiveAssessment,
): Promise<void> {
  const doc = new jsPDF()
  let yPosition = 20

  // --- Document Header ---
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`${assessment.title} - Rubric Evaluations`, 20, yPosition)
  yPosition += 15

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  if (assessment.unitName) {
    doc.text(`Unit: ${assessment.unitName}`, 20, yPosition)
    yPosition += 10
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition)
  yPosition += 20

  // Process each assessment record
  for (const assessmentRecord of assessmentRecords) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    console.log('assessmentRecord', assessmentRecord)
    // Get the last student answer
    const lastStudentAnswer = assessmentRecord.studentAnswers?.at(-1)
    if (!lastStudentAnswer) continue

    console.log('lastStudentAnswer', lastStudentAnswer)

    // Get the last AI suggestion from the last student answer
    const lastAiSuggestion = lastStudentAnswer.aiSuggestions?.at(-1)
    if (!lastAiSuggestion || !lastAiSuggestion.rubricEvaluation) continue

    // --- Student Header ---
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Student: ${assessmentRecord.learnerName || 'Unknown'}`, 20, yPosition)
    yPosition += 10

    // --- Display Rubric Evaluations ---
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Rubric Evaluations:', 20, yPosition)
    yPosition += 10

    // Display each rubric evaluation
    for (const [index, evaluation] of lastAiSuggestion.rubricEvaluation.entries()) {
      // Check if we need a new page
      if (yPosition > 230) {
        doc.addPage()
        yPosition = 20
      }

      // Criterion header
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(59, 130, 246) // Blue color
      doc.text(`${index + 1}. ${evaluation.criterion || 'N/A'}`, 25, yPosition)
      yPosition += 8

      // Evaluation and Points
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0) // Black
      doc.text(`Evaluation: ${evaluation.evaluation || 'N/A'}`, 30, yPosition)
      yPosition += 6
      doc.text(`Points: ${evaluation.points || 'N/A'}`, 30, yPosition)
      yPosition += 8

      // Rationale
      if (evaluation.rationale) {
        doc.setFont('helvetica', 'italic')
        doc.text('Rationale:', 30, yPosition)
        yPosition += 6
        
        const rationaleLines = doc.splitTextToSize(evaluation.rationale, 160)
        doc.setFont('helvetica', 'normal')
        doc.text(rationaleLines, 35, yPosition)
        yPosition += rationaleLines.length * 5 + 10
      } else {
        yPosition += 5
      }
    }

    yPosition += 15 // Space between students
  }

  // --- Save Document ---
  const fileName = `${assessment.title.replaceAll(/[^a-z0-9]/gi, '_')}_Rubric_Evaluations.pdf`
  doc.save(fileName)
}

/**
 * Export assessment rubric as CSV
 */
export async function exportAllAssessmentRubricToCSV(
  assessmentRecords: AssessmentRecord[],
  assessment: ActiveAssessment,
): Promise<void> {
  // Collect all unique rubric criteria from all students
  const allCriteria = new Set<string>()
  const studentData: Array<{
    studentName: string
    rubrics: Record<string, string | number>
    total: number
  }> = []

  // First pass: collect all criteria and student data
  for (const assessmentRecord of assessmentRecords) {
    const lastStudentAnswer = assessmentRecord.studentAnswers?.at(-1)
    if (!lastStudentAnswer) continue

    const lastAiSuggestion = lastStudentAnswer.aiSuggestions?.at(-1)
    if (!lastAiSuggestion || !lastAiSuggestion.rubricEvaluation) continue

    const studentRubrics: Record<string, string | number> = {}
    let total = 0

    // Process each rubric evaluation for this student
    for (const evaluation of lastAiSuggestion.rubricEvaluation) {
      const criterion = evaluation.criterion || 'Unknown Criterion'
      const points = Number.parseFloat(evaluation.points || '0') || 0
      
      // Create column headers for criterion (with points) and rationale
      const criterionWithPoints = `${criterion} (Points)`
      const rationaleLabel = `${criterion} (Rationale)`
      
      allCriteria.add(criterionWithPoints)
      allCriteria.add(rationaleLabel)
      
      studentRubrics[criterionWithPoints] = points
      studentRubrics[rationaleLabel] = evaluation.rationale || 'N/A'
      
      total += points
    }

    studentData.push({
      studentName: assessmentRecord.learnerName || 'Unknown',
      rubrics: studentRubrics,
      total
    })
  }

  // Convert Set to sorted array for consistent column order
  // Sort to ensure criterion (Points) comes before criterion (Rationale)
  const criteriaArray = [...allCriteria].sort((a, b) => {
    // Extract the base criterion name
    const baseA = a.replace(/ \((Points|Rationale)\)$/, '')
    const baseB = b.replace(/ \((Points|Rationale)\)$/, '')
    
    // If same base criterion, Points comes before Rationale
    if (baseA === baseB) {
      return a.includes('(Points)') ? -1 : 1
    }
    
    // Otherwise, sort alphabetically by base criterion
    return baseA.localeCompare(baseB)
  })

  // Build CSV content
  const csvRows: string[] = []
  
  // Header row
  const headers = ['Student Name', ...criteriaArray, 'Total']
  csvRows.push(headers.map(header => `"${header}"`).join(','))

  // Data rows
  for (const student of studentData) {
    const row = [
      `"${student.studentName}"`,
      ...criteriaArray.map(criterion => {
        const value = student.rubrics[criterion]
        // Escape quotes in string values and wrap in quotes
        if (typeof value === 'string') {
          return `"${value.replaceAll('"', '""')}"`
        }
        return value || 0
      }),
      student.total
    ]
    csvRows.push(row.join(','))
  }

  // Create and download CSV
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${assessment.title.replaceAll(/[^a-z0-9]/gi, '_')}_Rubric_Evaluations.csv`)
    link.style.visibility = 'hidden'
    document.body.append(link)
    link.click()
    link.remove()
  }
}

/**
 * Export assessment rubric for a single student as PDF
 */
export async function exportSingleStudentRubricToPDF(
  assessmentRecord: AssessmentRecord,
  assessment: ActiveAssessment,
): Promise<void> {
  const doc = new jsPDF()
  let yPosition = 20

  // --- Document Header ---
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(`${assessment.title} - Rubric Evaluation`, 20, yPosition)
  yPosition += 15

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`Student: ${assessmentRecord.learnerName || 'Unknown'}`, 20, yPosition)
  yPosition += 15

  doc.setFontSize(12)
  if (assessment.unitName) {
    doc.text(`Unit: ${assessment.unitName}`, 20, yPosition)
    yPosition += 10
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition)
  yPosition += 20

  // Get the last student answer
  const lastStudentAnswer = assessmentRecord.studentAnswers?.at(-1)
  if (!lastStudentAnswer) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'italic')
    doc.text('No student answers found.', 20, yPosition)
    doc.save(`${assessmentRecord.learnerName || 'Student'}_Rubric_Evaluation.pdf`)
    return
  }

  // Get the last AI suggestion from the last student answer
  const lastAiSuggestion = lastStudentAnswer.aiSuggestions?.at(-1)
  if (!lastAiSuggestion || !lastAiSuggestion.rubricEvaluation) {
    doc.setFontSize(12)
    doc.setFont('helvetica', 'italic')
    doc.text('No rubric evaluation found for this student.', 20, yPosition)
    doc.save(`${assessmentRecord.learnerName || 'Student'}_Rubric_Evaluation.pdf`)
    return
  }

  // --- Display Rubric Evaluations ---
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Rubric Evaluations:', 20, yPosition)
  yPosition += 10

  // Display each rubric evaluation
  for (const [index, evaluation] of lastAiSuggestion.rubricEvaluation.entries()) {
    // Check if we need a new page
    if (yPosition > 230) {
      doc.addPage()
      yPosition = 20
    }

    // Criterion header
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246) // Blue color
    doc.text(`${index + 1}. ${evaluation.criterion || 'N/A'}`, 25, yPosition)
    yPosition += 8

    // Evaluation and Points
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0) // Black
    doc.text(`Evaluation: ${evaluation.evaluation || 'N/A'}`, 30, yPosition)
    yPosition += 6
    doc.text(`Points: ${evaluation.points || 'N/A'}`, 30, yPosition)
    yPosition += 8

    // Rationale
    if (evaluation.rationale) {
      doc.setFont('helvetica', 'italic')
      doc.text('Rationale:', 30, yPosition)
      yPosition += 6
      
      const rationaleLines = doc.splitTextToSize(evaluation.rationale, 160)
      doc.setFont('helvetica', 'normal')
      doc.text(rationaleLines, 35, yPosition)
      yPosition += rationaleLines.length * 5 + 10
    } else {
      yPosition += 5
    }
  }

  // --- Save Document ---
  const fileName = `${assessmentRecord.learnerName?.replaceAll(/[^a-z0-9]/gi, '_') || 'Student'}_Rubric_Evaluation.pdf`
  doc.save(fileName)
}

/**
 * Export assessment history as PDF using jsPDF
 */
export async function exportAssessmentHistoryToPDF(
  assessmentRecord: AssessmentRecord,
  assessment: ActiveAssessment,
): Promise<void> {
  const doc = new jsPDF()
  let yPosition = 20

  // --- Document Header ---
  const headerInfo = extractHeaderInfo(assessmentRecord, assessment)
  yPosition = addUnifiedHeaderToPDF(doc, headerInfo, yPosition)

  // --- Timeline of Events ---
  const studentAnswers = assessmentRecord.studentAnswers || []
  const feedbacks = feedbacksForHistoryExport(assessmentRecord.feedbacks)

  const timeline: TimelineItem[] = [
    ...studentAnswers.map((sa) => ({ type: 'answer' as const, date: new Date(sa.createdAt), data: sa })),
    ...feedbacks.map((fb) => ({ type: 'feedback' as const, date: new Date(fb.createdAt), data: fb })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const item of timeline) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    if (item.type === 'answer') {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`Student Answer Submitted at ${item.date.toLocaleString()}`, 20, yPosition)
      yPosition += 15

      {
        const filteredAnswers = filterAnswersForExport(item.data.answers)
        for (const answer of filteredAnswers) {
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          const titleLines = doc.splitTextToSize(answer.title, 170)
          doc.text(titleLines, 20, yPosition)
          yPosition += titleLines.length * 5 + 2

          doc.setFont('helvetica', 'normal')
          const valueLines = doc.splitTextToSize(answer.value, 170)
          doc.text(valueLines, 25, yPosition)
          yPosition += valueLines.length * 5 + 10
        }
      }
    } else if (item.type === 'feedback') {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`Feedback Provided at ${item.date.toLocaleString()}`, 20, yPosition)
      yPosition += 15

      const sortedFeedbackCards = item.data.feedbackSections?.sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      )

      if (sortedFeedbackCards?.length) {
        for (const [index, card] of sortedFeedbackCards.entries()) {
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 20
          }

          let typeColor: [number, number, number] = [0, 0, 0]
          const typeLabel = card.type.toUpperCase()
          switch (card.type.toLowerCase()) {
            case 'strength': {
              typeColor = [34, 197, 94] // Green
              break
            }
            case 'suggestion': {
              typeColor = [245, 158, 11] // Amber
              break
            }
            case 'comment': {
              typeColor = [107, 114, 128] // Gray
              break
            }
          }

          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...typeColor)
          doc.text(`${index + 1}. ${typeLabel}`, 20, yPosition)
          yPosition += 7

          doc.setTextColor(0, 0, 0)
          if (card.section) {
            doc.setFont('helvetica', 'normal')
            doc.text(`Section: ${card.section}`, 30, yPosition)
            yPosition += 7
          }

          doc.setFont('helvetica', 'normal')
          const lines = doc.splitTextToSize(card.content, 170)
          doc.text(lines, 30, yPosition)
          yPosition += lines.length * 5 + 15
        }
      }
    }
  }

  // Ensure even number of pages for duplex printing
  const originalPageCount = doc.getNumberOfPages()
  ensureEvenPagesForDuplex(doc)
  
  // Add unified page numbers with student name
  addUnifiedPageNumbersToPDF(doc, headerInfo.studentName, originalPageCount)

  // --- Save Document ---
  const fileName = generateAssessmentHistoryFileName(
    assessmentRecord.learnerName,
    assessment.title,
    'pdf',
  )
  doc.save(fileName)
}

/**
 * Export multiple assessment histories as a single PDF
 */
export async function exportMultipleAssessmentHistoriesToPDF(
  assessmentRecords: AssessmentRecord[],
  assessment: ActiveAssessment,
): Promise<void> {
  const doc = new jsPDF()
  let yPosition = 20
  const studentPageRanges: { start: number; end: number; studentIndex: number; originalEnd: number }[] = []
  let currentStudentStartPage = 1

  // Start directly with content - no index page to save paper

  // Process each assessment record
  for (const [studentIndex, assessmentRecord] of assessmentRecords.entries()) {
    // Check if we need a new page (but not for the first student)
    if (studentIndex > 0) {
      doc.addPage()
      yPosition = 20
      currentStudentStartPage = doc.getCurrentPageInfo().pageNumber
    }

    // --- Student Header ---
    const headerInfo = extractHeaderInfo(assessmentRecord, assessment)
    yPosition = addUnifiedHeaderToPDF(doc, headerInfo, yPosition)

    // --- Timeline of Events for this student ---
    const studentAnswers = assessmentRecord.studentAnswers || []
    const feedbacks = feedbacksForHistoryExport(assessmentRecord.feedbacks)

    const timeline: TimelineItem[] = [
      ...studentAnswers.map((sa) => ({ type: 'answer' as const, date: new Date(sa.createdAt), data: sa })),
      ...feedbacks.map((fb) => ({ type: 'feedback' as const, date: new Date(fb.createdAt), data: fb })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    for (const item of timeline) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      if (item.type === 'answer') {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Student Answer Submitted at ${item.date.toLocaleString()}`, 20, yPosition)
        yPosition += 12

        {
          const filteredAnswers = filterAnswersForExport(item.data.answers)
          for (const answer of filteredAnswers) {
            if (yPosition > 250) {
              doc.addPage()
              yPosition = 20
            }
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            const titleLines = doc.splitTextToSize(answer.title, 170)
            doc.text(titleLines, 25, yPosition)
            yPosition += titleLines.length * 5 + 2

            doc.setFont('helvetica', 'normal')
            const valueLines = doc.splitTextToSize(answer.value, 170)
            doc.text(valueLines, 30, yPosition)
            yPosition += valueLines.length * 5 + 8
          }
        }
      } else if (item.type === 'feedback') {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Feedback Provided at ${item.date.toLocaleString()}`, 20, yPosition)
        yPosition += 12

        const sortedFeedbackCards = item.data.feedbackSections?.sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        )

        if (sortedFeedbackCards?.length) {
          for (const [index, card] of sortedFeedbackCards.entries()) {
            if (yPosition > 250) {
              doc.addPage()
              yPosition = 20
            }

            let typeColor: [number, number, number] = [0, 0, 0]
            const typeLabel = card.type.toUpperCase()
            switch (card.type.toLowerCase()) {
              case 'strength': {
                typeColor = [34, 197, 94] // Green
                break
              }
              case 'suggestion': {
                typeColor = [245, 158, 11] // Amber
                break
              }
              case 'comment': {
                typeColor = [107, 114, 128] // Gray
                break
              }
            }

            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...typeColor)
            doc.text(`${index + 1}. ${typeLabel}`, 25, yPosition)
            yPosition += 7

            doc.setTextColor(0, 0, 0)
            if (card.section) {
              doc.setFont('helvetica', 'normal')
              doc.text(`Section: ${card.section}`, 30, yPosition)
              yPosition += 7
            }

            doc.setFont('helvetica', 'normal')
            const lines = doc.splitTextToSize(card.content, 170)
            doc.text(lines, 30, yPosition)
            yPosition += lines.length * 5 + 10
          }
        }
      }
    }
    
    // Record the end page for this student
    const endPage = doc.getCurrentPageInfo().pageNumber
    
    // Ensure even number of pages for this student's assessment
    const studentPageCount = endPage - currentStudentStartPage + 1
    if (studentPageCount % 2 !== 0) {
      doc.addPage()
      // Add a small note on the blank page
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.setTextColor(150, 150, 150)
      doc.text('This page intentionally left blank for duplex printing', 20, doc.internal.pageSize.getHeight() - 10)
    }
    
    const finalEndPage = doc.getCurrentPageInfo().pageNumber
    studentPageRanges.push({
      start: currentStudentStartPage,
      end: finalEndPage,
      originalEnd: endPage,
      studentIndex: studentIndex
    })
  }

  // Add unified page numbers with student names per assessment
  addUnifiedPageNumbersToPDFMultiple(doc, studentPageRanges, assessmentRecords)

  // --- Save Document ---
  const fileName = `${assessment.title.replaceAll(/[^a-z0-9]/gi, '_')}_Combined_Assessment_Histories.pdf`
  doc.save(fileName)
}

/**
 * Export multiple assessment histories as a single DOC
 */
export async function exportMultipleAssessmentHistoriesToDOC(
  assessmentRecords: AssessmentRecord[],
  assessment: ActiveAssessment,
): Promise<void> {
  const children: Paragraph[] = []

  // Start directly with content - no index page to save paper

  // Process each assessment record
  for (const [studentIndex, assessmentRecord] of assessmentRecords.entries()) {
    // --- Student Header ---
    const headerInfo = extractHeaderInfo(assessmentRecord, assessment)
    addUnifiedHeaderToDOC(children, headerInfo, studentIndex === 0)

    // --- Timeline of Events for this student ---
    const studentAnswers = assessmentRecord.studentAnswers || []
    const feedbacks = feedbacksForHistoryExport(assessmentRecord.feedbacks)

    const timeline: TimelineItem[] = [
      ...studentAnswers.map((sa) => ({ type: 'answer' as const, date: new Date(sa.createdAt), data: sa })),
      ...feedbacks.map((fb) => ({ type: 'feedback' as const, date: new Date(fb.createdAt), data: fb })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    for (const item of timeline) {
      if (item.type === 'answer') {
        children.push(
          new Paragraph({
            text: `Student Answer Submitted at ${item.date.toLocaleString()}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200, before: 300 },
          }),
        )

        {
          const filteredAnswers = filterAnswersForExport(item.data.answers)
          const answerParagraphs = filteredAnswers.flatMap((answer) => [
            new Paragraph({
              children: [new TextRun({ text: answer.title, bold: true })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              text: answer.value,
              spacing: { after: 200 },
              indent: { left: 200 },
            }),
          ])
          children.push(...answerParagraphs)
        }
      } else if (item.type === 'feedback') {
        children.push(
          new Paragraph({
            text: `Feedback Provided at ${item.date.toLocaleString()}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200, before: 300 },
          }),
        )

        const sortedFeedbackCards = item.data.feedbackSections?.sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        )

        if (sortedFeedbackCards?.length) {
          const feedbackParagraphs = sortedFeedbackCards.flatMap((card, index) => {
            const typeLabel = card.type.toUpperCase()
            const paragraphs: Paragraph[] = [
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. ${typeLabel}`, bold: true }),
                ],
                spacing: { after: 100 },
              }),
            ]

            if (card.section) {
              paragraphs.push(
                new Paragraph({
                  text: `Section: ${card.section}`,
                  spacing: { after: 100 },
                  indent: { left: 200 },
                }),
              )
            }

            paragraphs.push(
              new Paragraph({
                text: card.content,
                spacing: { after: 300 },
                indent: { left: 200 },
              }),
            )

            return paragraphs
          })
          children.push(...feedbackParagraphs)
        }
      }
    }

    // Add page break between students (except for the last one)
    if (studentIndex < assessmentRecords.length - 1) {
      children.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true,
        }),
      )
    }
  }

  // --- Create and Save Document ---
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const fileName = `${assessment.title.replaceAll(/[^a-z0-9]/gi, '_')}_Combined_Assessment_Histories.doc`
  const buffer = await Packer.toBuffer(doc);
  saveFile(new Blob([new Uint8Array(buffer)]), fileName);
}

/**
 * Export assessment history as DOC using docx library
 */
export async function exportAssessmentHistoryToDOC(
  assessmentRecord: AssessmentRecord,
  assessment: ActiveAssessment,
): Promise<void> {
  const children: Paragraph[] = []

  // --- Document Header ---
  const headerInfo = extractHeaderInfo(assessmentRecord, assessment)
  addUnifiedHeaderToDOC(children, headerInfo, true)

  // --- Timeline of Events ---
  const studentAnswers = assessmentRecord.studentAnswers || []
  const feedbacks = feedbacksForHistoryExport(assessmentRecord.feedbacks)

  const timeline: TimelineItem[] = [
    ...studentAnswers.map((sa) => ({ type: 'answer' as const, date: new Date(sa.createdAt), data: sa })),
    ...feedbacks.map((fb) => ({ type: 'feedback' as const, date: new Date(fb.createdAt), data: fb })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const item of timeline) {
    if (item.type === 'answer') {
      children.push(
        new Paragraph({
          text: `Student Answer Submitted at ${item.date.toLocaleString()}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200, before: 400 },
        }),
      )

      {
        const filteredAnswers = filterAnswersForExport(item.data.answers)
        const answerParagraphs = filteredAnswers.flatMap((answer) => [
          new Paragraph({
            children: [new TextRun({ text: answer.title, bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: answer.value,
            spacing: { after: 200 },
            indent: { left: 200 },
          }),
        ])
        children.push(...answerParagraphs)
      }
    } else if (item.type === 'feedback') {
      children.push(
        new Paragraph({
          text: `Feedback Provided at ${item.date.toLocaleString()}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { after: 200, before: 400 },
        }),
      )

      const sortedFeedbackCards = item.data.feedbackSections?.sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      )

      if (sortedFeedbackCards?.length) {
        const feedbackParagraphs = sortedFeedbackCards.flatMap((card, index) => {
          const typeLabel = card.type.toUpperCase()
          const paragraphs: Paragraph[] = [
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. ${typeLabel}`, bold: true }),
              ],
              spacing: { after: 100 },
            }),
          ]

          if (card.section) {
            paragraphs.push(
              new Paragraph({
                text: `Section: ${card.section}`,
                spacing: { after: 100 },
                indent: { left: 200 },
              }),
            )
          }

          paragraphs.push(
            new Paragraph({
              text: card.content,
              spacing: { after: 300 },
              indent: { left: 200 },
            }),
          )

          return paragraphs
        })
        children.push(...feedbackParagraphs)
      }
    }
  }

  // --- Create and Save Document ---
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const fileName = generateAssessmentHistoryFileName(
    assessmentRecord.learnerName,
    assessment.title,
    'doc',
  )
  const buffer = await Packer.toBuffer(doc);
  saveFile(new Blob([new Uint8Array(buffer)]), fileName);
}
