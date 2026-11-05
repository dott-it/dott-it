import { generateAssessmentSlug, generateFormUrl } from '../assessment-slug'

describe('Assessment Slug Utilities', () => {
  describe('generateAssessmentSlug', () => {
    it('should generate a consistent slug for the same assessment ID', () => {
      const assessmentId = 'test-assessment-id-123'
      const slug1 = generateAssessmentSlug(assessmentId)
      const slug2 = generateAssessmentSlug(assessmentId)

      expect(slug1).toBe(slug2)
      expect(slug1).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/)
    })

    it('should generate different slugs for different assessment IDs', () => {
      const slug1 = generateAssessmentSlug('assessment-1')
      const slug2 = generateAssessmentSlug('assessment-2')

      expect(slug1).not.toBe(slug2)
    })

    it('should handle empty string', () => {
      const slug = generateAssessmentSlug('')
      expect(slug).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/)
    })
  })

  describe('generateFormUrl', () => {
    it('should generate a valid form URL', () => {
      const assessmentId = 'test-assessment-id-123'
      const formUrl = generateFormUrl(assessmentId)

      // Should match any valid URL with the correct path pattern
      expect(formUrl).toMatch(/^https?:\/\/.+\/form\/[a-z0-9]{4}-[a-z0-9]{4}$/)
    })

    it('should generate different URLs for different assessment IDs', () => {
      const url1 = generateFormUrl('assessment-1')
      const url2 = generateFormUrl('assessment-2')

      expect(url1).not.toBe(url2)
    })

    it('should use the correct base URL structure', () => {
      const assessmentId = 'test-assessment-id-123'
      const formUrl = generateFormUrl(assessmentId)
      
      // Should end with the correct path format
      expect(formUrl).toMatch(/\/form\/[a-z0-9]{4}-[a-z0-9]{4}$/)
    })
  })
})
