import { listIngestedUnitCodes, loadIngestedManifest } from '@/lib/library/ingest/load-manifest'
import type { IngestedAssessment } from '@/lib/library/ingest/types'
import {
  assessmentDetailPath,
  gradeToSlug,
  opportunityDetailPath,
  unitBrowsePath,
} from './paths'
import { buildItemSlug } from './slug'

export interface LibrarySitemapEntry {
  path: string
  lastModified?: Date
}

export function gradeFromUnitCode(unitCode: string): number {
  return Number.parseInt(unitCode.split('.')[0] ?? '', 10)
}

function isTeOpportunity(row: IngestedAssessment): boolean {
  if (row.source) {
    return row.source === 'te-opportunity'
  }
  return row.id.includes('-ao-')
}

/**
 * Build sitemap paths from ingest manifests + slug helpers only.
 * Avoids constructing full unit browse/timeline models.
 */
export function listLibrarySitemapEntries(): LibrarySitemapEntry[] {
  const entries: LibrarySitemapEntry[] = [
    { path: '/library' },
    { path: '/library/openscied' },
    { path: '/library/openscied/middle-school' },
    ...[6, 7, 8].map((grade) => ({
      path: `/library/openscied/middle-school/${gradeToSlug(grade)}`,
    })),
  ]

  for (const unitCode of listIngestedUnitCodes()) {
    const grade = gradeFromUnitCode(unitCode)
    if (!Number.isFinite(grade)) {
      continue
    }

    const manifest = loadIngestedManifest(unitCode)
    if (!manifest) {
      continue
    }

    const lastModified = manifest.ingestedAt ? new Date(manifest.ingestedAt) : undefined
    entries.push({ path: unitBrowsePath(grade, unitCode), lastModified })

    for (const row of manifest.assessments) {
      const title = row.shortTitle ?? row.title
      const slug = buildItemSlug(title, row.id)
      if (isTeOpportunity(row)) {
        entries.push({
          path: opportunityDetailPath(grade, unitCode, slug),
          lastModified,
        })
      } else {
        entries.push({
          path: assessmentDetailPath(grade, unitCode, slug),
          lastModified,
        })
      }
    }
  }

  return entries
}
