/**
 * Narrow public entrypoints for library digitize.
 *
 * Prefer deep imports for extraction, quality post-process, placement, and CLI
 * convert helpers so Next route bundles do not pull Playwright or god-files.
 *
 * - Offline pipeline: `./pipeline`
 * - Playwright convert: `./convert-file-upload-playwright` (CLI only)
 */

export { isDigitizeEligible } from './eligibility'
export { dottFormTitle, DOTT_FORM_MARKER, isDottFormNameForAssessment } from './naming'
export { runDigitizePipeline } from './pipeline'
export {
  persistGoogleFormUrl,
  persistGoogleFormTeacherReadyUrl,
  ingestedManifestPath,
} from './persist-form-url'
export { prepareTeacherReadyFormCopy } from './prepare-teacher-ready-form'
export type { PrepareTeacherReadyFormResult } from './prepare-teacher-ready-form'
export { listDigitizeTargetsForUnit } from './list-targets'
export type { DigitizeBatchTarget } from './list-targets'
export { syncIngestFormUrlsFromDrive } from './sync-ingest-form-urls'
export type { SyncIngestFormUrlResult } from './sync-ingest-form-urls'
export {
  CURRICULUM_FORM_EXAMPLE_NOTICE,
  descriptionWithoutCurriculumNotice,
  FORMS_WORKSPACE_USER,
} from './curriculum-example-notice'
export { FILE_RESPONSE_MARKER, stripFileResponseHint, textHasFileResponseMarker } from './file-response-marker'
export type {
  DigitizeQuestion,
  DigitizeQuestionType,
  DigitizeFormBlock,
  DigitizeTextBlock,
  DigitizeQuestionBlock,
  DigitizeEligibilityResult,
  DigitizeSkipReason,
  DigitizePipelineOptions,
  DigitizeResult,
  DigitizeDryRunPlan,
  DigitizeAssessmentInput,
  DigitizeExtractOnlyResult,
} from './types'
