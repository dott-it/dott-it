import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import JSZip from 'jszip'
import { extractDocxPlainText } from '../lib/library/digitize/extract-docx-plain-text.ts'

async function minimalDocx(paragraphs: string[]): Promise<Buffer> {
  const zip = new JSZip()
  const body = paragraphs
    .map((text) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`)
    .join('')
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
      `<w:body>${body}</w:body></w:document>`,
  )
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
      `</Types>`,
  )
  return zip.generateAsync({ type: 'nodebuffer' })
}

describe('extractDocxPlainText', () => {
  it('should extract paragraph text without using sharp', async () => {
    const bytes = await minimalDocx(['Soccer Assessment Key', 'Look for contact forces'])
    const text = await extractDocxPlainText(bytes)
    assert.match(text, /Soccer Assessment Key/)
    assert.match(text, /Look for contact forces/)
  })

  it('should decode numeric character references from Word', async () => {
    const bytes = await minimalDocx(['It&#8217;s a key&#160;point &#x2014; A &amp; B'])
    const text = await extractDocxPlainText(bytes)
    assert.equal(text, 'It\u2019s a key point \u2014 A & B')
    assert.equal(text.includes('&#'), false)
  })
})
