import sharp from 'sharp'
import { readRasterImageSize } from './image-dimensions'

/** Forms API rejects images larger than ~2MB. */
export const FORMS_MAX_IMAGE_BYTES = 2 * 1024 * 1024

/** Max width for Forms-friendly stimulus images (graphs, composed panels). */
export const FORM_IMAGE_MAX_WIDTH_PX = 1600

const PANEL_GAP_PX = 12
const PANEL_BG = { r: 255, g: 255, b: 255, alpha: 1 }
const PANEL_LABEL_HEIGHT_PX = 32
const PANEL_LABEL_FONT_PX = 20

export interface ComposePanel {
  bytes: Buffer
  mimeType: string
  /** Optional caption drawn above the panel (e.g. A / B / C). */
  label?: string
}

export interface ComposeVisualGroupOptions {
  /**
   * Panel labels (A, B, C…). When omitted, multi-panel groups of 2–4 panels
   * default to alphabetical labels so free-body / choice figures stay identifiable.
   */
  labels?: string[]
  /** Set false to skip default A/B/C labels when none were extracted. */
  defaultAlphabeticalLabels?: boolean
}

/**
 * Compose adjacent figure panels into a single horizontal PNG for one Form imageItem.
 * Draws A/B/C (or provided) identifiers above each panel when composing 2+ panels.
 */
export async function composeVisualGroupPng(
  panels: ComposePanel[],
  options?: ComposeVisualGroupOptions,
): Promise<Buffer> {
  if (panels.length === 0) {
    throw new Error('Cannot compose an empty visual group')
  }
  if (panels.length === 1) {
    return ensureFormFriendlyPng(panels[0].bytes, panels[0].mimeType)
  }

  const labels = resolvePanelLabels(panels, options)

  const normalized: Array<{ buffer: Buffer; width: number; height: number; label?: string }> = []
  for (const [i, panel] of panels.entries()) {
    const png = await sharp(panel.bytes).png().toBuffer()
    const meta = await sharp(png).metadata()
    const width = meta.width ?? readRasterImageSize(png, 'image/png')?.width ?? 1
    const height = meta.height ?? readRasterImageSize(png, 'image/png')?.height ?? 1
    normalized.push({
      buffer: png,
      width,
      height,
      label: labels[i] ?? panel.label,
    })
  }

  const maxHeight = Math.max(...normalized.map((panel) => panel.height))
  const scaled = await Promise.all(
    normalized.map(async (panel) => {
      if (panel.height === maxHeight) {
        return panel
      }
      const width = Math.max(1, Math.round((panel.width * maxHeight) / panel.height))
      const buffer = await sharp(panel.buffer).resize(width, maxHeight).png().toBuffer()
      return { ...panel, buffer, width, height: maxHeight }
    }),
  )

  const hasLabels = scaled.some((panel) => Boolean(panel.label?.trim()))
  const labelBand = hasLabels ? PANEL_LABEL_HEIGHT_PX : 0
  const totalWidth =
    scaled.reduce((sum, panel) => sum + panel.width, 0) + PANEL_GAP_PX * (scaled.length - 1)
  const totalHeight = maxHeight + labelBand
  const composites: sharp.OverlayOptions[] = []
  let x = 0
  for (const panel of scaled) {
    if (panel.label?.trim()) {
      const labelPng = await renderPanelLabelPng(panel.label.trim(), panel.width)
      composites.push({ input: labelPng, left: x, top: 0 })
    }
    composites.push({ input: panel.buffer, left: x, top: labelBand })
    x += panel.width + PANEL_GAP_PX
  }

  const composed = await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: PANEL_BG,
    },
  })
    .composite(composites)
    .png()
    .toBuffer()

  return ensureFormFriendlyPng(composed, 'image/png')
}

function resolvePanelLabels(
  panels: ComposePanel[],
  options?: ComposeVisualGroupOptions,
): string[] {
  const fromPanels = panels.map((panel) => panel.label?.trim() ?? '')
  if (fromPanels.every(Boolean)) {
    return fromPanels
  }

  const explicit = options?.labels?.map((label) => label.trim()).filter(Boolean) ?? []
  if (explicit.length === panels.length) {
    return explicit
  }

  const allowDefault = options?.defaultAlphabeticalLabels !== false
  if (allowDefault && panels.length >= 2 && panels.length <= 4) {
    return Array.from({ length: panels.length }, (_, i) => String.fromCodePoint(65 + i))
  }

  return fromPanels
}

async function renderPanelLabelPng(label: string, width: number): Promise<Buffer> {
  const safeWidth = Math.max(24, width)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${PANEL_LABEL_HEIGHT_PX}" viewBox="0 0 ${safeWidth} ${PANEL_LABEL_HEIGHT_PX}">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="50%" y="72%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${PANEL_LABEL_FONT_PX}" font-weight="700" fill="#0f172a">${escapeXml(label)}</text>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/**
 * Convert to PNG and downscale so the payload stays under Forms limits.
 */
export async function ensureFormFriendlyPng(
  bytes: Buffer,
  mimeType: string,
  options?: { maxWidthPx?: number; maxBytes?: number },
): Promise<Buffer> {
  const maxWidth = options?.maxWidthPx ?? FORM_IMAGE_MAX_WIDTH_PX
  const maxBytes = options?.maxBytes ?? FORMS_MAX_IMAGE_BYTES

  let pipeline = sharp(bytes)
  const meta = await pipeline.metadata()
  const width = meta.width ?? 0
  if (width > maxWidth) {
    pipeline = sharp(bytes).resize({
      width: maxWidth,
      withoutEnlargement: true,
    })
  }

  let png = await pipeline.png().toBuffer()
  if (png.byteLength <= maxBytes) {
    return png
  }

  // Progressive width reduction until under the Forms byte cap.
  let nextWidth = Math.min(width > 0 ? width : maxWidth, maxWidth)
  for (let attempt = 0; attempt < 6 && png.byteLength > maxBytes; attempt += 1) {
    nextWidth = Math.max(640, Math.round(nextWidth * 0.75))
    png = await sharp(bytes)
      .resize({ width: nextWidth, withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer()
  }

  if (png.byteLength > maxBytes) {
    throw new Error(
      `Image still exceeds Forms limit after downscale (${png.byteLength} > ${maxBytes} bytes)`,
    )
  }

  return png
}

/** True when XML between two drawings has no meaningful Word text runs. */
export function xmlHasMeaningfulText(xmlBetween: string): boolean {
  const textPattern = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/gi
  for (const match of xmlBetween.matchAll(textPattern)) {
    const text = decodeXmlEntities(match[1] ?? '').replaceAll(/\s+/g, ' ').trim()
    if (text.length > 0) {
      return true
    }
  }
  return false
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
}
