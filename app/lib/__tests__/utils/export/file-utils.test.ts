import {
  generateSafeFileName,
  saveFile,
  generateFeedbackFileName,
  generateAssessmentReportFileName,
  generateAssessmentHistoryFileName,
} from '@/app/lib/utils/export/utils/file-utils'

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}))

import { saveAs } from 'file-saver'
const mockSaveAs = saveAs as jest.MockedFunction<typeof saveAs>

describe('File Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateSafeFileName', () => {
    it('should generate safe filename with simple name', () => {
      const result = generateSafeFileName('test', 'pdf')
      expect(result).toBe('test.pdf')
    })

    it('should replace spaces with underscores', () => {
      const result = generateSafeFileName('test file name', 'pdf')
      expect(result).toBe('test_file_name.pdf')
    })

    it('should replace multiple spaces with single underscore', () => {
      const result = generateSafeFileName('test    file    name', 'pdf')
      expect(result).toBe('test_file_name.pdf')
    })

    it('should remove special characters', () => {
      const result = generateSafeFileName('test@file#name!', 'pdf')
      expect(result).toBe('testfilename.pdf')
    })

    it('should remove multiple special characters', () => {
      const result = generateSafeFileName('test@#$%^&*()file', 'pdf')
      expect(result).toBe('testfile.pdf')
    })

    it('should convert to lowercase', () => {
      const result = generateSafeFileName('TEST FILE NAME', 'PDF')
      expect(result).toBe('test_file_name.PDF')
    })

    it('should keep valid characters (letters, numbers, underscores, hyphens)', () => {
      const result = generateSafeFileName('test_123-file', 'pdf')
      expect(result).toBe('test_123-file.pdf')
    })

    it('should handle empty string', () => {
      const result = generateSafeFileName('', 'pdf')
      expect(result).toBe('.pdf')
    })

    it('should handle only special characters', () => {
      const result = generateSafeFileName('@#$%^&*()', 'pdf')
      expect(result).toBe('.pdf')
    })

    it('should handle extension with dots', () => {
      const result = generateSafeFileName('test file', 'docx')
      expect(result).toBe('test_file.docx')
    })

    it('should handle complex real-world names', () => {
      const result = generateSafeFileName('Assessment Report - Q1 2024 (Final)', 'pdf')
      expect(result).toBe('assessment_report_-_q1_2024_final.pdf')
    })
  })

  describe('saveFile', () => {
    it('should call saveAs with correct parameters', () => {
      const mockBlob = new Blob(['test content'], { type: 'text/plain' })
      const fileName = 'test-file.txt'

      saveFile(mockBlob, fileName)

      expect(mockSaveAs).toHaveBeenCalledWith(mockBlob, fileName)
      expect(mockSaveAs).toHaveBeenCalledTimes(1)
    })

    it('should handle different blob types', () => {
      const pdfBlob = new Blob(['pdf content'], { type: 'application/pdf' })
      const docBlob = new Blob(['doc content'], { type: 'application/msword' })

      saveFile(pdfBlob, 'test.pdf')
      saveFile(docBlob, 'test.doc')

      expect(mockSaveAs).toHaveBeenCalledWith(pdfBlob, 'test.pdf')
      expect(mockSaveAs).toHaveBeenCalledWith(docBlob, 'test.doc')
      expect(mockSaveAs).toHaveBeenCalledTimes(2)
    })

    it('should handle empty blob', () => {
      const emptyBlob = new Blob([], { type: 'text/plain' })
      const fileName = 'empty.txt'

      saveFile(emptyBlob, fileName)

      expect(mockSaveAs).toHaveBeenCalledWith(emptyBlob, fileName)
    })
  })

  describe('generateFeedbackFileName', () => {
    it('should generate PDF feedback filename', () => {
      const result = generateFeedbackFileName('John Doe', 'Math Assessment', 'pdf')
      expect(result).toBe('feedback_john_doe_math_assessment.pdf')
    })

    it('should generate DOC feedback filename', () => {
      const result = generateFeedbackFileName('Jane Smith', 'Science Test', 'doc')
      expect(result).toBe('feedback_jane_smith_science_test.doc')
    })

    it('should handle student names with spaces and special characters', () => {
      const result = generateFeedbackFileName("O'Connor, Mary-Jane", 'Assessment (Final)', 'pdf')
      expect(result).toBe('feedback_oconnor_mary-jane_assessment_final.pdf')
    })

    it('should handle assessment titles with special characters', () => {
      const result = generateFeedbackFileName('Student Name', 'Test @#$%^&*()', 'pdf')
      expect(result).toBe('feedback_student_name_test_.pdf')
    })

    it('should handle empty student name', () => {
      const result = generateFeedbackFileName('', 'Assessment', 'pdf')
      expect(result).toBe('feedback__assessment.pdf')
    })

    it('should handle empty assessment title', () => {
      const result = generateFeedbackFileName('Student Name', '', 'pdf')
      expect(result).toBe('feedback_student_name_.pdf')
    })
  })

  describe('generateAssessmentReportFileName', () => {
    it('should generate PDF assessment report filename', () => {
      const result = generateAssessmentReportFileName('Math Assessment', 'pdf')
      expect(result).toBe('assessment_report_math_assessment.pdf')
    })

    it('should generate DOC assessment report filename', () => {
      const result = generateAssessmentReportFileName('Science Test', 'doc')
      expect(result).toBe('assessment_report_science_test.doc')
    })

    it('should handle assessment titles with spaces and special characters', () => {
      const result = generateAssessmentReportFileName('Assessment - Q1 2024 (Final)', 'pdf')
      expect(result).toBe('assessment_report_assessment_-_q1_2024_final.pdf')
    })

    it('should handle assessment titles with special characters only', () => {
      const result = generateAssessmentReportFileName('@#$%^&*()', 'pdf')
      expect(result).toBe('assessment_report_.pdf')
    })

    it('should handle empty assessment title', () => {
      const result = generateAssessmentReportFileName('', 'pdf')
      expect(result).toBe('assessment_report_.pdf')
    })

    it('should handle very long assessment titles', () => {
      const longTitle = 'Very Long Assessment Title That Might Exceed Normal Length Limits'
      const result = generateAssessmentReportFileName(longTitle, 'pdf')
      expect(result).toBe('assessment_report_very_long_assessment_title_that_might_exceed_normal_length_limits.pdf')
    })
  })

  describe('generateAssessmentHistoryFileName', () => {
    it('should generate PDF assessment history filename', () => {
      const result = generateAssessmentHistoryFileName('John Doe', 'Math Assessment', 'pdf')
      expect(result).toBe('assessment_history_john_doe_math_assessment.pdf')
    })

    it('should generate DOC assessment history filename', () => {
      const result = generateAssessmentHistoryFileName('Jane Smith', 'Science Test', 'doc')
      expect(result).toBe('assessment_history_jane_smith_science_test.doc')
    })

    it('should handle student names with spaces and special characters', () => {
      const result = generateAssessmentHistoryFileName("O'Connor, Mary-Jane", 'Assessment (Final)', 'pdf')
      expect(result).toBe('assessment_history_oconnor_mary-jane_assessment_final.pdf')
    })

    it('should handle assessment titles with special characters', () => {
      const result = generateAssessmentHistoryFileName('Student Name', 'Test @#$%^&*()', 'pdf')
      expect(result).toBe('assessment_history_student_name_test_.pdf')
    })

    it('should handle empty student name', () => {
      const result = generateAssessmentHistoryFileName('', 'Assessment', 'pdf')
      expect(result).toBe('assessment_history__assessment.pdf')
    })

    it('should handle empty assessment title', () => {
      const result = generateAssessmentHistoryFileName('Student Name', '', 'pdf')
      expect(result).toBe('assessment_history_student_name_.pdf')
    })

    it('should handle both empty parameters', () => {
      const result = generateAssessmentHistoryFileName('', '', 'pdf')
      expect(result).toBe('assessment_history__.pdf')
    })
  })

  describe('Integration Tests', () => {
    it('should work together: generate filename then save file', () => {
      const fileName = generateFeedbackFileName('John Doe', 'Math Assessment', 'pdf')
      const mockBlob = new Blob(['feedback content'], { type: 'application/pdf' })

      saveFile(mockBlob, fileName)

      expect(fileName).toBe('feedback_john_doe_math_assessment.pdf')
      expect(mockSaveAs).toHaveBeenCalledWith(mockBlob, fileName)
    })

    it('should handle all filename generation functions consistently', () => {
      const studentName = 'John Doe'
      const assessmentTitle = 'Math Assessment'
      const format = 'pdf'

      const feedbackFileName = generateFeedbackFileName(studentName, assessmentTitle, format)
      const reportFileName = generateAssessmentReportFileName(assessmentTitle, format)
      const historyFileName = generateAssessmentHistoryFileName(studentName, assessmentTitle, format)

      expect(feedbackFileName).toContain('feedback_')
      expect(reportFileName).toContain('assessment_report_')
      expect(historyFileName).toContain('assessment_history_')

      expect(feedbackFileName).toContain('john_doe')
      expect(historyFileName).toContain('john_doe')

      expect(feedbackFileName).toContain('math_assessment')
      expect(reportFileName).toContain('math_assessment')
      expect(historyFileName).toContain('math_assessment')

      expect(feedbackFileName).toMatch(/\.pdf$/)
      expect(reportFileName).toMatch(/\.pdf$/)
      expect(historyFileName).toMatch(/\.pdf$/)
    })
  })

  describe('Edge Cases', () => {
    it('should handle unicode characters', () => {
      const result = generateSafeFileName('测试文件', 'pdf')
      expect(result).toBe('.pdf') // Unicode characters are removed
    })

    it('should handle very long names', () => {
      const longName = 'a'.repeat(1000)
      const result = generateSafeFileName(longName, 'pdf')
      expect(result).toBe('a'.repeat(1000) + '.pdf')
    })

    it('should handle names with only numbers', () => {
      const result = generateSafeFileName('123456', 'pdf')
      expect(result).toBe('123456.pdf')
    })

    it('should handle names with mixed valid and invalid characters', () => {
      const result = generateSafeFileName('test@123_file#name!', 'pdf')
      expect(result).toBe('test123_filename.pdf')
    })

    it('should handle extension with uppercase', () => {
      const result = generateSafeFileName('test file', 'PDF')
      expect(result).toBe('test_file.PDF') // Extension is preserved as provided
    })
  })
})
