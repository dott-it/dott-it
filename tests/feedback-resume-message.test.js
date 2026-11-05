import assert from 'node:assert/strict'
import test from 'node:test'

test('should build feedback-cards message for resume flow', async () => {
  const { completedFeedbackToResumeMessage } = await import(
    '../components/ui/assessment-history/feedback-resume-message.ts'
  )
  const completedAt = new Date('2026-04-29T12:00:00Z')
  const updatedAt = new Date('2026-04-28T12:00:00Z')
  const feedback = {
    id: 'fb-1',
    assessmentRecordId: 'rec-1',
    status: 'completed',
    createdAt: updatedAt,
    updatedAt,
    completedAt,
    feedbackSections: [
      { id: 's1', type: 'strength', section: 'q1', content: 'Good work', order: 0 },
      { id: 's2', type: 'suggestion', section: 'q1', content: 'Try X', order: 1 },
    ],
  }
  const msg = completedFeedbackToResumeMessage(feedback)
  assert.equal(msg.id, 'fb-1')
  assert.equal(msg.role, 'user')
  assert.equal(msg.metadata.type, 'feedback-cards')
  assert.equal(msg.metadata.eventData, feedback)
  assert.ok(msg.content.includes('Good work'))
  assert.ok(msg.content.includes('Try X'))
  assert.ok(msg.content.includes('<br/><br/>'))
  assert.equal(msg.timestamp.getTime(), completedAt.getTime())
})

test('should fall back to updatedAt when completedAt is null', async () => {
  const { completedFeedbackToResumeMessage } = await import(
    '../components/ui/assessment-history/feedback-resume-message.ts'
  )
  const updatedAt = new Date('2026-04-27T10:00:00Z')
  const feedback = {
    id: 'fb-2',
    assessmentRecordId: 'rec-1',
    status: 'completed',
    createdAt: updatedAt,
    updatedAt,
    completedAt: null,
    feedbackSections: [],
  }
  const msg = completedFeedbackToResumeMessage(feedback)
  assert.equal(msg.timestamp.getTime(), updatedAt.getTime())
})
