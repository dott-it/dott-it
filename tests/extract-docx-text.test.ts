import assert from 'node:assert/strict'
import { test } from 'node:test'
import JSZip from 'jszip'
import {
  extractDocxText,
  extractDocxWithImages,
  extractPanelLabelsFromTable,
  isDecorativeDrawing,
  isNameDateOnlyTable,
  isProseLayoutTable,
  isTrivialLabelTable,
  mergeAdjacentTableAssets,
  readDrawingDisplayInches,
  tableGridLooksLikeData,
  EMU_PER_INCH,
} from '../lib/library/digitize/extract-docx-text.ts'

/** 1x1 PNG (red pixel). */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

async function buildMinimalDocx(paragraphs: string[]): Promise<Buffer> {
  const body = paragraphs.map((text) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`).join('')
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}</w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', xml)
  return zip.generateAsync({ type: 'nodebuffer' })
}

async function buildDocxWithPng(): Promise<Buffer> {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    <w:p><w:r><w:t>Before figure</w:t></w:r></w:p>
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline>
            <wp:extent cx="1828800" cy="1371600"/>
            <a:graphic>
              <a:graphicData>
                <a:blip r:embed="rIdImage1"/>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    <w:p><w:r><w:t>After figure</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`,
  )
  zip.file('word/media/image1.png', TINY_PNG)
  return zip.generateAsync({ type: 'nodebuffer' })
}

test('should extract plain text paragraphs from a minimal docx', async () => {
  const bytes = await buildMinimalDocx(['Question 1: Explain forces.', 'Question 2: Draw a free-body diagram.'])
  const text = await extractDocxText(bytes)
  assert.match(text, /Question 1: Explain forces\./)
  assert.match(text, /Question 2: Draw a free-body diagram\./)
})

test('should reject buffers that are not valid docx packages', async () => {
  await assert.rejects(() => extractDocxText(Buffer.from('not-a-docx')), /Invalid \.docx|Can't find end of central directory|Corrupted zip/)
})

test('should insert IMAGE markers and recover embedded png bytes', async () => {
  const bytes = await buildDocxWithPng()
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /Before figure/)
  assert.match(text, /\[IMAGE:1\]/)
  assert.match(text, /After figure/)
  assert.equal(images.length, 1)
  assert.equal(images[0].index, 1)
  assert.equal(images[0].mimeType, 'image/png')
  assert.equal(images[0].kind, 'figure')
  assert.ok(images[0].bytes.byteLength > 0)
  // PNG signature
  assert.equal(images[0].bytes[0], 0x89)
  assert.equal(images[0].bytes[1], 0x50)
})

test('should treat small on-page drawings as decorative chrome', () => {
  const smallExtent = `<wp:extent cx="${Math.round(EMU_PER_INCH * 0.4)}" cy="${Math.round(EMU_PER_INCH * 0.4)}"/>`
  const largeExtent = `<wp:extent cx="${Math.round(EMU_PER_INCH * 2)}" cy="${Math.round(EMU_PER_INCH * 1.5)}"/>`
  const image = {
    index: 1,
    fileName: 'icon.png',
    mimeType: 'image/png',
    bytes: TINY_PNG,
  }

  assert.equal(isDecorativeDrawing(smallExtent, image), true)
  assert.equal(isDecorativeDrawing(largeExtent, image), false)
  assert.equal(isDecorativeDrawing('<w:drawing/>', image), true)

  const inches = readDrawingDisplayInches(largeExtent)
  assert.ok(inches)
  assert.ok(inches.widthInches > 1.9)
})

async function buildDocxWithTable(): Promise<Buffer> {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Before table</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Mass (g)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Speed (mph)</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>284</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>74</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>312</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>71</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:r><w:t>After table</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  return zip.generateAsync({ type: 'nodebuffer' })
}

test('should render native Word tables as PNG IMAGE markers', async () => {
  const bytes = await buildDocxWithTable()
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /Before table/)
  assert.match(text, /\[IMAGE:1\]/)
  assert.match(text, /After table/)
  assert.doesNotMatch(text, /Mass \(g\)/)
  assert.equal(images.length, 1)
  assert.equal(images[0].mimeType, 'image/png')
  assert.equal(images[0].fileName, 'table-1.png')
  assert.equal(images[0].kind, 'table')
  assert.equal(images[0].contextHint, 'Before table')
  assert.ok(images[0].bytes.byteLength > 100)
  // PNG signature
  assert.equal(images[0].bytes[0], 0x89)
  assert.equal(images[0].bytes[1], 0x50)
})

test('should keep document order when mixing drawings and tables', async () => {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    <w:p>
      <w:r>
        <w:drawing>
          <wp:inline>
            <wp:extent cx="1828800" cy="1371600"/>
            <a:graphic><a:graphicData><a:blip r:embed="rIdImage1"/></a:graphicData></a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Mass (g)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Speed</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>284</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>74</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`,
  )
  zip.file('word/media/image1.png', TINY_PNG)
  const bytes = await zip.generateAsync({ type: 'nodebuffer' })
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /\[IMAGE:1\]/)
  assert.match(text, /\[IMAGE:2\]/)
  assert.equal(images.length, 2)
  assert.equal(images[0].kind, 'figure')
  assert.equal(images[0].fileName, 'image1.png')
  assert.equal(images[1].kind, 'table')
  assert.equal(images[1].fileName, 'table-2.png')
})

test('should render nested data tables as IMAGE markers instead of leaking cell text', async () => {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Before nested table</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc>
          <w:tbl>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Mass of the bat (grams)</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>Bat swing speed (mph)</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>284</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>74</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>340</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>70</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:r><w:t>After nested table</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  const bytes = await zip.generateAsync({ type: 'nodebuffer' })
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /Before nested table/)
  assert.match(text, /\[IMAGE:1\]/)
  assert.match(text, /After nested table/)
  assert.doesNotMatch(text, /Mass of the bat/)
  assert.doesNotMatch(text, /284/)
  assert.equal(images.length, 1)
  assert.equal(images[0].kind, 'table')
})

test('should compose two nested side-by-side data tables into one IMAGE', async () => {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>What has a bigger effect on kinetic energy?</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc>
          <w:tbl>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Bat weight (g)</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>Speed of ball after contact (mph)</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>570</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>68.5</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>710</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>73.0</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:tc>
        <w:tc>
          <w:tbl>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Bat swing speed (mph)</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>Speed of ball after contact (mph)</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>20.5</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>60.2</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>27.3</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>68.8</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:r><w:t>Question 8) Use the data from the tables above.</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  const bytes = await zip.generateAsync({ type: 'nodebuffer' })
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /What has a bigger effect/)
  assert.match(text, /\[IMAGE:1\]/)
  assert.doesNotMatch(text, /\[IMAGE:2\]/)
  assert.doesNotMatch(text, /Bat weight/)
  assert.equal(images.length, 1)
  assert.equal(images[0].kind, 'composed')
  assert.equal(images[0].panelCount, 2)
  assert.ok((images[0].widthPx ?? 0) > (images[0].heightPx ?? 0))
})

test('should compose a nested data table beside a plot-grid drawing into one IMAGE', async () => {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    <w:p><w:r><w:t>The data table below shows bat mass and swing speed.</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc>
          <w:tbl>
            <w:tr>
              <w:tc><w:p><w:r><w:t>Mass of the bat (grams)</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>Bat swing speed (mph)</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>284</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>74</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
              <w:tc><w:p><w:r><w:t>340</w:t></w:r></w:p></w:tc>
              <w:tc><w:p><w:r><w:t>70</w:t></w:r></w:p></w:tc>
            </w:tr>
          </w:tbl>
        </w:tc>
        <w:tc>
          ${drawingParagraph('rIdGrid')}
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:r><w:t>Question 4) Make a coordinate plot.</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdGrid" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/grid.png"/>
</Relationships>`,
  )
  zip.file('word/media/grid.png', TINY_PNG)
  const bytes = await zip.generateAsync({ type: 'nodebuffer' })
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /The data table below/)
  assert.match(text, /\[IMAGE:1\]/)
  assert.doesNotMatch(text, /\[IMAGE:2\]/)
  assert.doesNotMatch(text, /Mass of the bat/)
  assert.equal(images.length, 1)
  assert.equal(images[0].kind, 'composed')
  assert.equal(images[0].panelCount, 2)
})

test('should compose adjacent top-level data table markers side-by-side', async () => {
  const merged = await mergeAdjacentTableAssets(
    'Intro\n[IMAGE:1]\n[IMAGE:2]\nQuestion 8',
    [
      {
        index: 1,
        fileName: 'table-1.png',
        mimeType: 'image/png',
        bytes: TINY_PNG,
        kind: 'table',
        widthPx: 100,
        heightPx: 80,
      },
      {
        index: 2,
        fileName: 'table-2.png',
        mimeType: 'image/png',
        bytes: TINY_PNG,
        kind: 'table',
        widthPx: 120,
        heightPx: 80,
      },
    ],
  )

  assert.equal(merged.images.length, 1)
  assert.equal(merged.images[0].kind, 'composed')
  assert.equal(merged.images[0].panelCount, 2)
  assert.match(merged.text, /Intro\n\[IMAGE:1\]\nQuestion 8/)
  assert.doesNotMatch(merged.text, /\[IMAGE:2\]/)
})

test('should not glue a stacked figure above a following table via adjacent merge', async () => {
  const merged = await mergeAdjacentTableAssets(
    '[IMAGE:1]\n[IMAGE:2]',
    [
      {
        index: 1,
        fileName: 'grid.png',
        mimeType: 'image/png',
        bytes: TINY_PNG,
        kind: 'figure',
      },
      {
        index: 2,
        fileName: 'table-2.png',
        mimeType: 'image/png',
        bytes: TINY_PNG,
        kind: 'table',
      },
    ],
  )
  assert.equal(merged.images.length, 2)
  assert.match(merged.text, /\[IMAGE:1\]/)
  assert.match(merged.text, /\[IMAGE:2\]/)
})

test('should classify name/date and trivial label tables', () => {
  assert.equal(isNameDateOnlyTable([['Name: ______', 'Date: ______']]), true)
  assert.equal(isTrivialLabelTable([['A', 'B', 'C']]), true)
  assert.equal(
    tableGridLooksLikeData([
      ['Mass (g)', 'Speed'],
      ['284', '74'],
    ]),
    true,
  )
})

test('should classify weather callout tables as prose, not data', () => {
  const weatherRows = [
    [
      'To the right is a graph that shows how pitch speed is affected by wind speed. The line on the graph shows the general relationship between wind speed and pitch speed. Points A, B, and C represent three of the same type of fast pitch all thrown at the same initial speed from a pitcher\'s fingertips, but under different wind conditions.',
      'Data source: Kagan, D. (nd). The physics of pitching in the wind. Retrieved from: https://physics.csuchico.edu/baseball/Pubs/PitchingWindLong.pdf',
    ],
  ]
  assert.equal(isProseLayoutTable(weatherRows), true)
  assert.equal(isProseLayoutTable([['Mass (g)', 'Speed'], ['284', '74']]), false)
})

test('should extract prose layout tables as plain text instead of table PNGs', async () => {
  const prose =
    'To the right is a graph that shows how pitch speed is affected by wind speed. The line on the graph shows the general relationship between wind speed and pitch speed. Points A, B, and C represent three of the same type of fast pitch all thrown at the same initial speed from a pitcher\'s fingertips, but under different wind conditions.'
  const source =
    'Data source: Kagan, D. (nd). The physics of pitching in the wind.'

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Weather Conditions and Pitch Speed</w:t></w:r></w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>${prose}</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>${source}</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:r><w:t>Question 1) Draw three diagrams.</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  const bytes = await zip.generateAsync({ type: 'nodebuffer' })
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /Weather Conditions and Pitch Speed/)
  assert.match(text, /To the right is a graph/)
  assert.match(text, /Question 1/)
  assert.equal(images.length, 0)
  assert.ok(text.indexOf('To the right is a graph') < text.indexOf('Question 1'))
})

test('should extract A/B/C panel labels from a caption row', () => {
  assert.deepEqual(extractPanelLabelsFromTable([['A', 'B', 'C']], 3), ['A', 'B', 'C'])
  assert.deepEqual(
    extractPanelLabelsFromTable(
      [
        ['', '', ''],
        ['a', 'b', 'c'],
      ],
      3,
    ),
    ['A', 'B', 'C'],
  )
  assert.equal(extractPanelLabelsFromTable([['Mass', 'Speed']], 2), null)
})

function drawingParagraph(embedId: string): string {
  return `<w:p>
      <w:r>
        <w:drawing>
          <wp:inline>
            <wp:extent cx="1828800" cy="1371600"/>
            <a:graphic><a:graphicData><a:blip r:embed="${embedId}"/></a:graphicData></a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`
}

async function buildDocxWithThreeAdjacentBalls(): Promise<Buffer> {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    <w:p><w:r><w:t>Three ball choices</w:t></w:r></w:p>
    ${drawingParagraph('rIdImage1')}
    ${drawingParagraph('rIdImage2')}
    ${drawingParagraph('rIdImage3')}
    <w:p><w:r><w:t>Which ball hits hardest?</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <Relationship Id="rIdImage2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.png"/>
  <Relationship Id="rIdImage3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image3.png"/>
</Relationships>`,
  )
  zip.file('word/media/image1.png', TINY_PNG)
  zip.file('word/media/image2.png', TINY_PNG)
  zip.file('word/media/image3.png', TINY_PNG)
  return zip.generateAsync({ type: 'nodebuffer' })
}

test('should compose three adjacent drawings into one IMAGE asset', async () => {
  const bytes = await buildDocxWithThreeAdjacentBalls()
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /Three ball choices/)
  assert.match(text, /\[IMAGE:1\]/)
  assert.doesNotMatch(text, /\[IMAGE:2\]/)
  assert.match(text, /Which ball hits hardest\?/)
  assert.equal(images.length, 1)
  assert.equal(images[0].kind, 'composed')
  assert.equal(images[0].panelCount, 3)
  assert.equal(images[0].contextHint, 'Three ball choices')
  assert.ok(images[0].bytes.byteLength > TINY_PNG.byteLength)
})

test('should keep separate IMAGE markers when text sits between drawings', async () => {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${drawingParagraph('rIdImage1')}
    <w:p><w:r><w:t>Stem between figures</w:t></w:r></w:p>
    ${drawingParagraph('rIdImage2')}
  </w:body>
</w:document>`

  const zip = new JSZip()
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  )
  zip.file('word/document.xml', documentXml)
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <Relationship Id="rIdImage2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.png"/>
</Relationships>`,
  )
  zip.file('word/media/image1.png', TINY_PNG)
  zip.file('word/media/image2.png', TINY_PNG)
  const bytes = await zip.generateAsync({ type: 'nodebuffer' })
  const { text, images } = await extractDocxWithImages(bytes)

  assert.match(text, /\[IMAGE:1\]/)
  assert.match(text, /Stem between figures/)
  assert.match(text, /\[IMAGE:2\]/)
  assert.equal(images.length, 2)
  assert.equal(images[0].kind, 'figure')
  assert.equal(images[1].kind, 'figure')
})
