import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  formHasFileUploadQuestions,
  planFileUploadFolderReattachments,
  sanitizeDriveFolderName,
} from '../lib/library/digitize/reattach-file-upload-folders.ts'

test('should plan one folder per File upload question and skip other items', () => {
  const plans = planFileUploadFolderReattachments([
    { itemId: 'a', title: 'Intro', questionItem: { question: { textQuestion: {} } as never } },
    {
      itemId: 'b',
      title: '1. Draw diagrams',
      questionItem: { question: { fileUploadQuestion: { folderId: 'old' } } },
    },
    {
      itemId: 'c',
      title: '2. Upload plot',
      questionItem: { question: { fileUploadQuestion: { folderId: 'old2' } } },
    },
  ] as never)

  assert.equal(plans.length, 2)
  assert.deepEqual(plans[0], {
    itemId: 'b',
    index: 1,
    title: '1. Draw diagrams',
    folderName: '1. Draw diagrams',
  })
  assert.equal(plans[1]?.folderName, '2. Upload plot')
})

test('should detect whether a Form snapshot has File upload questions', () => {
  assert.equal(formHasFileUploadQuestions([]), false)
  assert.equal(
    formHasFileUploadQuestions([
      { itemId: 'a', questionItem: { question: { textQuestion: {} } as never } },
    ] as never),
    false,
  )
  assert.equal(
    formHasFileUploadQuestions([
      { itemId: 'b', questionItem: { question: { fileUploadQuestion: { folderId: 'x' } } } },
    ]),
    true,
  )
})

test('should sanitize Drive folder names for File upload questions', () => {
  assert.equal(sanitizeDriveFolderName('A / B\\C'), 'A - B-C')
  assert.equal(sanitizeDriveFolderName('   '), 'File upload')
})
