import { parseGoogleFormId } from '@/lib/library/workspace/parse-google-form'
import { getPackageItem } from './helpers'
import type { MaterialAssessmentContext } from './types'

/**
 * Digitized formative/summative assessments with a Forms API formId URL and scoring (key or rubric).
 * Published `/forms/d/e/…` responder links alone are not enough — Workspace attach needs a real formId.
 * Generatable-on-export (handout only) does not count.
 * @see Epic #378 — Add to Workspace
 */
export function isWorkspaceEligible(context: MaterialAssessmentContext): boolean {
  if (context.source !== 'formal-assessment') {
    return false
  }

  const form = getPackageItem(context, 'google-form')
  const answerKey = getPackageItem(context, 'answer-key')
  const rubric = getPackageItem(context, 'rubric')
  const hasFormsApiFormId = Boolean(
    form?.url?.startsWith('http') && parseGoogleFormId(form.url),
  )

  return hasFormsApiFormId && Boolean(answerKey?.available || rubric?.available)
}

/**
 * True when a live Form URL exists but is only a published `/d/e/` responder link
 * (Quick Look/export may work; Add to Workspace will not until ingest has a Forms API formId).
 */
export function hasPublishedFormWithoutWorkspaceFormId(
  context: MaterialAssessmentContext,
): boolean {
  const form = getPackageItem(context, 'google-form')
  if (!form?.url?.startsWith('http')) {
    return false
  }
  return parseGoogleFormId(form.url) == null
}

