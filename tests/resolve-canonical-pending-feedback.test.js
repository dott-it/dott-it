import assert from 'node:assert/strict'
import test from 'node:test'

test('should return undefined when no pending feedback', async () => {
  const { pickCanonicalPendingFeedback } = await import(
    '../app/lib/feedback/resolve-canonical-pending-feedback.ts'
  )
  assert.equal(pickCanonicalPendingFeedback([]), undefined)
  assert.equal(
    pickCanonicalPendingFeedback([{ id: '1', status: 'completed', feedbackSections: [] }]),
    undefined,
  )
})

test('should return the only pending feedback', async () => {
  const { pickCanonicalPendingFeedback } = await import(
    '../app/lib/feedback/resolve-canonical-pending-feedback.ts'
  )
  const only = {
    id: 'p1',
    status: 'pending',
    feedbackSections: [],
    updatedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  }
  assert.equal(pickCanonicalPendingFeedback([only]), only)
})

test('should prefer pending with teacher-picked AI section over empty pending', async () => {
  const { pickCanonicalPendingFeedback } = await import(
    '../app/lib/feedback/resolve-canonical-pending-feedback.ts'
  )
  const emptyOlder = {
    id: 'old',
    status: 'pending',
    feedbackSections: [],
    updatedAt: new Date('2024-06-01'),
    createdAt: new Date('2024-01-01'),
  }
  const withPick = {
    id: 'draft',
    status: 'pending',
    feedbackSections: [
      {
        id: 's1',
        originalSectionId: 'ai-template-1',
        type: 'strength',
        section: 'strength',
        content: 'x',
      },
    ],
    updatedAt: new Date('2024-05-01'),
    createdAt: new Date('2024-02-01'),
  }
  const out = pickCanonicalPendingFeedback([emptyOlder, withPick])
  assert.equal(out.id, 'draft')
})

test('should break ties by updatedAt then createdAt', async () => {
  const { pickCanonicalPendingFeedback } = await import(
    '../app/lib/feedback/resolve-canonical-pending-feedback.ts'
  )
  const a = {
    id: 'a',
    status: 'pending',
    feedbackSections: [],
    updatedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
  }
  const b = {
    id: 'b',
    status: 'pending',
    feedbackSections: [],
    updatedAt: new Date('2024-01-02'),
    createdAt: new Date('2024-01-01'),
  }
  assert.equal(pickCanonicalPendingFeedback([a, b]).id, 'b')
})
