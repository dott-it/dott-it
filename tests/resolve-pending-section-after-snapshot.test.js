import assert from 'node:assert/strict'
import test from 'node:test'

test('should resolve pending id by originalSectionId and skip optimistic rows', async () => {
  const { resolvePendingSectionIdAfterSnapshotSeed } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )

  const source = {
    id: 'completed-1',
    type: 'strength',
    section: 'strength',
    content: 'Great work',
    originalSectionId: 'ai-tmpl-1',
    feedbackId: 'completed-fb',
  }

  const rec = {
    id: 'ar1',
    feedbacks: [
      {
        id: 'pending-fb',
        status: 'pending',
        feedbackSections: [
          {
            id: 'eddo-opt-snap-0-abc',
            type: 'strength',
            section: 'strength',
            content: 'Great work',
            originalSectionId: 'ai-tmpl-1',
            feedbackId: 'pending-fb',
            used: true,
            discarted: false,
          },
          {
            id: 'real-pending-1',
            type: 'strength',
            section: 'strength',
            content: 'Great work',
            originalSectionId: 'ai-tmpl-1',
            feedbackId: 'pending-fb',
            used: true,
            discarted: false,
          },
        ],
      },
    ],
  }

  assert.equal(resolvePendingSectionIdAfterSnapshotSeed(rec, source), 'real-pending-1')
})

test('should resolve custom rows by semantic key when originalSectionId is missing', async () => {
  const { resolvePendingSectionIdAfterSnapshotSeed } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )

  const source = {
    id: 'completed-custom',
    type: 'comment',
    section: 'comment',
    content: 'Please revise intro',
    feedbackId: 'completed-fb',
  }

  const rec = {
    id: 'ar1',
    feedbacks: [
      {
        id: 'pending-fb',
        status: 'pending',
        feedbackSections: [
          {
            id: 'eddo-opt-snap-1-xyz',
            type: 'comment',
            section: 'comment',
            content: 'Please revise intro',
            feedbackId: 'pending-fb',
            used: true,
            discarted: false,
          },
          {
            id: 'real-custom-1',
            type: 'comment',
            section: 'comment',
            content: 'Please revise intro',
            feedbackId: 'pending-fb',
            used: true,
            discarted: false,
          },
        ],
      },
    ],
  }

  assert.equal(resolvePendingSectionIdAfterSnapshotSeed(rec, source), 'real-custom-1')
})

test('should return undefined when only optimistic rows exist', async () => {
  const { resolvePendingSectionIdAfterSnapshotSeed } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )

  const source = {
    id: 'completed-1',
    type: 'strength',
    section: 'strength',
    content: 'Great work',
    originalSectionId: 'ai-tmpl-1',
    feedbackId: 'completed-fb',
  }

  const rec = {
    id: 'ar1',
    feedbacks: [
      {
        id: 'pending-fb',
        status: 'pending',
        feedbackSections: [
          {
            id: 'eddo-opt-snap-0-abc',
            type: 'strength',
            section: 'strength',
            content: 'Great work',
            originalSectionId: 'ai-tmpl-1',
            feedbackId: 'pending-fb',
            used: true,
            discarted: false,
          },
        ],
      },
    ],
  }

  assert.equal(resolvePendingSectionIdAfterSnapshotSeed(rec, source), undefined)
})

test('should detect optimistic feedback section ids', async () => {
  const { isOptimisticFeedbackSectionId } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )
  assert.equal(isOptimisticFeedbackSectionId('eddo-opt-snap-0-x'), true)
  assert.equal(isOptimisticFeedbackSectionId('eddo-opt-uuid'), true)
  assert.equal(isOptimisticFeedbackSectionId('cuid-real-id'), false)
  assert.equal(isOptimisticFeedbackSectionId(undefined), false)
})

test('should keep draft linked to edited template after AI body edit', async () => {
  const { shouldKeepDraftSectionAfterAiTemplateEdit } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )
  const { aiTemplateDisplayListKey } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const previousKey = aiTemplateDisplayListKey({
    type: 'strength',
    content: 'Old body',
  })
  const linked = {
    id: 'draft-1',
    type: 'strength',
    section: 'strength',
    content: 'New body',
    originalSectionId: 'tmpl-1',
  }
  assert.equal(
    shouldKeepDraftSectionAfterAiTemplateEdit(linked, 'tmpl-1', previousKey),
    true,
  )
})

test('should keep draft linked to a different AI template even with old body', async () => {
  const { shouldKeepDraftSectionAfterAiTemplateEdit } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )
  const { aiTemplateDisplayListKey } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const previousKey = aiTemplateDisplayListKey({
    type: 'strength',
    content: 'Old body',
  })
  const otherLinked = {
    id: 'draft-2',
    type: 'strength',
    section: 'strength',
    content: 'Old body',
    originalSectionId: 'tmpl-other',
  }
  assert.equal(
    shouldKeepDraftSectionAfterAiTemplateEdit(otherLinked, 'tmpl-1', previousKey),
    true,
  )
})

test('should drop unlinked draft that still shows pre-edit body', async () => {
  const { shouldKeepDraftSectionAfterAiTemplateEdit } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )
  const { aiTemplateDisplayListKey } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const previousKey = aiTemplateDisplayListKey({
    type: 'strength',
    content: 'Old body',
  })
  const ghost = {
    id: 'ghost-1',
    type: 'strength',
    section: 'strength',
    content: 'Old body',
  }
  assert.equal(
    shouldKeepDraftSectionAfterAiTemplateEdit(ghost, 'tmpl-1', previousKey),
    false,
  )
})

test('should drop AI template ghosts that still show pre-edit body', async () => {
  const { shouldKeepAiTemplateAfterBodyEdit } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )
  const { aiTemplateDisplayListKey } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const previousKey = aiTemplateDisplayListKey({
    type: 'strength',
    content: 'Old body',
  })
  assert.equal(
    shouldKeepAiTemplateAfterBodyEdit(
      { id: 'tmpl-1', type: 'strength', content: 'New body' },
      'tmpl-1',
      previousKey,
    ),
    true,
  )
  assert.equal(
    shouldKeepAiTemplateAfterBodyEdit(
      { id: 'ghost', type: 'strength', content: 'Old body' },
      'tmpl-1',
      previousKey,
    ),
    false,
  )
})

test('should drop other drafts that still show a section pre-edit body', async () => {
  const { shouldKeepDraftAfterSectionContentEdit } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )
  const { aiTemplateDisplayListKey } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const previousKey = aiTemplateDisplayListKey({
    type: 'comment',
    content: 'Before',
  })
  assert.equal(
    shouldKeepDraftAfterSectionContentEdit(
      { id: 'edited', type: 'comment', content: 'After' },
      'edited',
      previousKey,
    ),
    true,
  )
  assert.equal(
    shouldKeepDraftAfterSectionContentEdit(
      { id: 'stale', type: 'comment', content: 'Before' },
      'edited',
      previousKey,
    ),
    false,
  )
})

test('should keep AI-linked drafts when cleaning pre-edit bodies after section edit', async () => {
  const { shouldKeepDraftAfterSectionContentEdit } = await import(
    '../app/lib/feedback/resolve-pending-section-after-snapshot.ts'
  )
  const { aiTemplateDisplayListKey } = await import(
    '../app/lib/feedback/merge-feedback-sections.ts'
  )
  const previousKey = aiTemplateDisplayListKey({
    type: 'strength',
    content: 'Before',
  })
  assert.equal(
    shouldKeepDraftAfterSectionContentEdit(
      {
        id: 'linked-other',
        type: 'strength',
        content: 'Before',
        originalSectionId: 'tmpl-other',
      },
      'edited',
      previousKey,
    ),
    true,
  )
})
