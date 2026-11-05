import assert from 'node:assert/strict'
import { test } from 'node:test'
import { libraryOgImageUrl, libraryPageMetadata } from '../lib/library/browse/library-seo.ts'

test('should include Open Graph and Twitter metadata for library pages', () => {
  const metadata = libraryPageMetadata({
    title: 'Soccer Assessment',
    description: 'Assessment for unit 8.1',
    path: '/library/openscied/middle-school/grade-8/units/8.1/assessments/soccer-assessment',
  })

  assert.equal(metadata.title, 'Soccer Assessment')
  assert.equal(metadata.description, 'Assessment for unit 8.1')
  assert.match(String(metadata.alternates?.canonical), /soccer-assessment$/)

  const openGraph = metadata.openGraph
  assert.ok(openGraph)
  assert.equal(openGraph?.title, 'Soccer Assessment')
  assert.equal(openGraph?.type, 'article')
  assert.ok(Array.isArray(openGraph?.images))
  assert.equal(openGraph?.images?.[0]?.url, libraryOgImageUrl())

  const twitter = metadata.twitter
  assert.ok(twitter)
  assert.equal(twitter?.card, 'summary_large_image')
  assert.equal(twitter?.title, 'Soccer Assessment')
  assert.deepEqual(twitter?.images, [libraryOgImageUrl()])
})
