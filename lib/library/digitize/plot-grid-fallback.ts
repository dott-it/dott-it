import sharp from 'sharp'
import { readRasterImageSize } from './image-dimensions'

/**
 * Heuristic: labeled charts put a title strip across the top margin.
 * Bare grid paper has little dark ink in that band (only faint line ends).
 */
export async function isLikelyUnlabeledCoordinateGrid(
  bytes: Buffer,
  mimeType?: string,
): Promise<boolean> {
  try {
    const { data, info } = await sharp(bytes)
      .rotate()
      .resize({ width: 400, withoutEnlargement: true })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const width = info.width
    const height = info.height
    if (width < 40 || height < 40) {
      return false
    }

    const bandY = Math.max(4, Math.floor(height * 0.12))
    let topInk = 0
    let topSamples = 0
    for (let y = 0; y < bandY; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const value = data[y * width + x] ?? 255
        topSamples += 1
        // Axis/title glyphs are darker than light-gray grid paper.
        if (value < 150) {
          topInk += 1
        }
      }
    }

    if (topSamples === 0) {
      return false
    }

    const topInkRatio = topInk / topSamples
    void mimeType
    // Labeled chart ≈ 0.06 top-ink; bare grid paper ≈ 0.03.
    return topInkRatio < 0.045
  } catch {
    return false
  }
}

/**
 * When a layout pairs a bare coordinate grid with a data table, prefer a labeled
 * plot extracted from another handout in the same unit (passed by the pipeline).
 */
export async function resolvePlotGridFallbackBytes(options: {
  drawingBytes: Buffer
  drawingMimeType: string
  /** Labeled coordinate-plot rasters discovered from sibling unit handouts. */
  labeledCoordinatePlots?: Buffer[]
}): Promise<Buffer | null> {
  const candidates = options.labeledCoordinatePlots?.filter((bytes) => bytes.byteLength > 0) ?? []
  if (candidates.length === 0) {
    return null
  }
  if (!(await isLikelyUnlabeledCoordinateGrid(options.drawingBytes, options.drawingMimeType))) {
    return null
  }

  return pickClosestSizedPlot(options.drawingBytes, candidates)
}

function pickClosestSizedPlot(drawingBytes: Buffer, candidates: Buffer[]): Buffer {
  const target =
    readRasterImageSize(drawingBytes, 'image/jpeg') ??
    readRasterImageSize(drawingBytes, 'image/png')
  if (!target) {
    return candidates[0]
  }

  let best = candidates[0]
  let bestScore = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const size =
      readRasterImageSize(candidate, 'image/jpeg') ?? readRasterImageSize(candidate, 'image/png')
    if (!size) {
      continue
    }
    const score =
      Math.abs(size.width - target.width) + Math.abs(size.height - target.height)
    if (score < bestScore) {
      bestScore = score
      best = candidate
    }
  }
  return best
}
