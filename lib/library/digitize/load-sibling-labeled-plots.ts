import JSZip from 'jszip'
import { loadDriveIndex } from '@/lib/library/drive-index/load-drive-index'
import { downloadDriveFileBytes } from '@/lib/library/export/download-drive-file'
import { findIngestedAssessment } from '@/lib/library/ingest/load-manifest'
import { isLikelyUnlabeledCoordinateGrid } from './plot-grid-fallback'
import { readRasterImageSize } from './image-dimensions'

const RASTER_EXT = /\.(png|jpe?g|gif|webp)$/i

/**
 * Scan other student handouts in the same unit for labeled coordinate-plot
 * rasters. Used when the current handout embeds a bare grid beside a data table.
 */
export async function loadLabeledCoordinatePlotsFromUnit(options: {
  accessToken: string
  unitCode: string
  excludeAssessmentId?: string
  /** Cap downloads so digitize stays snappy. */
  maxHandouts?: number
}): Promise<Buffer[]> {
  const driveIndex = loadDriveIndex(options.unitCode)
  if (!driveIndex) {
    return []
  }

  const maxHandouts = options.maxHandouts ?? 6
  const handoutMatches = driveIndex.matches.filter(
    (row) =>
      row.field === 'studentHandout' &&
      Boolean(row.driveFileId) &&
      row.assessmentId !== options.excludeAssessmentId,
  )

  const labeled: Buffer[] = []
  let scanned = 0

  for (const match of handoutMatches) {
    if (scanned >= maxHandouts || labeled.length >= 4) {
      break
    }
    // Prefer formal assessments that exist in the unit manifest.
    if (!findIngestedAssessment(options.unitCode, match.assessmentId)) {
      continue
    }
    scanned += 1
    try {
      const downloaded = await downloadDriveFileBytes(options.accessToken, match.driveFileId)
      const fromHandout = await extractLabeledCoordinatePlotsFromDocx(downloaded.bytes)
      labeled.push(...fromHandout)
    } catch (error) {
      console.warn(
        `[digitize] Could not scan sibling handout ${match.assessmentId} for labeled plots: ${
          (error as Error).message
        }`,
      )
    }
  }

  return labeled
}

/** Pull large, titled coordinate-plot images from a .docx media folder. */
export async function extractLabeledCoordinatePlotsFromDocx(
  bytes: ArrayBuffer | Uint8Array | Buffer,
): Promise<Buffer[]> {
  const zip = await JSZip.loadAsync(bytes)
  const out: Buffer[] = []

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir || !path.startsWith('word/media/') || !RASTER_EXT.test(path)) {
      continue
    }
    const media = await file.async('nodebuffer')
    const size =
      readRasterImageSize(media, 'image/jpeg') ?? readRasterImageSize(media, 'image/png')
    if (!size) {
      continue
    }
    // Coordinate plots in these handouts are large near-square rasters.
    const minEdge = Math.min(size.width, size.height)
    const maxEdge = Math.max(size.width, size.height)
    if (minEdge < 400 || maxEdge / minEdge > 1.4) {
      continue
    }
    if (await isLikelyUnlabeledCoordinateGrid(media)) {
      continue
    }
    out.push(media)
  }

  return out
}
