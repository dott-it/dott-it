export const EDDO_FORM_MARKER = '(Eddo)'

/**
 * Build the Drive/Forms title for a generated assessment Form.
 * Marker is used for idempotency searches in the lesson folder.
 */
export function eddoFormTitle(assessmentTitle: string): string {
  const trimmed = assessmentTitle.trim()
  if (!trimmed) {
    return `Assessment ${EDDO_FORM_MARKER}`
  }
  if (trimmed.includes(EDDO_FORM_MARKER)) {
    return trimmed
  }
  return `${trimmed} ${EDDO_FORM_MARKER}`
}

/** Normalize titles for idempotent Form matching (hyphen/space variants). */
function normalizeTitleKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[-–—]/g, ' ')
    .replaceAll(/\s+/g, ' ')
}

/**
 * True when a Drive Form name is the Eddo form for this assessment.
 * Requires an exact title match (after hyphen/space normalization) so short
 * titles like "Assessment" do not collide with longer names in the same folder.
 */
export function isEddoFormNameForAssessment(fileName: string, assessmentTitle: string): boolean {
  const name = fileName.trim()
  if (!name.includes(EDDO_FORM_MARKER)) {
    return false
  }
  return normalizeTitleKey(name) === normalizeTitleKey(eddoFormTitle(assessmentTitle))
}
