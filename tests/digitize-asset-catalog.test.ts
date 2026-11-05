import assert from 'node:assert/strict'
import { test } from 'node:test'
import sharp from 'sharp'
import {
  assetUploadFileName,
  buildAssetCatalog,
  enrichImagesWithContextHints,
  formatAssetCatalogForPrompt,
  slugifyAssetHint,
} from '../lib/library/digitize/asset-catalog.ts'
import {
  composeVisualGroupPng,
  ensureFormFriendlyPng,
  FORM_IMAGE_MAX_WIDTH_PX,
  xmlHasMeaningfulText,
} from '../lib/library/digitize/compose-visual-group.ts'
import { groupAdjacentDrawings } from '../lib/library/digitize/extract-docx-text.ts'
import type { ExtractedDocxImage } from '../lib/library/digitize/extract-docx-text.ts'
import { buildExtractionPrompt } from '../lib/library/digitize/extract-questions.ts'

test('should detect meaningful Word text between drawings', () => {
  assert.equal(xmlHasMeaningfulText('<w:p><w:r><w:t>Hello</w:t></w:r></w:p>'), true)
  assert.equal(xmlHasMeaningfulText('<w:p><w:r><w:t>   </w:t></w:r></w:p>'), false)
  assert.equal(xmlHasMeaningfulText('<w:p><w:r></w:r></w:p>'), false)
})

test('should group adjacent drawings across A/B/C captions', () => {
  const a = 'AAAAA'
  const labelA = '<w:p><w:r><w:t>A</w:t></w:r></w:p>'
  const b = 'BBBBB'
  const labelB = '<w:p><w:r><w:t>B</w:t></w:r></w:p>'
  const c = 'CCCCC'
  const stem = '<w:p><w:r><w:t>Explain your choice</w:t></w:r></w:p>'
  const d = 'DDDDD'
  const xml = a + labelA + b + labelB + c + stem + d
  const candidates = [
    { start: 0, end: a.length },
    {
      start: a.length + labelA.length,
      end: a.length + labelA.length + b.length,
    },
    {
      start: a.length + labelA.length + b.length + labelB.length,
      end: a.length + labelA.length + b.length + labelB.length + c.length,
    },
    {
      start: a.length + labelA.length + b.length + labelB.length + c.length + stem.length,
      end:
        a.length + labelA.length + b.length + labelB.length + c.length + stem.length + d.length,
    },
  ]
  const groups = groupAdjacentDrawings(xml, candidates)
  assert.equal(groups.length, 2)
  assert.equal(groups[0].length, 3)
  assert.equal(groups[1].length, 1)
})

test('should burn A/B/C labels above composed panels', async () => {
  const makePanel = async (color: { r: number; g: number; b: number }) =>
    sharp({
      create: { width: 80, height: 60, channels: 3, background: color },
    })
      .png()
      .toBuffer()

  const panels = [
    { bytes: await makePanel({ r: 220, g: 40, b: 40 }), mimeType: 'image/png' },
    { bytes: await makePanel({ r: 40, g: 180, b: 60 }), mimeType: 'image/png' },
    { bytes: await makePanel({ r: 40, g: 80, b: 220 }), mimeType: 'image/png' },
  ]

  const unlabeled = await composeVisualGroupPng(panels, { defaultAlphabeticalLabels: false })
  const labeled = await composeVisualGroupPng(panels, { labels: ['A', 'B', 'C'] })
  const unlabeledMeta = await sharp(unlabeled).metadata()
  const labeledMeta = await sharp(labeled).metadata()
  assert.ok((labeledMeta.height ?? 0) > (unlabeledMeta.height ?? 0))
  assert.equal(labeledMeta.width, unlabeledMeta.width)
})

test('should group adjacent drawings until meaningful text appears', () => {
  const a = 'AAAAA'
  const empty = '<w:p/>'
  const b = 'BBBBB'
  const text = '<w:p><w:r><w:t>Stem</w:t></w:r></w:p>'
  const c = 'CCCCC'
  const xml = a + empty + b + text + c
  const candidates = [
    { start: 0, end: a.length },
    { start: a.length + empty.length, end: a.length + empty.length + b.length },
    {
      start: a.length + empty.length + b.length + text.length,
      end: a.length + empty.length + b.length + text.length + c.length,
    },
  ]
  const groups = groupAdjacentDrawings(xml, candidates)
  assert.equal(groups.length, 2)
  assert.equal(groups[0].length, 2)
  assert.equal(groups[1].length, 1)
})

test('should slugify context hints for Drive file names', () => {
  assert.equal(slugifyAssetHint('Three ball choices!'), 'three-ball-choices')
  assert.equal(
    assetUploadFileName({
      index: 4,
      fileName: 'composed-4.png',
      mimeType: 'image/png',
      bytes: Buffer.alloc(0),
      kind: 'composed',
      contextHint: 'Three ball choices',
    }),
    '04-composed-three-ball-choices.png',
  )
})

test('should build and format an asset catalog for the LLM prompt', () => {
  const images: ExtractedDocxImage[] = [
    {
      index: 1,
      fileName: 'table-1.png',
      mimeType: 'image/png',
      bytes: Buffer.alloc(0),
      kind: 'table',
      contextHint: 'Trial data for baseball',
    },
    {
      index: 2,
      fileName: 'composed-2.png',
      mimeType: 'image/png',
      bytes: Buffer.alloc(0),
      kind: 'composed',
      panelCount: 3,
      contextHint: 'Three ball choices',
    },
  ]
  const catalog = buildAssetCatalog(images)
  const formatted = formatAssetCatalogForPrompt(catalog)
  assert.match(formatted, /## Asset catalog/)
  assert.match(formatted, /IMAGE:1 — table — context: "Trial data for baseball"/)
  assert.match(formatted, /IMAGE:2 — composed — \(3 panels\) — context: "Three ball choices"/)

  const prompt = buildExtractionPrompt('Baseball Assessment', 'Doc [IMAGE:1]\n[IMAGE:2]', 2, catalog)
  assert.match(prompt, /## Asset catalog/)
  assert.match(prompt, /kind "composed"/)
  assert.match(prompt, /kind "table"/)
})

test('should attach context hints from surrounding handout lines', () => {
  const text = ['Intro paragraph', 'Look at the graph below', '[IMAGE:1]', 'Answer below'].join('\n')
  const enriched = enrichImagesWithContextHints(text, [
    {
      index: 1,
      fileName: 'figure.png',
      mimeType: 'image/png',
      bytes: Buffer.alloc(0),
      kind: 'figure',
    },
  ])
  assert.equal(enriched[0].contextHint, 'Look at the graph below')
})

test('should downscale wide images to the Forms-friendly max width', async () => {
  const wide = await sharp({
    create: {
      width: 2400,
      height: 200,
      channels: 3,
      background: { r: 20, g: 40, b: 80 },
    },
  })
    .png()
    .toBuffer()

  const resized = await ensureFormFriendlyPng(wide, 'image/png')
  const meta = await sharp(resized).metadata()
  assert.ok((meta.width ?? 0) <= FORM_IMAGE_MAX_WIDTH_PX)
})
