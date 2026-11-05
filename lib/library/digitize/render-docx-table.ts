import sharp from 'sharp'

const FONT_SIZE = 13
const CHAR_WIDTH = 7.4
const LINE_HEIGHT = 18
const CELL_PAD_X = 10
const CELL_PAD_Y = 8
const BORDER = '#334155'
const HEADER_FILL = '#f1f5f9'
const CELL_FILL = '#ffffff'
const TEXT_FILL = '#0f172a'
const MAX_TABLE_WIDTH = 960
const MIN_COL_WIDTH = 56
const MAX_PNG_BYTES = 2 * 1024 * 1024

export type DocxTableGrid = string[][]

/**
 * Parse a Word `w:tbl` XML fragment into a rectangular grid of cell text.
 * Nested tables are ignored (cell text only). gridSpan expands empty placeholders.
 */
export function parseDocxTable(tblXml: string): DocxTableGrid {
  const rows: string[][] = []

  for (const rowXml of matchTopLevelElements(tblXml, 'w:tr')) {
    const cells: string[] = []
    for (const cellXml of matchTopLevelElements(rowXml, 'w:tc')) {
      const span = readGridSpan(cellXml)
      cells.push(cellXmlToText(cellXml))
      for (let i = 1; i < span; i += 1) {
        cells.push('')
      }
    }
    if (cells.some((value) => value.trim().length > 0)) {
      rows.push(cells)
    }
  }

  return normalizeGrid(rows)
}

/** True when the table has at least one non-empty cell. */
export function docxTableHasContent(rows: DocxTableGrid): boolean {
  return rows.some((row) => row.some((cell) => cell.trim().length > 0))
}

/**
 * Render a parsed Word table to a PNG suitable for Google Forms imageItem.
 */
export async function renderDocxTablePng(rows: DocxTableGrid): Promise<Buffer> {
  const svg = docxTableToSvg(rows)
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  if (png.byteLength > MAX_PNG_BYTES) {
    throw new Error(`Rendered table PNG exceeds ${MAX_PNG_BYTES} bytes`)
  }
  return png
}

/** Build an SVG table (exported for unit tests / debugging). */
export function docxTableToSvg(rows: DocxTableGrid): string {
  const grid = normalizeGrid(rows)
  if (grid.length === 0) {
    throw new Error('Cannot render an empty table')
  }

  const colCount = grid[0].length
  const wrapped = grid.map((row) => row.map((cell) => wrapCellText(cell)))
  const colWidths = measureColWidths(wrapped, colCount)
  const rowHeights = wrapped.map((row) => {
    const maxLines = Math.max(1, ...row.map((lines) => lines.length))
    return maxLines * LINE_HEIGHT + CELL_PAD_Y * 2
  })

  const width = colWidths.reduce((sum, value) => sum + value, 0)
  const height = rowHeights.reduce((sum, value) => sum + value, 0)

  const parts: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${CELL_FILL}"/>`,
  ]

  let y = 0
  for (let r = 0; r < grid.length; r += 1) {
    const rowH = rowHeights[r]
    let x = 0
    for (let c = 0; c < colCount; c += 1) {
      const colW = colWidths[c]
      const fill = r === 0 ? HEADER_FILL : CELL_FILL
      parts.push(
        `<rect x="${x}" y="${y}" width="${colW}" height="${rowH}" fill="${fill}" stroke="${BORDER}" stroke-width="1"/>`,
      )

      const lines = wrapped[r][c]
      let textY = y + CELL_PAD_Y + FONT_SIZE
      for (const line of lines) {
        parts.push(
          `<text x="${x + CELL_PAD_X}" y="${textY}" font-family="Arial, Helvetica, sans-serif" font-size="${FONT_SIZE}" fill="${TEXT_FILL}">${escapeXml(line)}</text>`,
        )
        textY += LINE_HEIGHT
      }
      x += colW
    }
    y += rowH
  }

  parts.push('</svg>')
  return parts.join('')
}

function normalizeGrid(rows: DocxTableGrid): DocxTableGrid {
  if (rows.length === 0) {
    return []
  }
  const colCount = Math.max(...rows.map((row) => row.length), 1)
  return rows.map((row) => {
    const next = row.slice(0, colCount)
    while (next.length < colCount) {
      next.push('')
    }
    return next
  })
}

function measureColWidths(wrapped: string[][][], colCount: number): number[] {
  const natural = Array.from({ length: colCount }, (_, c) => {
    let maxChars = 1
    for (const row of wrapped) {
      for (const line of row[c] ?? ['']) {
        maxChars = Math.max(maxChars, line.length)
      }
    }
    return Math.max(MIN_COL_WIDTH, Math.ceil(maxChars * CHAR_WIDTH) + CELL_PAD_X * 2)
  })

  const total = natural.reduce((sum, value) => sum + value, 0)
  if (total <= MAX_TABLE_WIDTH) {
    return natural
  }

  const scale = MAX_TABLE_WIDTH / total
  return natural.map((value) => Math.max(MIN_COL_WIDTH, Math.floor(value * scale)))
}

function wrapCellText(text: string, maxChars = 42): string[] {
  const normalized = text.replaceAll(/\r\n|\r/g, '\n').trim()
  if (!normalized) {
    return ['']
  }

  const lines: string[] = []
  for (const paragraph of normalized.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push('')
      continue
    }
    let current = words[0]
    for (const word of words.slice(1)) {
      if (`${current} ${word}`.length <= maxChars) {
        current = `${current} ${word}`
      } else {
        lines.push(current)
        current = word
      }
    }
    lines.push(current)
  }
  return lines.length > 0 ? lines : ['']
}

function cellXmlToText(cellXml: string): string {
  // Drop nested tables so we only keep this cell's own paragraphs.
  const withoutNested = cellXml.replaceAll(/<w:tbl\b[\s\S]*?<\/w:tbl>/gi, '')
  const withBreaks = withoutNested
    .replaceAll(/<\/w:p>/gi, '\n')
    .replaceAll(/<w:tab[^/]*\/>/gi, '\t')
    .replaceAll(/<w:br[^/]*\/>/gi, '\n')
  const withoutTags = withBreaks.replaceAll(/<[^>]+>/g, '')
  return decodeXmlEntities(withoutTags)
    .split('\n')
    .map((line) => line.replaceAll(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
}

function readGridSpan(cellXml: string): number {
  const match = cellXml.match(/<w:gridSpan\b[^>]*\bw:val="(\d+)"/i)
  const span = match ? Number(match[1]) : 1
  return Number.isFinite(span) && span > 1 ? Math.floor(span) : 1
}

/**
 * Match top-level elements of a given local name, respecting nesting depth.
 */
export function matchTopLevelElements(xml: string, localName: string): string[] {
  const open = new RegExp(`<${localName}\\b`, 'gi')
  const results: string[] = []
  let match: RegExpExecArray | null

  while ((match = open.exec(xml)) !== null) {
    const start = match.index
    const end = findElementEnd(xml, start, localName)
    if (end < 0) {
      break
    }
    results.push(xml.slice(start, end))
    open.lastIndex = end
  }

  return results
}

function findElementEnd(xml: string, start: number, localName: string): number {
  const openRe = new RegExp(`<${localName}\\b`, 'gi')
  const closeRe = new RegExp(`</${localName}\\s*>`, 'gi')
  openRe.lastIndex = start
  const first = openRe.exec(xml)
  if (!first || first.index !== start) {
    return -1
  }

  // Self-closing?
  const afterOpen = xml.indexOf('>', start)
  if (afterOpen > start && xml[afterOpen - 1] === '/') {
    return afterOpen + 1
  }

  let depth = 1
  let cursor = first.index + first[0].length
  while (depth > 0 && cursor < xml.length) {
    openRe.lastIndex = cursor
    closeRe.lastIndex = cursor
    const nextOpen = openRe.exec(xml)
    const nextClose = closeRe.exec(xml)
    if (!nextClose) {
      return -1
    }
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1
      cursor = nextOpen.index + nextOpen[0].length
    } else {
      depth -= 1
      cursor = nextClose.index + nextClose[0].length
      if (depth === 0) {
        return cursor
      }
    }
  }
  return -1
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
}
