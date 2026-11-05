import {
  truncateText,
  formatDate,
  formatStudentScore,
  getFeedbackTypeLabel,
  cleanTextForExport,
} from '@/app/lib/utils/export/utils/text-utils'

describe('Text Utils', () => {
  describe('truncateText', () => {
    it('should truncate text to specified length', () => {
      const result = truncateText('This is a long text', 10)
      expect(result).toBe('This is a ...')
    })

    it('should not truncate text shorter than limit', () => {
      const result = truncateText('Short', 10)
      expect(result).toBe('Short')
    })

    it('should handle exact length text', () => {
      const result = truncateText('Exactly 10', 10)
      expect(result).toBe('Exactly 10')
    })

    it('should handle empty string', () => {
      const result = truncateText('', 10)
      expect(result).toBe('')
    })

    it('should handle zero length limit', () => {
      const result = truncateText('Test', 0)
      expect(result).toBe('...')
    })

    it('should handle negative length limit', () => {
      const result = truncateText('Test', -1)
      expect(result).toBe('Tes...')
    })

    it('should handle whitespace in text', () => {
      const result = truncateText('  This has spaces  ', 10)
      expect(result).toBe('  This has...')
    })
  })

  describe('formatStudentScore', () => {
    it('should format score with default max score', () => {
      const result = formatStudentScore(85)
      expect(result).toBe('85/100')
    })

    it('should format score with custom max score', () => {
      const result = formatStudentScore(75, 80)
      expect(result).toBe('75/80')
    })

    it('should handle undefined score', () => {
      const result = formatStudentScore()
      expect(result).toBe('N/A')
    })

    it('should handle zero score', () => {
      const result = formatStudentScore(0)
      expect(result).toBe('0/100')
    })

    it('should handle perfect score', () => {
      const result = formatStudentScore(100)
      expect(result).toBe('100/100')
    })
  })

  describe('getFeedbackTypeLabel', () => {
    it('should return correct label for strength', () => {
      const result = getFeedbackTypeLabel('strength')
      expect(result).toBe('Strength')
    })

    it('should return correct label for suggestion', () => {
      const result = getFeedbackTypeLabel('suggestion')
      expect(result).toBe('Suggestion')
    })

    it('should return correct label for improvement', () => {
      const result = getFeedbackTypeLabel('improvement')
      expect(result).toBe('Suggestion')
    })

    it('should return correct label for comment', () => {
      const result = getFeedbackTypeLabel('comment')
      expect(result).toBe('Comment')
    })

    it('should return input for unknown type', () => {
      const result = getFeedbackTypeLabel('unknown')
      expect(result).toBe('unknown')
    })
  })

  describe('cleanTextForExport', () => {
    it('should clean and normalize text', () => {
      const result = cleanTextForExport('  Multiple   spaces\n\nand\ttabs  ')
      expect(result).toBe('Multiple spaces\nand\ttabs')
    })

    it('should handle empty string', () => {
      const result = cleanTextForExport('')
      expect(result).toBe('')
    })

    it('should handle text with only spaces', () => {
      const result = cleanTextForExport('   ')
      expect(result).toBe('')
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatDate(date)
      expect(result).toMatch(/Jan 15, 2024|15\/01\/2024|1\/15\/2024|2024-01-15/) // Different locales
    })

    it('should handle Date object', () => {
      const date = new Date('2023-12-25')
      const result = formatDate(date)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle date string', () => {
      const result = formatDate('2024-01-15')
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('should handle invalid date', () => {
      const result = formatDate('invalid-date')
      expect(result).toBe('Invalid Date')
    })

    it('should handle null date', () => {
      const result = formatDate(null as unknown as string | Date | undefined)
      expect(result).toBe('N/A')
    })

    it('should handle undefined date', () => {
      const result = formatDate(undefined as unknown as string | Date | undefined)
      expect(result).toBe('N/A')
    })
  })


  describe('Integration Tests', () => {
    it('should work together: clean and truncate text', () => {
      const rawText = '  This is a   long text with   spaces  '
      
      const cleaned = cleanTextForExport(rawText)
      const truncated = truncateText(cleaned, 20)
      
      expect(cleaned).toBe('This is a long text with spaces')
      expect(truncated).toBe('This is a long text ...')
    })

    it('should work together: format score and date', () => {
      const score = 85
      const date = new Date('2024-01-15')
      
      const formattedScore = formatStudentScore(score)
      const formattedDate = formatDate(date)
      
      expect(formattedScore).toBe('85/100')
      expect(formattedDate).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long strings in truncateText', () => {
      const longString = 'A'.repeat(10_000)
      const result = truncateText(longString, 100)
      expect(result).toBe('A'.repeat(100) + '...')
    })

    it('should handle unicode characters', () => {
      const unicodeText = 'Hello 世界 🌍'
      const result = cleanTextForExport(unicodeText)
      expect(result).toBe('Hello 世界 🌍')
    })

    it('should handle text with only whitespace', () => {
      const whitespaceText = '   \n\t   '
      const result = cleanTextForExport(whitespaceText)
      expect(result).toBe('')
    })

    it('should handle text with only special characters', () => {
      const specialText = '@#$%^&*()'
      const result = cleanTextForExport(specialText)
      expect(result).toBe('@#$%^&*()')
    })
  })
})

