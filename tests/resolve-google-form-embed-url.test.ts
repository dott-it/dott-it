import assert from 'node:assert/strict'
import { test } from 'node:test'
import { googleFormEmbedUrl } from '../lib/library/materials/google-form-embed-url.ts'

test('should build embed URL from a published responder URI', () => {
  const responder =
    'https://docs.google.com/forms/d/e/1FAIpQLSfuf4XV53-hM6LuOPTflbyQ4-yB-jTBA7ZM-qgMvNijFeHaiw/viewform'
  const embed = googleFormEmbedUrl(responder)
  assert.match(embed, /\/forms\/d\/e\//)
  assert.match(embed, /[?&]embedded=true/)
})
