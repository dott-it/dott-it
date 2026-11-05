import { getStatusLabel } from '@/app/lib/utils/export/utils/status-utils'

describe('Status Utils', () => {
  describe('getStatusLabel', () => {
    it('should return correct label for handed_in status', () => {
      const result = getStatusLabel('handed_in')
      expect(result).toBe('Handed In')
    })

    it('should return correct label for ready_for_review status', () => {
      const result = getStatusLabel('ready_for_review')
      expect(result).toBe('Ready for Review')
    })

    it('should return correct label for in_progress status', () => {
      const result = getStatusLabel('in_progress')
      expect(result).toBe('In Progress')
    })


    it('should return correct label for shared status', () => {
      const result = getStatusLabel('shared')
      expect(result).toBe('Shared')
    })

    it('should return correct label for pending status', () => {
      const result = getStatusLabel('pending')
      expect(result).toBe('pending')
    })

    it('should return correct label for draft status', () => {
      const result = getStatusLabel('draft')
      expect(result).toBe('draft')
    })

    it('should return correct label for published status', () => {
      const result = getStatusLabel('published')
      expect(result).toBe('published')
    })

    it('should return correct label for cancelled status', () => {
      const result = getStatusLabel('cancelled')
      expect(result).toBe('cancelled')
    })


    it('should return correct label for under_review status', () => {
      const result = getStatusLabel('under_review')
      expect(result).toBe('under_review')
    })

    it('should return correct label for approved status', () => {
      const result = getStatusLabel('approved')
      expect(result).toBe('approved')
    })

    it('should return correct label for rejected status', () => {
      const result = getStatusLabel('rejected')
      expect(result).toBe('rejected')
    })

    it('should handle unknown status by returning the status as-is', () => {
      const result = getStatusLabel('unknown_status')
      expect(result).toBe('unknown_status')
    })

    it('should handle empty string status', () => {
      const result = getStatusLabel('')
      expect(result).toBe('')
    })

    it('should handle status with special characters', () => {
      const result = getStatusLabel('status_with_special_chars!')
      expect(result).toBe('status_with_special_chars!')
    })

    it('should handle status with numbers', () => {
      const result = getStatusLabel('status_123')
      expect(result).toBe('status_123')
    })

    it('should handle status with uppercase letters', () => {
      const result = getStatusLabel('HANDED_IN')
      expect(result).toBe('HANDED_IN')
    })

    it('should handle status with mixed case', () => {
      const result = getStatusLabel('Handed_In')
      expect(result).toBe('Handed_In')
    })

    it('should handle null status', () => {
      const result = getStatusLabel(null as unknown as string)
      expect(result).toBe(null)
    })

    it('should handle undefined status', () => {
      const result = getStatusLabel(undefined as unknown as string)
      expect(result).toBe(undefined)
    })

    it('should handle numeric status', () => {
      const result = getStatusLabel(123 as unknown as string)
      expect(result).toBe(123)
    })

    it('should handle object status', () => {
      const statusObj = { status: 'handed_in' }
      const result = getStatusLabel(statusObj as unknown as string)
      expect(result).toBe(statusObj)
    })

    describe('Status Label Consistency', () => {
      const testCases = [
        { input: 'handed_in', expected: 'Handed In' },
        { input: 'ready_for_review', expected: 'Ready for Review' },
        { input: 'in_progress', expected: 'In Progress' },
        { input: 'shared', expected: 'Shared' },
        { input: 'pending', expected: 'pending' },
        { input: 'draft', expected: 'draft' },
        { input: 'published', expected: 'published' },
        { input: 'cancelled', expected: 'cancelled' },
        { input: 'under_review', expected: 'under_review' },
        { input: 'approved', expected: 'approved' },
        { input: 'rejected', expected: 'rejected' },
      ]

      for (const { input, expected } of testCases) {
        it(`should return "${expected}" for "${input}" status`, () => {
          const result = getStatusLabel(input)
          expect(result).toBe(expected)
        })
      }
    })

    describe('Edge Cases', () => {
      it('should handle very long status strings', () => {
        const longStatus = 'very_long_status_name_that_might_not_be_in_the_mapping'
        const result = getStatusLabel(longStatus)
        expect(result).toBe(longStatus)
      })

      it('should handle status with whitespace', () => {
        const result = getStatusLabel(' handed_in ')
        expect(result).toBe(' handed_in ')
      })

      it('should handle status with newlines', () => {
        const result = getStatusLabel('handed\n_in')
        expect(result).toBe('handed\n_in')
      })

      it('should handle status with tabs', () => {
        const result = getStatusLabel('handed\t_in')
        expect(result).toBe('handed\t_in')
      })
    })
  })
})
