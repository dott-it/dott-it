import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  clearPendingLibraryExport,
  clearPendingUnitLibraryAction,
  loadPendingLibraryExport,
  loadPendingUnitLibraryAction,
  savePendingLibraryExport,
  savePendingUnitLibraryAction,
} from '../lib/library/export/pending-export-selection.ts'

const memory = new Map<string, string>()

const storageMock = {
  getItem(key: string) {
    return memory.get(key) ?? null
  },
  setItem(key: string, value: string) {
    memory.set(key, value)
  },
  removeItem(key: string) {
    memory.delete(key)
  },
}

Object.defineProperty(globalThis, 'sessionStorage', {
  value: storageMock,
  configurable: true,
})

test('should persist and restore pending export selection for the same assessment', () => {
  memory.clear()
  savePendingLibraryExport({
    unitCode: '8.4',
    assessmentId: '84-4-what-causes-the',
    kinds: ['google-form'],
  })

  const pending = loadPendingLibraryExport({
    unitCode: '8.4',
    assessmentId: '84-4-what-causes-the',
  })

  assert.deepEqual(pending?.kinds, ['google-form'])
  assert.equal(pending?.intent, 'export')
})

test('should restore pending download intent after OAuth', () => {
  memory.clear()
  savePendingLibraryExport({
    unitCode: '8.4',
    assessmentId: '84-4-what-causes-the',
    kinds: ['student-handout', 'answer-key'],
    intent: 'download',
  })

  const pending = loadPendingLibraryExport({
    unitCode: '8.4',
    assessmentId: '84-4-what-causes-the',
  })

  assert.equal(pending?.intent, 'download')
  assert.deepEqual(pending?.kinds, ['student-handout', 'answer-key'])
})

test('should ignore pending export for a different assessment', () => {
  memory.clear()
  savePendingLibraryExport({
    unitCode: '8.4',
    assessmentId: '84-4-what-causes-the',
    kinds: ['google-form'],
  })

  assert.equal(
    loadPendingLibraryExport({
      unitCode: '8.4',
      assessmentId: 'other-assessment',
    }),
    null,
  )
})

test('should clear pending export selection', () => {
  memory.clear()
  savePendingLibraryExport({
    unitCode: '8.4',
    assessmentId: '84-4-what-causes-the',
    kinds: ['google-form'],
  })
  clearPendingLibraryExport()
  assert.equal(
    loadPendingLibraryExport({
      unitCode: '8.4',
      assessmentId: '84-4-what-causes-the',
    }),
    null,
  )
})

test('should persist and clear pending unit library action', () => {
  memory.clear()
  savePendingUnitLibraryAction('download')
  assert.equal(loadPendingUnitLibraryAction(), 'download')
  clearPendingUnitLibraryAction()
  assert.equal(loadPendingUnitLibraryAction(), null)
})
