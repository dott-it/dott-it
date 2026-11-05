import JSZip from 'jszip'
import { enrichImagesWithContextHints } from './asset-catalog'
import {
  composeVisualGroupPng,
  ensureFormFriendlyPng,
  type ComposePanel,
} from './compose-visual-group'
import { readRasterImageSize } from './image-dimensions'
import { resolvePlotGridFallbackBytes } from './plot-grid-fallback'
import {
  docxTableHasContent,
  parseDocxTable,
  renderDocxTablePng,
} from './render-docx-table'

export { FORMS_MAX_IMAGE_BYTES } from './compose-visual-group'

/** Office DrawingML: 914_400 EMUs = 1 inch. */
export const EMU_PER_INCH = 914_400

/**
 * Skip drawings whose on-page box is smaller than this (title icons, bullets, logos).
 * ~0.85" keeps compact photos while dropping OpenSciEd header glyphs.
 */
export const DECORATIVE_MAX_DISPLAY_INCHES = 0.85

/** Tiny raster payloads are almost always decorative chrome. */
export const DECORATIVE_MAX_PIXEL_EDGE = 128
export const DECORATIVE_MAX_FILE_BYTES = 12 * 1024

const RASTER_MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
}

export type ExtractedDocxImageKind = 'figure' | 'table' | 'composed'

export interface ExtractedDocxImage {
  /** 1-based index matching `[IMAGE:N]` markers in text. */
  index: number
  fileName: string
  mimeType: string
  bytes: Buffer
  kind?: ExtractedDocxImageKind
  /** Short hint from surrounding handout text (prev/next paragraph). */
  contextHint?: string
  widthPx?: number
  heightPx?: number
  /** When kind is composed, how many source panels were merged. */
  panelCount?: number
}

export interface ExtractedDocxContent {
  text: string
  images: ExtractedDocxImage[]
}

interface LoadedDrawingCandidate {
  start: number
  end: number
  drawingXml: string
  image: Omit<ExtractedDocxImage, 'index' | 'kind'>
}

/**
 * Extract plain text from a .docx buffer (Office Open XML).
 * Images are ignored — prefer {@link extractDocxWithImages} when figures matter.
 */
export async function extractDocxText(bytes: ArrayBuffer | Uint8Array | Buffer): Promise<string> {
  const { text } = await extractDocxWithImages(bytes)
  return text
}

export interface ExtractDocxWithImagesOptions {
  /**
   * Labeled coordinate-plot rasters from sibling unit handouts. When the current
   * document pairs a bare grid with a data table, these replace the blank grid.
   */
  labeledCoordinatePlots?: Buffer[]
}

/**
 * Extract plain text and ordered raster images from a .docx.
 * Embedded drawings and native Word tables become `[IMAGE:N]` markers
 * (tables are rendered to PNG) in document order.
 * Adjacent drawings with no meaningful text between them are composed into one asset.
 */
export async function extractDocxWithImages(
  bytes: ArrayBuffer | Uint8Array | Buffer,
  options?: ExtractDocxWithImagesOptions,
): Promise<ExtractedDocxContent> {
  const zip = await JSZip.loadAsync(bytes)
  const documentXmlFile = zip.file('word/document.xml')
  if (!documentXmlFile) {
    throw new Error('Invalid .docx: missing word/document.xml')
  }

  const rels = await loadDocumentRelationships(zip)
  const documentXml = await documentXmlFile.async('string')
  const { xml: markedXml, images } = await replaceVisualsWithMarkers(
    documentXml,
    zip,
    rels,
    options,
  )
  const text = xmlToPlainText(markedXml)
  const merged = await mergeAdjacentTableAssets(text, images)
  const withHints = enrichImagesWithContextHints(merged.text, merged.images)

  return {
    text: merged.text,
    images: withHints,
  }
}

async function loadDocumentRelationships(zip: JSZip): Promise<Map<string, string>> {
  const relsFile = zip.file('word/_rels/document.xml.rels')
  const map = new Map<string, string>()
  if (!relsFile) {
    return map
  }

  const relsXml = await relsFile.async('string')
  const relPattern =
    /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/?>|<Relationship\b[^>]*\bTarget="([^"]+)"[^>]*\bId="([^"]+)"[^>]*\/?>/gi

  for (const match of relsXml.matchAll(relPattern)) {
    const id = match[1] ?? match[4]
    const target = match[2] ?? match[3]
    if (id && target) {
      map.set(id, target.replaceAll('\\', '/'))
    }
  }

  return map
}

/**
 * Replace top-level Word tables and drawings with `[IMAGE:N]` markers in document order.
 * Nested tables and drawings inside layout tables become image assets (not plain-text leaks).
 */
async function replaceVisualsWithMarkers(
  documentXml: string,
  zip: JSZip,
  rels: Map<string, string>,
  options?: ExtractDocxWithImagesOptions,
): Promise<{ xml: string; images: ExtractedDocxImage[] }> {
  const images: ExtractedDocxImage[] = []
  const segments = splitTopLevelTables(documentXml)
  let result = ''

  for (const segment of segments) {
    if (segment.type === 'table') {
      const replacement = await tableToMarkerOrFallback(
        segment.content,
        images,
        zip,
        rels,
        options,
      )
      result += replacement
      continue
    }

    const { xml, images: drawingImages } = await replaceDrawingsWithMarkers(
      segment.content,
      zip,
      rels,
      images.length,
    )
    images.push(...drawingImages)
    result += xml
  }

  return { xml: result, images }
}

/**
 * Convert a Word table into `[IMAGE:N]` markers and/or plain prose paragraphs.
 * - Embedded drawings (graphs / multi-panel figures) become image assets.
 * - Nested numeric data tables are rendered to PNG.
 * - Narrative layout tables (weather callouts, sidebars) become plain text — not PNG —
 *   so section copy stays in document order before Question 1.
 */
async function tableToMarkerOrFallback(
  tableXml: string,
  images: ExtractedDocxImage[],
  zip: JSZip,
  rels: Map<string, string>,
  options?: ExtractDocxWithImagesOptions,
): Promise<string> {
  const proseParts: string[] = []
  const markers: string[] = []

  try {
    const outerRows = parseDocxTable(tableXml)
    const candidates = await loadDrawingCandidates(tableXml, zip, rels)
    const nestedTables = findNestedTablesInCellsWithPos(tableXml)
    const proseLayout = isProseLayoutTable(outerRows)

    // Narrative callout text first (so it stays before the graph in document order).
    if (proseLayout) {
      proseParts.push(tableRowsToDocumentParagraphs(outerRows))
    }

    const nestedDataGrids: Array<{ start: number; end: number; rows: string[][] }> = []
    for (const nested of nestedTables) {
      const nestedRows = parseDocxTable(nested.content)
      if (!shouldRenderTableGrid(nestedRows) || isProseLayoutTable(nestedRows)) {
        if (isProseLayoutTable(nestedRows)) {
          proseParts.push(tableRowsToDocumentParagraphs(nestedRows))
        }
        continue
      }
      nestedDataGrids.push({ start: nested.start, end: nested.end, rows: nestedRows })
    }

    const drawingGroups =
      candidates.length === 0 ? [] : groupAdjacentDrawings(tableXml, candidates)

    // Mixed layout: blank plot grid beside a data table (or similar) → one side-by-side asset.
    // Pair each drawing group with nearby nested grids (same layout row), not every grid
    // in a giant multi-section Word table.
    if (drawingGroups.length > 0 && nestedDataGrids.length > 0) {
      const consumedGrids = new Set<number>()
      let emittedMixed = false

      for (const group of drawingGroups) {
        const groupStart = group[0].start
        const lastDrawing = group.at(-1)
        if (!lastDrawing) {
          continue
        }
        const groupEnd = lastDrawing.end
        const nearbyGrids = nestedDataGrids.filter((grid, gridIndex) => {
          if (consumedGrids.has(gridIndex)) {
            return false
          }
          // Same visual band: nested grid and drawing within ~8KB of XML of each other.
          const gap = Math.min(
            Math.abs(grid.start - groupEnd),
            Math.abs(groupStart - grid.end),
            Math.abs(grid.start - groupStart),
          )
          return gap < 8000
        })

        if (nearbyGrids.length === 0) {
          continue
        }

        type OrderedPanel = {
          start: number
          build: () => Promise<ComposePanel>
        }
        const ordered: OrderedPanel[] = [
          {
            start: groupStart,
            build: async () => {
              let bytes = await materializeDrawingGroupBytes(group, {
                labels: extractPanelLabelsFromTable(outerRows, group.length) ?? undefined,
                betweenXml: tableXml.slice(groupStart, groupEnd),
              })
              const source = group[0]?.image
              if (group.length === 1 && source) {
                const fallback = await resolvePlotGridFallbackBytes({
                  drawingBytes: source.bytes,
                  drawingMimeType: source.mimeType,
                  labeledCoordinatePlots: options?.labeledCoordinatePlots,
                })
                if (fallback) {
                  bytes = await ensureFormFriendlyPng(fallback, 'image/jpeg')
                }
              }
              return { bytes, mimeType: 'image/png' }
            },
          },
          ...nearbyGrids.map((grid) => ({
            start: grid.start,
            build: async () => {
              const rawPng = await renderDocxTablePng(grid.rows)
              const bytes = await ensureFormFriendlyPng(rawPng, 'image/png')
              return { bytes, mimeType: 'image/png' as const }
            },
          })),
        ]
        ordered.sort((a, b) => a.start - b.start)

        if (ordered.length < 2 || ordered.length > 4) {
          continue
        }

        const panels: ComposePanel[] = []
        for (const panel of ordered) {
          panels.push(await panel.build())
        }
        const index = await pushComposedPanels(images, panels, {
          fileNamePrefix: 'composed-layout',
          labels: extractPanelLabelsFromTable(outerRows, panels.length),
        })
        markers.push(markerParagraph(index))
        emittedMixed = true
        for (const [gridIndex, nestedDataGrid] of nestedDataGrids.entries()) {
          if (nearbyGrids.includes(nestedDataGrid)) {
            consumedGrids.add(gridIndex)
          }
        }
      }

      if (emittedMixed) {
        // Emit any leftover drawings / nested grids that were not part of a mixed pair.
        for (const group of drawingGroups) {
          const alreadyUsed = nestedDataGrids.some((grid, gridIndex) => {
            // Drawing was used if any nearby grid was consumed with it — approximate:
            // if we emitted mixed and this group had a nearby consumed grid.
            const groupStart = group[0].start
            const lastDrawing = group.at(-1)
            if (!lastDrawing) {
              return false
            }
            const groupEnd = lastDrawing.end
            const gap = Math.min(
              Math.abs(grid.start - groupEnd),
              Math.abs(groupStart - grid.end),
              Math.abs(grid.start - groupStart),
            )
            return consumedGrids.has(gridIndex) && gap < 8000
          })
          if (alreadyUsed) {
            continue
          }
          const index = images.length + 1
          const labels = extractPanelLabelsFromTable(outerRows, group.length)
          const lastDrawing = group.at(-1)
          if (!lastDrawing) {
            continue
          }
          const image = await materializeDrawingGroup(group, index, {
            labels: labels ?? undefined,
            betweenXml: tableXml.slice(group[0].start, lastDrawing.end),
          })
          images.push(image)
          markers.push(markerParagraph(index))
        }

        const leftoverGrids = nestedDataGrids.filter((_, gridIndex) => !consumedGrids.has(gridIndex))
        if (leftoverGrids.length >= 2 && leftoverGrids.length <= 4) {
          const labels = extractPanelLabelsFromTable(outerRows, leftoverGrids.length)
          const index = await pushComposedDataTableImages(
            leftoverGrids.map((grid) => grid.rows),
            images,
            labels,
          )
          markers.push(markerParagraph(index))
        } else {
          for (const grid of leftoverGrids) {
            const index = await pushRenderedTableImage(grid.rows, images)
            markers.push(markerParagraph(index))
          }
        }

        return `${proseParts.join('')}${markers.join('')}`
      }
    }

    // Drawings inside the table (wind graph, blank plot grid, three-ball panels, etc.)
    if (drawingGroups.length > 0) {
      for (const group of drawingGroups) {
        const index = images.length + 1
        const labels = extractPanelLabelsFromTable(outerRows, group.length)
        const lastDrawing = group.at(-1)
        if (!lastDrawing) {
          continue
        }
        let image = await materializeDrawingGroup(group, index, {
          labels: labels ?? undefined,
          betweenXml: tableXml.slice(group[0].start, lastDrawing.end),
        })
        if (group.length === 1 && group[0]?.image) {
          const fallback = await resolvePlotGridFallbackBytes({
            drawingBytes: group[0].image.bytes,
            drawingMimeType: group[0].image.mimeType,
            labeledCoordinatePlots: options?.labeledCoordinatePlots,
          })
          if (fallback) {
            const bytes = await ensureFormFriendlyPng(fallback, 'image/jpeg')
            const pixels = readRasterImageSize(bytes, 'image/png')
            image = {
              ...image,
              bytes,
              fileName: `plot-fallback-${index}.png`,
              ...(pixels ? { widthPx: pixels.width, heightPx: pixels.height } : {}),
            }
          }
        }
        images.push(image)
        markers.push(markerParagraph(index))
      }
    }

    // Nested data tables (OpenSciEd often wraps 2 side-by-side grids in a layout table).
    if (nestedDataGrids.length >= 2 && nestedDataGrids.length <= 4) {
      const labels = extractPanelLabelsFromTable(outerRows, nestedDataGrids.length)
      const index = await pushComposedDataTableImages(
        nestedDataGrids.map((grid) => grid.rows),
        images,
        labels,
      )
      markers.push(markerParagraph(index))
    } else {
      for (const grid of nestedDataGrids) {
        const index = await pushRenderedTableImage(grid.rows, images)
        markers.push(markerParagraph(index))
      }
    }

    // Outer numeric/data grids → PNG. Never PNG-render prose callouts.
    if (!proseLayout && shouldRenderTableGrid(outerRows)) {
      const skipOuterCaption =
        candidates.length > 0 && !tableGridLooksLikeData(outerRows)
      if (!skipOuterCaption && nestedTables.length === 0) {
        const index = await pushRenderedTableImage(outerRows, images)
        markers.push(markerParagraph(index))
      } else if (skipOuterCaption && docxTableHasContent(outerRows)) {
        // Recover caption/sidebar text that would otherwise be dropped beside a figure.
        proseParts.push(tableRowsToDocumentParagraphs(outerRows))
      }
    }
  } catch (error) {
    console.warn(
      `[digitize] Failed to extract Word table visuals: ${(error as Error).message}`,
    )
  }

  return `${proseParts.join('')}${markers.join('')}`
}

/** Flatten table cells into Word paragraphs for the plain-text extraction stream. */
export function tableRowsToDocumentParagraphs(rows: string[][]): string {
  const seen = new Set<string>()
  const paragraphs: string[] = []

  for (const cell of rows.flat()) {
    const text = cell.replaceAll(/\s+/g, ' ').trim()
    if (!text || seen.has(text)) {
      continue
    }
    // Skip A/B/C panel labels — those are burned onto composed figures.
    if (/^[A-Za-z]$/.test(text)) {
      continue
    }
    seen.add(text)
    paragraphs.push(
      `<w:p><w:r><w:t xml:space="preserve">${escapeXmlText(text)}</w:t></w:r></w:p>`,
    )
  }

  return paragraphs.join('')
}

/**
 * True for narrative layout tables (callouts / sidebars), not numeric data grids.
 * Example: Weather Conditions two-column prose + data-source citation.
 * Note: long callouts may mention "speed"/"mass" in sentences — that is still prose.
 */
export function isProseLayoutTable(rows: string[][]): boolean {
  if (!docxTableHasContent(rows)) {
    return false
  }
  if (isNameDateOnlyTable(rows) || isTrivialLabelTable(rows)) {
    return false
  }

  const cells = rows
    .flat()
    .map((cell) => cell.replaceAll(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (cells.length === 0 || cells.length > 8) {
    return false
  }

  const blob = cells.join(' ')
  const wordCount = blob.split(/\s+/).filter(Boolean).length
  const avgLen = blob.length / cells.length
  const shortNumericCells = cells.filter((cell) => /^\d+([.,]\d+)?%?$/.test(cell)).length

  // Dense short numeric cells ⇒ data grid, not prose.
  if (shortNumericCells >= 2 && avgLen < 40) {
    return false
  }

  return wordCount >= 25 && blob.length >= 100 && avgLen >= 40
}

function escapeXmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

async function pushRenderedTableImage(
  rows: ReturnType<typeof parseDocxTable>,
  images: ExtractedDocxImage[],
): Promise<number> {
  const rawPng = await renderDocxTablePng(rows)
  const bytes = await ensureFormFriendlyPng(rawPng, 'image/png')
  const index = images.length + 1
  const pixels = readRasterImageSize(bytes, 'image/png')
  images.push({
    index,
    fileName: `table-${index}.png`,
    mimeType: 'image/png',
    bytes,
    kind: 'table',
    ...(pixels ? { widthPx: pixels.width, heightPx: pixels.height } : {}),
  })
  return index
}

/**
 * Render 2–4 sibling data grids and compose them horizontally (OSE side-by-side tables).
 * Skips default A/B labels unless the layout table provides captions.
 */
export async function pushComposedDataTableImages(
  rowSets: string[][][],
  images: ExtractedDocxImage[],
  labels?: string[] | null,
): Promise<number> {
  if (rowSets.length < 2) {
    throw new Error('pushComposedDataTableImages requires at least 2 grids')
  }

  const panels: ComposePanel[] = []
  for (const rows of rowSets) {
    const rawPng = await renderDocxTablePng(rows)
    const bytes = await ensureFormFriendlyPng(rawPng, 'image/png')
    panels.push({ bytes, mimeType: 'image/png' })
  }

  return pushComposedPanels(images, panels, {
    fileNamePrefix: 'composed-tables',
    labels,
  })
}

async function pushComposedPanels(
  images: ExtractedDocxImage[],
  panels: ComposePanel[],
  options?: { fileNamePrefix?: string; labels?: string[] | null },
): Promise<number> {
  const labelList =
    options?.labels && options.labels.length === panels.length ? options.labels : undefined
  const composed = await composeVisualGroupPng(panels, {
    defaultAlphabeticalLabels: false,
    ...(labelList ? { labels: labelList } : {}),
  })
  const index = images.length + 1
  const pixels = readRasterImageSize(composed, 'image/png')
  const prefix = options?.fileNamePrefix ?? 'composed'
  images.push({
    index,
    fileName: `${prefix}-${index}.png`,
    mimeType: 'image/png',
    bytes: composed,
    kind: 'composed',
    panelCount: panels.length,
    ...(pixels ? { widthPx: pixels.width, heightPx: pixels.height } : {}),
  })
  return index
}

/**
 * When two+ data-table IMAGE markers sit next to each other with only whitespace
 * between them (common when Word emits separate top-level tables), merge into one
 * horizontal composed asset so Forms shows them side-by-side like the handout.
 *
 * Does NOT merge figure+table pairs here — a figure above a table in document
 * order is often intentional stacking. Side-by-side plot-grid + data-table layouts
 * are composed earlier inside {@link tableToMarkerOrFallback}.
 */
export async function mergeAdjacentTableAssets(
  text: string,
  images: ExtractedDocxImage[],
): Promise<ExtractedDocxContent> {
  const byIndex = new Map(images.map((image) => [image.index, image]))
  const markerRe = /\[IMAGE:(\d+)\]/g
  const markers: Array<{ index: number; start: number; end: number }> = []
  for (const match of text.matchAll(markerRe)) {
    markers.push({
      index: Number(match[1]),
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    })
  }

  if (markers.length < 2) {
    return { text, images }
  }

  type Run = { startMarker: number; endMarker: number; imageIndexes: number[] }
  const runs: Run[] = []
  let runStart = 0

  for (let i = 1; i <= markers.length; i += 1) {
    const prev = markers[i - 1]
    const curr = markers[i]
    const prevImage = byIndex.get(prev.index)
    const canExtend =
      curr &&
      prevImage?.kind === 'table' &&
      byIndex.get(curr.index)?.kind === 'table' &&
      onlyWhitespaceBetween(text, prev.end, curr.start)

    if (canExtend) {
      continue
    }

    const imageIndexes = markers.slice(runStart, i).map((marker) => marker.index)
    if (
      imageIndexes.length >= 2 &&
      imageIndexes.length <= 4 &&
      imageIndexes.every((index) => byIndex.get(index)?.kind === 'table')
    ) {
      runs.push({
        startMarker: runStart,
        endMarker: i - 1,
        imageIndexes,
      })
    }
    runStart = i
  }

  if (runs.length === 0) {
    return { text, images }
  }

  // Rebuild images + rewrite markers from last run to first so offsets stay valid.
  let nextText = text
  let nextImages = [...images]

  for (const run of [...runs].reverse()) {
    const panels = run.imageIndexes.map((index) => {
      const image = byIndex.get(index)
      if (!image) {
        throw new Error(`Missing image ${index} while composing adjacent tables`)
      }
      return { bytes: image.bytes, mimeType: image.mimeType }
    })
    const composedBytes = await composeVisualGroupPng(panels, {
      defaultAlphabeticalLabels: false,
    })
    const firstMarker = markers[run.startMarker]
    const lastMarker = markers[run.endMarker]
    const composedIndex = firstMarker.index
    const pixels = readRasterImageSize(composedBytes, 'image/png')
    const composedImage: ExtractedDocxImage = {
      index: composedIndex,
      fileName: `composed-tables-${composedIndex}.png`,
      mimeType: 'image/png',
      bytes: composedBytes,
      kind: 'composed',
      panelCount: panels.length,
      ...(pixels ? { widthPx: pixels.width, heightPx: pixels.height } : {}),
    }

    const drop = new Set(run.imageIndexes.slice(1))
    nextImages = nextImages
      .filter((image) => !drop.has(image.index))
      .map((image) => (image.index === composedIndex ? composedImage : image))

    nextText =
      nextText.slice(0, firstMarker.start) +
      `[IMAGE:${composedIndex}]` +
      nextText.slice(lastMarker.end)
  }

  // Reindex densely so catalog/LLM see 1..N without gaps.
  return reindexExtractedImages(nextText, nextImages)
}

function onlyWhitespaceBetween(text: string, start: number, end: number): boolean {
  return /^\s*$/.test(text.slice(start, end))
}

export function reindexExtractedImages(
  text: string,
  images: ExtractedDocxImage[],
): ExtractedDocxContent {
  const ordered = [...images].sort((a, b) => a.index - b.index)
  const remap = new Map<number, number>()
  const reindexed = ordered.map((image, offset) => {
    const nextIndex = offset + 1
    remap.set(image.index, nextIndex)
    return { ...image, index: nextIndex }
  })

  const nextText = text.replaceAll(/\[IMAGE:(\d+)\]/g, (_full, raw: string) => {
    const mapped = remap.get(Number(raw))
    return mapped ? `[IMAGE:${mapped}]` : `[IMAGE:${raw}]`
  })

  return { text: nextText, images: reindexed }
}

/** Nested `w:tbl` elements that live inside cells of the outer table. */
export function findNestedTablesInCells(tableXml: string): string[] {
  return findNestedTablesInCellsWithPos(tableXml).map((entry) => entry.content)
}

/** Nested tables with offsets inside the outer table XML (document order). */
export function findNestedTablesInCellsWithPos(
  tableXml: string,
): Array<{ content: string; start: number; end: number }> {
  const nested: Array<{ content: string; start: number; end: number }> = []
  for (const row of matchTopLevelElementsWithPos(tableXml, 'w:tr')) {
    for (const cell of matchTopLevelElementsWithPos(row.content, 'w:tc')) {
      const cellAbsStart = row.start + cell.start
      for (const segment of splitTopLevelTables(cell.content)) {
        if (segment.type !== 'table') {
          continue
        }
        const relativeStart = cell.content.indexOf(segment.content)
        if (relativeStart === -1) {
          continue
        }
        const start = cellAbsStart + relativeStart
        nested.push({
          content: segment.content,
          start,
          end: start + segment.content.length,
        })
      }
    }
  }
  return nested
}

function matchTopLevelElementsWithPos(
  xml: string,
  localName: string,
): Array<{ content: string; start: number; end: number }> {
  const open = new RegExp(`<${localName}\\b`, 'gi')
  const results: Array<{ content: string; start: number; end: number }> = []
  let match: RegExpExecArray | null

  while ((match = open.exec(xml)) !== null) {
    const start = match.index
    const end = findMatchingClose(xml, start, localName)
    if (end < 0) {
      break
    }
    results.push({ content: xml.slice(start, end), start, end })
    open.lastIndex = end
  }

  return results
}

export function isNameDateOnlyTable(rows: string[][]): boolean {
  const blob = rows.flat().join(' ')
  return (
    /\bname\b/i.test(blob) &&
    /\bdate\b/i.test(blob) &&
    rows.length <= 2 &&
    blob.length < 200
  )
}

/** Single-letter labels like A | B | C used as figure captions, not data. */
export function isTrivialLabelTable(rows: string[][]): boolean {
  const cells = rows.flat().map((cell) => cell.trim()).filter(Boolean)
  if (cells.length === 0 || cells.length > 6) {
    return false
  }
  return cells.every((cell) => /^[A-Za-z]$/.test(cell))
}

/**
 * Pull A/B/C-style panel captions from a layout table that also holds drawings.
 * Prefers a full row of single-letter cells matching the panel count.
 */
export function extractPanelLabelsFromTable(
  rows: string[][],
  panelCount: number,
): string[] | null {
  if (panelCount < 2) {
    return null
  }

  for (const row of rows) {
    const cells = row.map((cell) => cell.trim()).filter(Boolean)
    if (cells.length === panelCount && cells.every((cell) => /^[A-Za-z]$/.test(cell))) {
      return cells.map((cell) => cell.toUpperCase())
    }
  }

  const flat = rows.flat().map((cell) => cell.trim()).filter(Boolean)
  if (flat.length === panelCount && flat.every((cell) => /^[A-Za-z]$/.test(cell))) {
    return flat.map((cell) => cell.toUpperCase())
  }

  return null
}

/** Collect ordered single-letter captions from Word XML between/around panels. */
export function extractTrivialPanelLabelsFromXml(xml: string): string[] {
  const labels: string[] = []
  const textPattern = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi
  for (const match of xml.matchAll(textPattern)) {
    const text = decodeXmlEntities(match[1] ?? '').replaceAll(/\s+/g, ' ').trim()
    if (!text) {
      continue
    }
    if (/^[A-Za-z]$/.test(text)) {
      labels.push(text.toUpperCase())
      continue
    }
    // Stop at the first non-label text so stem copy is not misread as captions.
    break
  }
  return labels
}

export function tableGridLooksLikeData(rows: string[][]): boolean {
  const cells = rows.flat().map((cell) => cell.replaceAll(/\s+/g, ' ').trim()).filter(Boolean)
  if (cells.length === 0) {
    return false
  }
  const blob = cells.join(' ')
  const avgLen = blob.length / cells.length
  // Long narrative cells mentioning "speed"/"mass" are callouts, not data grids.
  if (avgLen >= 40) {
    const shortNumericCells = cells.filter((cell) => /^\d+([.,]\d+)?%?$/.test(cell)).length
    return shortNumericCells >= 2
  }
  const numericCells = cells.filter((cell) => /\d/.test(cell)).length
  return numericCells >= 2 || /\b(grams?|mph|mass|speed|weight)\b/i.test(blob)
}

function shouldRenderTableGrid(rows: string[][]): boolean {
  return (
    docxTableHasContent(rows) &&
    !isNameDateOnlyTable(rows) &&
    !isTrivialLabelTable(rows) &&
    !isProseLayoutTable(rows)
  )
}

function splitTopLevelTables(
  documentXml: string,
): Array<{ type: 'xml' | 'table'; content: string }> {
  const openRe = /<w:tbl\b/gi
  const parts: Array<{ type: 'xml' | 'table'; content: string }> = []
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = openRe.exec(documentXml)) !== null) {
    // Skip tables nested inside an already-captured region by only accepting
    // opens that sit in the remaining unconsumed prefix.
    if (match.index < cursor) {
      continue
    }

    if (match.index > cursor) {
      parts.push({ type: 'xml', content: documentXml.slice(cursor, match.index) })
    }

    const end = findMatchingClose(documentXml, match.index, 'w:tbl')
    if (end < 0) {
      parts.push({ type: 'xml', content: documentXml.slice(match.index) })
      return parts
    }

    parts.push({ type: 'table', content: documentXml.slice(match.index, end) })
    cursor = end
    openRe.lastIndex = end
  }

  if (cursor < documentXml.length) {
    parts.push({ type: 'xml', content: documentXml.slice(cursor) })
  }

  return parts
}

function findMatchingClose(xml: string, start: number, localName: string): number {
  const openRe = new RegExp(`<${localName}\\b`, 'gi')
  const closeRe = new RegExp(`</${localName}\\s*>`, 'gi')
  openRe.lastIndex = start
  const first = openRe.exec(xml)
  if (!first || first.index !== start) {
    return -1
  }

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

async function replaceDrawingsWithMarkers(
  documentXml: string,
  zip: JSZip,
  rels: Map<string, string>,
  indexOffset = 0,
): Promise<{ xml: string; images: ExtractedDocxImage[] }> {
  const candidates = await loadDrawingCandidates(documentXml, zip, rels)
  if (candidates.length === 0) {
    return { xml: documentXml, images: [] }
  }

  const groups = groupAdjacentDrawings(documentXml, candidates)
  const images: ExtractedDocxImage[] = []
  let result = ''
  let lastIndex = 0

  for (const group of groups) {
    const first = group[0]
    const last = group.at(-1)
    if (!last) {
      continue
    }
    result += documentXml.slice(lastIndex, first.start)
    lastIndex = last.end

    const index = indexOffset + images.length + 1
    const betweenXml = documentXml.slice(first.start, last.end)
    const image = await materializeDrawingGroup(group, index, { betweenXml })
    images.push(image)
    result += markerParagraph(index)
  }

  result += documentXml.slice(lastIndex)
  return { xml: result, images }
}

async function loadDrawingCandidates(
  documentXml: string,
  zip: JSZip,
  rels: Map<string, string>,
): Promise<LoadedDrawingCandidate[]> {
  const blockPattern = /<w:drawing[\s\S]*?<\/w:drawing>|<w:pict[\s\S]*?<\/w:pict>/gi
  const candidates: LoadedDrawingCandidate[] = []

  for (const match of documentXml.matchAll(blockPattern)) {
    const drawingXml = match[0]
    const start = match.index ?? 0
    const end = start + drawingXml.length
    const embedId = extractEmbedId(drawingXml)
    if (!embedId) {
      continue
    }

    const loaded = await loadRasterImageBytes(zip, rels, embedId)
    if (!loaded) {
      continue
    }

    const probe: ExtractedDocxImage = {
      index: 0,
      fileName: loaded.fileName,
      mimeType: loaded.mimeType,
      bytes: loaded.bytes,
    }
    if (isDecorativeDrawing(drawingXml, probe)) {
      console.warn(`[digitize] Skipping decorative image ${loaded.fileName}`)
      continue
    }

    candidates.push({
      start,
      end,
      drawingXml,
      image: loaded,
    })
  }

  return candidates
}

/**
 * Group consecutive drawings when there is no meaningful text between them.
 * Single-letter A/B/C captions between panels do not split the group.
 * Exported for unit tests.
 */
export function groupAdjacentDrawings<T extends { start: number; end: number }>(
  documentXml: string,
  candidates: T[],
): T[][] {
  if (candidates.length === 0) {
    return []
  }

  const groups: T[][] = [[candidates[0]]]
  for (let i = 1; i < candidates.length; i += 1) {
    const previous = candidates[i - 1]
    const current = candidates[i]
    const between = documentXml.slice(previous.end, current.start)
    // Keep grouping across empty gaps and A/B/C panel captions.
    if (hasNonLabelMeaningfulText(between)) {
      groups.push([current])
    } else {
      groups.at(-1)?.push(current)
    }
  }
  return groups
}

function hasNonLabelMeaningfulText(xmlBetween: string): boolean {
  const textPattern = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi
  for (const match of xmlBetween.matchAll(textPattern)) {
    const text = decodeXmlEntities(match[1] ?? '').replaceAll(/\s+/g, ' ').trim()
    if (!text) {
      continue
    }
    if (!/^[A-Za-z]$/.test(text)) {
      return true
    }
  }
  return false
}

async function materializeDrawingGroupBytes(
  group: LoadedDrawingCandidate[],
  options?: { labels?: string[]; betweenXml?: string },
): Promise<Buffer> {
  const image = await materializeDrawingGroup(group, 0, options)
  return image.bytes
}

async function materializeDrawingGroup(
  group: LoadedDrawingCandidate[],
  index: number,
  options?: { labels?: string[]; betweenXml?: string },
): Promise<ExtractedDocxImage> {
  if (group.length === 1) {
    const source = group[0].image
    const bytes = await ensureFormFriendlyPng(source.bytes, source.mimeType)
    const pixels = readRasterImageSize(bytes, 'image/png')
    return {
      index,
      fileName: source.fileName.replace(/\.[^.]+$/, '') + '.png',
      mimeType: 'image/png',
      bytes,
      kind: 'figure',
      ...(pixels ? { widthPx: pixels.width, heightPx: pixels.height } : {}),
    }
  }

  const fromXml = options?.betweenXml
    ? extractTrivialPanelLabelsFromXml(options.betweenXml)
    : []
  const labels =
    options?.labels && options.labels.length === group.length
      ? options.labels
      : (fromXml.length === group.length
        ? fromXml
        : undefined)

  const composed = await composeVisualGroupPng(
    group.map((entry, panelIndex) => ({
      bytes: entry.image.bytes,
      mimeType: entry.image.mimeType,
      ...(labels?.[panelIndex] ? { label: labels[panelIndex] } : {}),
    })),
    { labels },
  )
  const pixels = readRasterImageSize(composed, 'image/png')
  return {
    index,
    fileName: `composed-${index}.png`,
    mimeType: 'image/png',
    bytes: composed,
    kind: 'composed',
    panelCount: group.length,
    ...(pixels ? { widthPx: pixels.width, heightPx: pixels.height } : {}),
  }
}

/**
 * Detect title icons / logos from Word drawing size and/or tiny raster bytes.
 * Exported for unit tests.
 */
export function isDecorativeDrawing(drawingXml: string, image: ExtractedDocxImage): boolean {
  const display = readDrawingDisplayInches(drawingXml)
  if (display) {
    const maxEdge = Math.max(display.widthInches, display.heightInches)
    // Trust the on-page box: small = chrome; large enough = keep even if the PNG is tiny.
    return maxEdge > 0 && maxEdge < DECORATIVE_MAX_DISPLAY_INCHES
  }

  if (image.bytes.byteLength <= DECORATIVE_MAX_FILE_BYTES) {
    const pixels = readRasterImageSize(image.bytes, image.mimeType)
    if (
      pixels &&
      pixels.width <= DECORATIVE_MAX_PIXEL_EDGE &&
      pixels.height <= DECORATIVE_MAX_PIXEL_EDGE
    ) {
      return true
    }
  }

  return false
}

export function readDrawingDisplayInches(
  drawingXml: string,
): { widthInches: number; heightInches: number } | null {
  const extent =
    drawingXml.match(/\b(?:wp:)?extent\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/i) ??
    drawingXml.match(/\b(?:wp:)?extent\b[^>]*\bcy="(\d+)"[^>]*\bcx="(\d+)"/i) ??
    drawingXml.match(/\b(?:a:)?ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/i) ??
    drawingXml.match(/\b(?:a:)?ext\b[^>]*\bcy="(\d+)"[^>]*\bcx="(\d+)"/i)

  if (!extent) {
    return null
  }

  // First pattern: cx then cy. Second: cy then cx (swap).
  const cxFirst = /\bcx="\d+"[^>]*\bcy="/i.test(extent[0])
  const first = Number(extent[1])
  const second = Number(extent[2])
  if (!Number.isFinite(first) || !Number.isFinite(second) || first <= 0 || second <= 0) {
    return null
  }

  const cx = cxFirst ? first : second
  const cy = cxFirst ? second : first
  return {
    widthInches: cx / EMU_PER_INCH,
    heightInches: cy / EMU_PER_INCH,
  }
}

function extractEmbedId(block: string): string | null {
  const embed = block.match(/\br:embed="([^"]+)"/i) ?? block.match(/\br:id="([^"]+)"/i)
  return embed?.[1] ?? null
}

async function loadRasterImageBytes(
  zip: JSZip,
  rels: Map<string, string>,
  embedId: string,
): Promise<Omit<ExtractedDocxImage, 'index' | 'kind'> | null> {
  const target = rels.get(embedId)
  if (!target) {
    return null
  }

  let mediaPath: string
  if (target.startsWith('/')) {
    mediaPath = target.slice(1)
  } else if (target.startsWith('word/')) {
    mediaPath = target
  } else {
    mediaPath = `word/${target}`
  }

  const mediaFile = zip.file(mediaPath)
  if (!mediaFile) {
    return null
  }

  const fileName = mediaPath.split('/').pop() ?? 'image'
  const ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : ''
  const mimeType = RASTER_MIME_BY_EXT[ext]
  if (!mimeType) {
    // Skip EMF/WMF/SVG etc. — Forms API only accepts common raster formats.
    return null
  }

  const bytes = Buffer.from(await mediaFile.async('uint8array'))
  return { fileName, mimeType, bytes }
}

function markerParagraph(index: number): string {
  return `<w:p><w:r><w:t>[IMAGE:${index}]</w:t></w:r></w:p>`
}

function xmlToPlainText(xml: string): string {
  // Preserve paragraph breaks from w:p, then strip remaining tags.
  const withBreaks = xml
    .replaceAll(/<\/w:p>/gi, '\n')
    .replaceAll(/<w:tab[^/]*\/>/gi, '\t')
    .replaceAll(/<w:br[^/]*\/>/gi, '\n')

  const withoutTags = withBreaks.replaceAll(/<[^>]+>/g, '')
  const decoded = decodeXmlEntities(withoutTags)

  return decoded
    .split('\n')
    .map((line) => line.replaceAll(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim()
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
}
