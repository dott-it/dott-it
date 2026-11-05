import assert from 'node:assert/strict'
import { test } from 'node:test'
import { googleFormEmbedUrl } from '../lib/library/materials/google-form-embed-url.ts'

test('should append embedded=true to a Google Form viewform URL', () => {
  const url = googleFormEmbedUrl(
    'https://docs.google.com/forms/d/e/1FAIpQLScugdqNekHK_7a9AB84eFGp2kSkUVNsdOI-w1-2ZzBnXhgk5Q/viewform',
  )
  assert.match(url, /[?&]embedded=true/)
  assert.match(url, /viewform/)
})

test('should replace an existing embedded param', () => {
  const url = googleFormEmbedUrl(
    'https://docs.google.com/forms/d/e/abc/viewform?usp=sharing&embedded=false',
  )
  assert.match(url, /embedded=true/)
  assert.equal(url.includes('embedded=false'), false)
})
