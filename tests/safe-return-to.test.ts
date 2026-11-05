import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isSafeLibraryExportReturnTo,
  libraryExportReturnToFromRequest,
} from '../lib/library/export/safe-return-to.ts'

test('should accept same-origin relative returnTo paths', () => {
  assert.equal(isSafeLibraryExportReturnTo('/library/openscied'), true)
  assert.equal(
    isSafeLibraryExportReturnTo('/library/openscied/unit/8.1?export=1'),
    true,
  )
})

test('should reject protocol-relative and absolute returnTo values', () => {
  assert.equal(isSafeLibraryExportReturnTo('//evil.example/phish'), false)
  assert.equal(isSafeLibraryExportReturnTo('https://evil.example'), false)
  assert.equal(isSafeLibraryExportReturnTo('library/openscied'), false)
  assert.equal(isSafeLibraryExportReturnTo('/\\evil.example'), false)
})

test('should derive returnTo from a valid Referer pathname', () => {
  const request = new Request('https://app.example/api/library/export', {
    headers: { referer: 'https://app.example/library/openscied/middle-school/grade-8/units/8.1' },
  })
  assert.equal(
    libraryExportReturnToFromRequest(request),
    '/library/openscied/middle-school/grade-8/units/8.1',
  )
})

test('should fall back when Referer is missing or malformed', () => {
  assert.equal(
    libraryExportReturnToFromRequest(new Request('https://app.example/api/library/export')),
    '/library/openscied',
  )
  assert.equal(
    libraryExportReturnToFromRequest(
      new Request('https://app.example/api/library/export', {
        headers: { referer: 'not a url' },
      }),
    ),
    '/library/openscied',
  )
})
