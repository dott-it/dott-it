import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  LIBRARY_OPENSCI_ED_HREF,
  workspaceEntryHref,
} from '../lib/library/browse/library-workspace-nav.ts'

test('should point workspace user menu at the OpenSciEd library', () => {
  assert.equal(LIBRARY_OPENSCI_ED_HREF, '/library/openscied')
})

test('should open /workspace for signed-in library visitors', () => {
  assert.equal(workspaceEntryHref(true), '/workspace')
})

test('should route anonymous library visitors through login into /workspace', () => {
  assert.equal(workspaceEntryHref(false), '/login?callbackUrl=%2Fworkspace')
})
