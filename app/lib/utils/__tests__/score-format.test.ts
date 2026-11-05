import {
  formatScoreAsFraction,
  getAssessmentTotalPoints,
  formatScoreForDisplay,
} from '../score-format'

describe('score-format', () => {
  describe('formatScoreAsFraction', () => {
    it('should format percentage score as fraction', () => {
      expect(formatScoreAsFraction(85, 10)).toBe('9/10')
      expect(formatScoreAsFraction(90, 10)).toBe('9/10')
      expect(formatScoreAsFraction(100, 10)).toBe('10/10')
      expect(formatScoreAsFraction(0, 10)).toBe('0/10')
    })

    it('should handle null and undefined scores', () => {
      expect(formatScoreAsFraction(null, 10)).toBe('—')
      expect(formatScoreAsFraction(undefined, 10)).toBe('—')
    })

    it('should use default total points of 10', () => {
      expect(formatScoreAsFraction(85)).toBe('9/10')
      expect(formatScoreAsFraction(90)).toBe('9/10')
    })

    it('should handle different total points', () => {
      expect(formatScoreAsFraction(85, 100)).toBe('85/100')
      expect(formatScoreAsFraction(75, 20)).toBe('15/20')
    })
  })

  describe('getAssessmentTotalPoints', () => {
    it('should return pointValue from template', () => {
      const template = { pointValue: 25 }
      expect(getAssessmentTotalPoints(template)).toBe(25)
    })

    it('should return default of 10 when no template provided', () => {
      expect(getAssessmentTotalPoints()).toBe(10)
    })

    it('should return default of 10 when template has no pointValue', () => {
      const template = {}
      expect(getAssessmentTotalPoints(template)).toBe(10)
    })
  })

  describe('formatScoreForDisplay', () => {
    it('should format score using template pointValue', () => {
      const template = { pointValue: 25 }
      expect(formatScoreForDisplay(80, template)).toBe('20/25')
    })

    it('should format score using maxScore when provided', () => {
      const template = { pointValue: 25 }
      expect(formatScoreForDisplay(80, template, 30)).toBe('24/30')
    })

    it('should use default total points when no template or maxScore', () => {
      expect(formatScoreForDisplay(85)).toBe('9/10')
    })

    it('should handle null and undefined scores', () => {
      expect(formatScoreForDisplay(null)).toBe('—')
      expect(formatScoreForDisplay(null)).toBe('—')
    })
  })
})
