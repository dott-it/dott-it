import assert from 'node:assert/strict'
import test from 'node:test'
import { getFriendlyFormUrl, getQrCodeUrl } from '../lib/utills/form-utils.js'

test('should build friendly form URL', () => {
  const slug = 'blueberry-fish-house'
  const url = getFriendlyFormUrl(slug)
  assert.equal(url, 'https://eddolearning.com/form/blueberry-fish-house')
})

test('should generate QR code URL for form', () => {
  const slug = 'blueberry-fish-house'
  const qr = getQrCodeUrl(slug)
  assert.equal(qr, `https://eddolearning.com/form/${slug}`)
})
