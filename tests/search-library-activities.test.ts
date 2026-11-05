import assert from 'node:assert/strict'
import { test } from 'node:test'
import { filterLibraryActivitySearch } from '../lib/library/browse/filter-library-activity-search.ts'
import type { LibraryActivitySearchResult } from '../lib/library/browse/library-activity-search-result.ts'
import { searchLibraryActivities } from '../lib/library/browse/search-library-activities.ts'

test('should find Soccer Assessment in Unit 8.1 when searching by name', () => {
  const results = searchLibraryActivities('Soccer Assessment', 8)

  assert.ok(results.some((result) => result.title === 'Soccer Assessment'))
  assert.ok(results.some((result) => result.href.includes('?focus=assessment:')))
})

test('should search across all grades when no grade filter is passed', () => {
  const results = searchLibraryActivities('Initial Model')
  const grades = new Set(results.map((result) => result.grade))

  assert.ok(grades.has(6))
  assert.ok(grades.has(7))
  assert.ok(grades.has(8))
})

test('should return empty results for blank query', () => {
  assert.deepEqual(searchLibraryActivities('', 8), [])
  assert.deepEqual(searchLibraryActivities('   ', 8), [])
})

test('should find Grade 8 formals whose titles omit the word assessment', () => {
  const results = searchLibraryActivities('assessment', 8)
  const titles = results
    .filter((result) => result.kind === 'assessment' && result.unitCode === '8.2')
    .map((result) => result.title)

  assert.ok(titles.includes('How can objects make different sounds?'))
  assert.ok(titles.includes('How does sound make a window move?'))
  assert.ok(titles.includes('Unit Assessment'))
})

test('should filter a precomputed index without loading manifests on the client path', () => {
  const index: LibraryActivitySearchResult[] = [
    {
      grade: 8,
      unitCode: '8.1',
      unitTitle: 'Contact Forces',
      lessonNumber: 6,
      title: 'Soccer Assessment',
      kind: 'assessment',
      categoryLabel: 'Summative',
      href: '/library/openscied/middle-school/8/units/8.1?focus=assessment:soccer',
    },
    {
      grade: 7,
      unitCode: '7.1',
      unitTitle: 'Chemical Reactions',
      lessonNumber: 1,
      title: 'Initial Model',
      kind: 'opportunity',
      categoryLabel: 'AO',
      href: '/library/openscied/middle-school/7/units/7.1?focus=opportunity:initial-model',
    },
  ]

  const soccer = filterLibraryActivitySearch(index, 'Soccer')
  assert.equal(soccer.length, 1)
  assert.equal(soccer[0]?.title, 'Soccer Assessment')

  const grade7 = filterLibraryActivitySearch(index, 'Model', 7)
  assert.equal(grade7.length, 1)
  assert.equal(grade7[0]?.unitCode, '7.1')
})
