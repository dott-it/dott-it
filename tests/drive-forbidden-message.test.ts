import assert from 'node:assert/strict'
import { test } from 'node:test'
import { GoogleApiRequestError } from '../lib/library/export/google-api-fetch.ts'
import { libraryExportDriveForbiddenResponse } from '../lib/library/export/drive-forbidden-message.ts'

test('should describe Shared Drive Viewer gaps for source-access 403s', () => {
  const result = libraryExportDriveForbiddenResponse(
    new GoogleApiRequestError('The user does not have sufficient permissions for this file.', 403),
  )
  assert.equal(result.code, 'DRIVE_ACCESS_DENIED')
  assert.match(result.error, /OpenSciEd shared drive/i)
})

test('should use a generic permission message for other Drive 403s', () => {
  const result = libraryExportDriveForbiddenResponse(
    new GoogleApiRequestError('Ownership can only be transferred to another user in the same domain.', 403),
  )
  assert.equal(result.code, 'DRIVE_PERMISSION_DENIED')
  assert.doesNotMatch(result.error, /shared drive/i)
})
