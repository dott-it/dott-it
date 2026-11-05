import type { FeedbackSection } from '@/app/types/api/feedback-section'
import {
  shouldShowPendingFeedbackSection,
} from '@/app/lib/feedback/merge-feedback-sections'

describe('shouldShowPendingFeedbackSection', () => {
  it('should hide discarded sections', () => {
    const s: FeedbackSection = {
      id: '1',
      type: 'strength',
      section: 'strength',
      content: 'x',
      used: true,
      discarted: true,
      feedbackId: 'fb1',
    }
    expect(shouldShowPendingFeedbackSection(s)).toBe(false)
  })

  it('should show teacher rows regardless of used flag', () => {
    const s: FeedbackSection = {
      id: '1',
      type: 'comment',
      section: 'comment',
      content: 'x',
      used: false,
      discarted: false,
      feedbackId: 'fb1',
      aiSuggestionsId: null,
    }
    expect(shouldShowPendingFeedbackSection(s)).toBe(true)
  })

  it('should show AI-linked rows when not discarded', () => {
    const s: FeedbackSection = {
      id: '1',
      type: 'strength',
      section: 'strength',
      content: 'x',
      used: false,
      discarted: false,
      feedbackId: 'fb1',
      aiSuggestionsId: 'ai1',
    }
    expect(shouldShowPendingFeedbackSection(s)).toBe(true)
  })
})
