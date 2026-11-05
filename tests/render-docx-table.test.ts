import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  docxTableHasContent,
  docxTableToSvg,
  parseDocxTable,
  renderDocxTablePng,
} from '../lib/library/digitize/render-docx-table.ts'

const SAMPLE_TBL = `
<w:tbl xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:tr>
    <w:tc><w:p><w:r><w:t>Mass (g)</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t>Speed (mph)</w:t></w:r></w:p></w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:p><w:r><w:t>284</w:t></w:r></w:p></w:tc>
    <w:tc><w:p><w:r><w:t>74</w:t></w:r></w:p></w:tc>
  </w:tr>
</w:tbl>`

test('should parse Word table cells into a grid', () => {
  const grid = parseDocxTable(SAMPLE_TBL)
  assert.deepEqual(grid, [
    ['Mass (g)', 'Speed (mph)'],
    ['284', '74'],
  ])
  assert.equal(docxTableHasContent(grid), true)
})

test('should honor gridSpan by inserting empty placeholder cells', () => {
  const tbl = `
  <w:tbl xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:tr>
      <w:tc>
        <w:tcPr><w:gridSpan w:val="2"/></w:tcPr>
        <w:p><w:r><w:t>Merged</w:t></w:r></w:p>
      </w:tc>
    </w:tr>
    <w:tr>
      <w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>
      <w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>
    </w:tr>
  </w:tbl>`
  const grid = parseDocxTable(tbl)
  assert.deepEqual(grid, [
    ['Merged', ''],
    ['A', 'B'],
  ])
})

test('should render a table SVG with cell text', () => {
  const svg = docxTableToSvg([
    ['Mass (g)', 'Speed (mph)'],
    ['284', '74'],
  ])
  assert.match(svg, /<svg /)
  assert.match(svg, /Mass \(g\)/)
  assert.match(svg, /Speed \(mph\)/)
  assert.match(svg, /284/)
})

test('should rasterize a Word table to PNG bytes', async () => {
  const png = await renderDocxTablePng([
    ['Mass (g)', 'Speed (mph)'],
    ['284', '74'],
  ])
  assert.ok(png.byteLength > 100)
  assert.equal(png[0], 0x89)
  assert.equal(png[1], 0x50)
  assert.equal(png[2], 0x4e)
  assert.equal(png[3], 0x47)
})
