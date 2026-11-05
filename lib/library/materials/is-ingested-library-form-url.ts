import { listIngestedUnitCodes, loadIngestedManifest } from '@/lib/library/ingest/load-manifest'
import { parseGoogleFormId } from '@/lib/library/workspace/parse-google-form'

/**
 * Module-level allowlist of Forms API formIds present on ingested library assessments.
 * Built once at load so Quick Look embed checks stay O(1).
 */
const INGESTED_LIBRARY_FORM_IDS: ReadonlySet<string> = (() => {
  const ids = new Set<string>()

  for (const unitCode of listIngestedUnitCodes()) {
    const manifest = loadIngestedManifest(unitCode)
    if (!manifest) {
      continue
    }

    for (const assessment of manifest.assessments) {
      const candidates = [
        assessment.files.googleForm,
        assessment.files.googleFormTeacherReady,
      ]
      for (const candidate of candidates) {
        if (!candidate?.trim()) {
          continue
        }
        const formId = parseGoogleFormId(candidate)
        if (formId) {
          ids.add(formId)
        }
      }
    }
  }

  return ids
})()

/**
 * True when the Form URL’s Forms API formId appears on an ingested library assessment.
 * Used to refuse arbitrary formUrl values on the public embed resolver.
 */
export function isIngestedLibraryGoogleFormUrl(formUrl: string): boolean {
  const formId = parseGoogleFormId(formUrl)
  if (!formId) {
    return false
  }
  return INGESTED_LIBRARY_FORM_IDS.has(formId)
}
