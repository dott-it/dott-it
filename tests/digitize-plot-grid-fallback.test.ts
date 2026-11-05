import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import {
  isLikelyUnlabeledCoordinateGrid,
  resolvePlotGridFallbackBytes,
} from '../lib/library/digitize/plot-grid-fallback.ts'
import { extractLabeledCoordinatePlotsFromDocx } from '../lib/library/digitize/load-sibling-labeled-plots.ts'
import JSZip from 'jszip'

async function makeBlankGridPng(): Promise<Buffer> {
  // Near-white grid-like field with only light lines → low top-margin ink.
  const size = 400
  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  ${Array.from({ length: 20 }, (_, i) => {
    const p = (i * size) / 20
    return `<line x1="${p}" y1="0" x2="${p}" y2="${size}" stroke="#e5e5e5" stroke-width="1"/>
    <line x1="0" y1="${p}" x2="${size}" y2="${p}" stroke="#e5e5e5" stroke-width="1"/>`
  }).join('\n')}
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function makeLabeledPlotJpeg(): Promise<Buffer> {
  const size = 400
  const svg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="50%" y="28" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#111111">Bat Swing Speed vs. Mass of the Bat</text>
  <text x="20" y="55%" text-anchor="middle" font-family="Arial" font-size="12" fill="#111111" transform="rotate(-90 20 ${size / 2})">bat swing speed (mph)</text>
  <text x="50%" y="${size - 12}" text-anchor="middle" font-family="Arial" font-size="12" fill="#111111">mass of the bat (grams)</text>
  <rect x="60" y="50" width="300" height="300" fill="none" stroke="#333333"/>
</svg>`
  return sharp(Buffer.from(svg)).jpeg().toBuffer()
}

test('should detect unlabeled grids vs labeled title strips', async () => {
  const blank = await makeBlankGridPng()
  const labeled = await makeLabeledPlotJpeg()
  assert.equal(await isLikelyUnlabeledCoordinateGrid(blank, 'image/png'), true)
  assert.equal(await isLikelyUnlabeledCoordinateGrid(labeled, 'image/jpeg'), false)
})

test('should resolve blank grids using sibling labeled plot candidates only', async () => {
  const blank = await makeBlankGridPng()
  const labeled = await makeLabeledPlotJpeg()

  assert.equal(
    await resolvePlotGridFallbackBytes({
      drawingBytes: blank,
      drawingMimeType: 'image/png',
    }),
    null,
  )

  const resolved = await resolvePlotGridFallbackBytes({
    drawingBytes: blank,
    drawingMimeType: 'image/png',
    labeledCoordinatePlots: [labeled],
  })
  assert.ok(resolved)
  assert.equal(resolved.byteLength, labeled.byteLength)

  assert.equal(
    await resolvePlotGridFallbackBytes({
      drawingBytes: labeled,
      drawingMimeType: 'image/jpeg',
      labeledCoordinatePlots: [labeled],
    }),
    null,
  )
})

test('should extract labeled coordinate plots from a docx media folder', async () => {
  const labeled = await makeLabeledPlotJpeg()
  const blank = await makeBlankGridPng()
  const zip = new JSZip()
  zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body/></w:document>')
  zip.file('word/media/plot.jpg', labeled)
  zip.file('word/media/blank.png', blank)
  zip.file('word/media/tiny.png', Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ))
  const bytes = await zip.generateAsync({ type: 'nodebuffer' })
  const plots = await extractLabeledCoordinatePlotsFromDocx(bytes)
  assert.equal(plots.length, 1)
  assert.equal(plots[0].byteLength, labeled.byteLength)
})
