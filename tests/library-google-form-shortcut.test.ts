import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  googleFormShortcutContents,
  googleFormShortcutFileName,
} from '../lib/library/export/google-form-shortcut.ts'

test('should build a Google Form shortcut text file for Drive and zip export', () => {
  assert.equal(googleFormShortcutFileName('Google Form'), 'Google Form.txt')
  assert.equal(googleFormShortcutFileName('Soccer Form'), 'Google Form - Soccer Form.txt')
  assert.match(
    googleFormShortcutContents('Soccer Assessment', 'https://docs.google.com/forms/d/e/abc/viewform'),
    /https:\/\/docs\.google\.com\/forms\/d\/e\/abc\/viewform/,
  )
})
