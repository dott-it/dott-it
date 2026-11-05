import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  contentDispositionHeader,
  driveFileViewUrl,
  ensureFileExtension,
  sanitizeDownloadFileName,
  withPreferredExtension,
} from '../lib/library/export/download-drive-file.ts'

test('should sanitize download file names for Content-Disposition safety', () => {
  assert.equal(sanitizeDownloadFileName('Soccer Assessment.docx'), 'Soccer Assessment.docx')
  assert.equal(sanitizeDownloadFileName('a/b:c*.docx'), 'a_b_c_.docx')
})

test('should build Latin-1 safe Content-Disposition with UTF-8 filename*', () => {
  assert.equal(
    contentDispositionHeader('Café guide.pdf', 'inline'),
    `inline; filename="Café guide.pdf"; filename*=UTF-8''Caf%C3%A9%20guide.pdf`,
  )
  assert.equal(
    contentDispositionHeader('答案.pdf', 'attachment'),
    `attachment; filename="_.pdf"; filename*=UTF-8''%E7%AD%94%E6%A1%88.pdf`,
  )
})

test('should build Drive view URLs for unsupported preview fallback', () => {
  assert.equal(
    driveFileViewUrl('abc123'),
    'https://drive.google.com/file/d/abc123/view',
  )
})

test('should ensure a file extension when missing', () => {
  assert.equal(ensureFileExtension('Student handout'), 'Student handout.docx')
  assert.equal(ensureFileExtension('Guide.pdf'), 'Guide.pdf')
  assert.equal(ensureFileExtension('bundle', '.zip'), 'bundle.zip')
})

test('should apply preferred export extension for Google Docs files', () => {
  assert.equal(withPreferredExtension('Soccer Assessment', '.docx'), 'Soccer Assessment.docx')
  assert.equal(withPreferredExtension('Guide.gdoc', '.docx'), 'Guide.docx')
})
