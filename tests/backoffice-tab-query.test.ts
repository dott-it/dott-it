import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  backofficeTabFromQuery,
  backofficeTabHref,
} from '../components/backoffice/common/backoffice-tab-query.ts'

describe('backoffice tab query', () => {
  it('should read the tab from the query and default to assessments', () => {
    assert.equal(backofficeTabFromQuery('templates'), 'templates')
    assert.equal(backofficeTabFromQuery('unknown'), 'assessments')
    assert.equal(backofficeTabFromQuery(null), 'assessments')
  })

  it('should write the selected tab into the backoffice URL', () => {
    assert.equal(backofficeTabHref('templates'), '/backoffice?tab=templates')
    assert.equal(
      backofficeTabHref('users', 'tab=templates'),
      '/backoffice?tab=users',
    )
  })
})
