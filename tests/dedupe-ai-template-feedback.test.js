import assert from 'node:assert/strict'
import test from 'node:test'

test('should dedupe AI template feedback rows by section id', async () => {
  const { dedupeAiTemplateFeedbackBySectionId } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const dup = [
    { id: 'a', type: 'suggestion', section: 's', content: 'one', order: 0, discarted: false, used: false },
    { id: 'a', type: 'suggestion', section: 's', content: 'dup', order: 1, discarted: false, used: false },
    { id: 'b', type: 'improvement', section: 's', content: 'two', order: 2, discarted: false, used: false },
  ]
  const out = dedupeAiTemplateFeedbackBySectionId(dup)
  assert.equal(out.length, 2)
  assert.equal(out[0].id, 'a')
  assert.equal(out[0].content, 'one')
  assert.equal(out[1].id, 'b')
})

test('should sort deduped rows by order', async () => {
  const { dedupeAiTemplateFeedbackBySectionId } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const rows = [
    { id: 'y', type: 'suggestion', section: 's', content: 'b', order: 2, discarted: false, used: false },
    { id: 'x', type: 'suggestion', section: 's', content: 'a', order: 1, discarted: false, used: false },
  ]
  const out = dedupeAiTemplateFeedbackBySectionId(rows)
  assert.deepEqual(
    out.map((r) => r.id),
    ['x', 'y'],
  )
})

test('should dedupe rows with different ids but identical type section and content', async () => {
  const { dedupeAiTemplateFeedbackBySectionId } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const text = 'Try to explain more clearly how the tiny pores work.'
  const dup = [
    { id: 'id1', type: 'suggestion', section: 'suggestion', content: text, order: 0, discarted: false, used: false },
    { id: 'id2', type: 'suggestion', section: 'suggestion', content: text, order: 1, discarted: false, used: false },
    { id: 'id3', type: 'suggestion', section: 'suggestion', content: text, order: 2, discarted: false, used: false },
  ]
  const out = dedupeAiTemplateFeedbackBySectionId(dup)
  assert.equal(out.length, 1)
  assert.equal(out[0].id, 'id1')
})

test('should dedupe suggestion and improvement with same section and content', async () => {
  const { dedupeAiTemplateFeedbackBySectionId } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const text = 'Same body.'
  const dup = [
    { id: 'a', type: 'suggestion', section: 's', content: text, order: 0, discarted: false, used: false },
    { id: 'b', type: 'improvement', section: 's', content: text, order: 1, discarted: false, used: false },
  ]
  const out = dedupeAiTemplateFeedbackBySectionId(dup)
  assert.equal(out.length, 1)
})

test('should dedupe same type and content when only section label differs', async () => {
  const { dedupeAiTemplateFeedbackBySectionId } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const text = 'Export can duplicate rows with different section names.'
  const dup = [
    { id: 'x', type: 'suggestion', section: 'A', content: text, order: 0, discarted: false, used: true },
    { id: 'y', type: 'suggestion', section: 'B', content: text, order: 1, discarted: false, used: false },
  ]
  const out = dedupeAiTemplateFeedbackBySectionId(dup)
  assert.equal(out.length, 1)
  assert.equal(out[0].id, 'x')
})
