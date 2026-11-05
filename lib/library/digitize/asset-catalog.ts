import type { ExtractedDocxImage, ExtractedDocxImageKind } from './extract-docx-text'

export interface AssetCatalogEntry {
  index: number
  kind: ExtractedDocxImageKind
  fileName: string
  contextHint?: string
  panelCount?: number
  widthPx?: number
  heightPx?: number
}

/**
 * Build a stable catalog of handout visuals for prompts, Drive naming, and CLI inspect.
 */
export function buildAssetCatalog(images: ExtractedDocxImage[]): AssetCatalogEntry[] {
  return images.map((image) => ({
    index: image.index,
    kind: image.kind ?? 'figure',
    fileName: image.fileName,
    ...(image.contextHint ? { contextHint: image.contextHint } : {}),
    ...(image.panelCount && image.panelCount > 1 ? { panelCount: image.panelCount } : {}),
    ...(image.widthPx ? { widthPx: image.widthPx } : {}),
    ...(image.heightPx ? { heightPx: image.heightPx } : {}),
  }))
}

/** Human-readable catalog block for the LLM extraction prompt. */
export function formatAssetCatalogForPrompt(catalog: AssetCatalogEntry[]): string {
  if (catalog.length === 0) {
    return ''
  }

  const lines = catalog.map((entry) => {
    const parts = [`IMAGE:${entry.index}`, entry.kind]
    if (entry.panelCount && entry.panelCount > 1) {
      parts.push(`(${entry.panelCount} panels)`)
    }
    if (entry.contextHint) {
      parts.push(`context: "${entry.contextHint}"`)
    }
    return `- ${parts.join(' — ')}`
  })

  return `## Asset catalog\n${lines.join('\n')}`
}

/** Slug for Drive file names (lowercase kebab, max 40 chars). */
export function slugifyAssetHint(hint: string | undefined, fallback = 'asset'): string {
  const raw = (hint ?? '').normalize('NFKD').replaceAll(/[\u0300-\u036F]/g, '')
  const slug = raw
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 40)
    .replaceAll(/-+$/g, '')
  return slug.length > 0 ? slug : fallback
}

/** Drive upload name: `03-table-trial-data.png`. */
export function assetUploadFileName(image: ExtractedDocxImage): string {
  const padded = String(image.index).padStart(2, '0')
  const kind = image.kind ?? 'figure'
  const slug = slugifyAssetHint(image.contextHint, kind)
  const ext = image.mimeType === 'image/jpeg' ? 'jpg' : 'png'
  return `${padded}-${kind}-${slug}.${ext}`
}

/**
 * Attach short context hints from lines surrounding each `[IMAGE:N]` marker.
 */
export function enrichImagesWithContextHints(
  documentText: string,
  images: ExtractedDocxImage[],
): ExtractedDocxImage[] {
  const lines = documentText.split('\n')
  const lineByIndex = new Map<number, number>()

  for (const [lineIndex, line] of lines.entries()) {
    const match = line.match(/\[IMAGE:(\d+)\]/)
    if (!match) {
      continue
    }
    const imageIndex = Number(match[1])
    if (Number.isInteger(imageIndex) && !lineByIndex.has(imageIndex)) {
      lineByIndex.set(imageIndex, lineIndex)
    }
  }

  return images.map((image) => {
    if (image.contextHint?.trim()) {
      return image
    }
    const markerLine = lineByIndex.get(image.index)
    if (markerLine === undefined) {
      return image
    }

    const hint = pickNearbyContextLine(lines, markerLine)
    if (!hint) {
      return image
    }
    return { ...image, contextHint: hint }
  })
}

function pickNearbyContextLine(lines: string[], markerLine: number): string | undefined {
  for (let offset = 1; offset <= 3; offset += 1) {
    const before = sanitizeHintLine(lines[markerLine - offset])
    if (before) {
      return before
    }
  }
  for (let offset = 1; offset <= 2; offset += 1) {
    const after = sanitizeHintLine(lines[markerLine + offset])
    if (after) {
      return after
    }
  }
  return undefined
}

function sanitizeHintLine(line: string | undefined): string | undefined {
  if (!line) {
    return undefined
  }
  const cleaned = line
    .replaceAll(/\[IMAGE:\d+\]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim()
  if (cleaned.length < 3) {
    return undefined
  }
  return cleaned.slice(0, 120)
}

/** Pretty-print catalog for CLI --extract-only. */
export function formatAssetCatalogForCli(catalog: AssetCatalogEntry[]): string {
  if (catalog.length === 0) {
    return 'Asset catalog: (none)'
  }
  const lines = catalog.map((entry) => {
    const dims =
      entry.widthPx && entry.heightPx ? ` ${entry.widthPx}x${entry.heightPx}` : ''
    const panels = entry.panelCount && entry.panelCount > 1 ? ` panels=${entry.panelCount}` : ''
    const hint = entry.contextHint ? ` — "${entry.contextHint}"` : ''
    return `  [${entry.index}] ${entry.kind}${panels}${dims} ${entry.fileName}${hint}`
  })
  return `Asset catalog (${catalog.length}):\n${lines.join('\n')}`
}
