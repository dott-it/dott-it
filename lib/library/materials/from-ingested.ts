import type { IngestedAssessment } from '@/lib/library/ingest/types'
import { buildPackageFromFiles, type MaterialAssessmentContext } from './types'

function resolveSource(row: IngestedAssessment): MaterialAssessmentContext['source'] {
  if (row.source) {
    return row.source
  }
  return row.id.includes('-ao-') ? 'te-opportunity' : 'formal-assessment'
}

export function materialContextFromIngested(row: IngestedAssessment): MaterialAssessmentContext {
  const source = resolveSource(row)

  return {
    id: row.id,
    source,
    assessmentType: row.assessmentType,
    isSummative: row.isSummative,
    libraryOutput: row.libraryOutput,
    previewExcerpt: row.previewExcerpt,
    package: buildPackageFromFiles(row.files, row.libraryOutput),
  }
}
