import assert from 'node:assert/strict'
import { test } from 'node:test'
import { listLibrarySitemapEntries } from '../lib/library/browse/list-library-sitemap-entries.ts'
import { listIngestedUnitCodes } from '../lib/library/ingest/load-manifest.ts'

test('should include library landing and ingested unit browse URLs', () => {
  const entries = listLibrarySitemapEntries()
  const paths = entries.map((entry) => entry.path)

  assert.ok(paths.includes('/library'))
  assert.ok(paths.includes('/library/openscied/middle-school'))
  assert.ok(paths.includes('/library/openscied/middle-school/grade-8/units/8.1'))

  for (const unitCode of listIngestedUnitCodes()) {
    const grade = Number.parseInt(unitCode.split('.')[0] ?? '', 10)
    assert.ok(paths.includes(`/library/openscied/middle-school/grade-${grade}/units/${unitCode}`))
  }
})

test('should include assessment and opportunity detail URLs for Unit 8.1', () => {
  const paths = listLibrarySitemapEntries().map((entry) => entry.path)

  assert.ok(
    paths.some((path) =>
      path.includes('/library/openscied/middle-school/grade-8/units/8.1/assessments/'),
    ),
  )
  assert.ok(
    paths.some((path) =>
      path.includes('/library/openscied/middle-school/grade-8/units/8.1/opportunities/'),
    ),
  )
})
