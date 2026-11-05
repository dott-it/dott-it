import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { GoogleFormsManager } from '@/lib/forms/manager'
import { findIngestedAssessment } from '@/lib/library/ingest/load-manifest'
import { loadDriveIndex } from '@/lib/library/drive-index/load-drive-index'
import { downloadDriveFileBytes } from '@/lib/library/export/download-drive-file'
import {
  assetUploadFileName,
  buildAssetCatalog,
  formatAssetCatalogForCli,
} from './asset-catalog'
import { isDigitizeEligible } from './eligibility'
import { extractDocxWithImages } from './extract-docx-text'
import {
  blocksToQuestions,
  collectReferencedImageIndexes,
  digitizeFormBlocksToFormItems,
  extractFormBlocksFromText,
} from './extract-questions'
import { formatExtractedBlocks } from './format-questions'
import { loadLabeledCoordinatePlotsFromUnit } from './load-sibling-labeled-plots'
import { eddoFormTitle } from './naming'
import {
  findExistingEddoForm,
  placeFormForLessonFolder,
  trashExistingEddoFormArtifacts,
} from './place-form'
import { resolveLessonFolderId } from './resolve-lesson-folder'
import { uploadFormAssetImages } from './upload-form-assets'
import { googleFormViewUrlFromFormId } from '@/lib/library/workspace/parse-google-form'
import { persistGoogleFormTeacherReadyUrl, persistGoogleFormUrl } from './persist-form-url'
import { prepareTeacherReadyFormCopy } from './prepare-teacher-ready-form'
import { CURRICULUM_FORM_EXAMPLE_NOTICE } from './curriculum-example-notice'
import type {
  DigitizeDryRunPlan,
  DigitizePipelineOptions,
  DigitizeResult,
} from './types'

function resolveHandoutDriveFileId(unitCode: string, assessmentId: string): string {
  const driveIndex = loadDriveIndex(unitCode)
  if (!driveIndex) {
    throw new Error(`Drive index missing for unit ${unitCode}`)
  }

  const match = driveIndex.matches.find(
    (row) => row.assessmentId === assessmentId && row.field === 'studentHandout',
  )
  if (!match?.driveFileId) {
    throw new Error(`No Drive match for studentHandout on assessment ${assessmentId}`)
  }

  return match.driveFileId
}

async function buildPlan(options: DigitizePipelineOptions): Promise<{
  plan: DigitizeDryRunPlan
  assessmentTitle: string
  handoutDriveFileId: string
}> {
  const assessment = findIngestedAssessment(options.unitCode, options.assessmentId)
  if (!assessment) {
    throw new Error(`Assessment not found: ${options.assessmentId} in unit ${options.unitCode}`)
  }

  const eligibility = isDigitizeEligible(assessment, { force: options.force })
  if (!eligibility.eligible && eligibility.reason) {
    return {
      plan: {
        unitCode: options.unitCode,
        assessmentId: options.assessmentId,
        assessmentTitle: assessment.title,
        handoutDriveFileId: '',
        lessonFolderId: '',
        formTitle: eddoFormTitle(assessment.title),
        existingEddoFormId: null,
        wouldSkip: true,
        skipReason: eligibility.reason,
      },
      assessmentTitle: assessment.title,
      handoutDriveFileId: '',
    }
  }

  const handoutDriveFileId = resolveHandoutDriveFileId(options.unitCode, options.assessmentId)
  const lessonFolderId = await resolveLessonFolderId(options.accessToken, handoutDriveFileId)
  const formTitle = eddoFormTitle(assessment.title)
  const existing = await findExistingEddoForm(
    options.accessToken,
    lessonFolderId,
    assessment.title,
  )

  const wouldSkip = Boolean(existing) && !options.force

  return {
    plan: {
      unitCode: options.unitCode,
      assessmentId: options.assessmentId,
      assessmentTitle: assessment.title,
      handoutDriveFileId,
      lessonFolderId,
      formTitle,
      existingEddoFormId: existing?.formId ?? null,
      wouldSkip,
      skipReason: wouldSkip ? 'existing-eddo-form-in-lesson-folder' : undefined,
    },
    assessmentTitle: assessment.title,
    handoutDriveFileId,
  }
}

async function dumpExtractedAssets(
  dumpDir: string,
  images: Awaited<ReturnType<typeof extractDocxWithImages>>['images'],
  catalog: ReturnType<typeof buildAssetCatalog>,
  documentText?: string,
): Promise<void> {
  await mkdir(dumpDir, { recursive: true })
  for (const image of images) {
    const fileName = assetUploadFileName(image)
    await writeFile(path.join(dumpDir, fileName), image.bytes)
  }
  if (documentText !== undefined) {
    await writeFile(path.join(dumpDir, 'document.txt'), documentText, 'utf8')
  }
  await writeFile(
    path.join(dumpDir, 'assets-manifest.json'),
    JSON.stringify({ generatedBy: 'eddo-digitize', assets: catalog }, null, 2),
    'utf8',
  )
  console.log(`Wrote ${images.length} asset file(s) + manifest to ${dumpDir}`)
}

/**
 * Digitize a formal Assessment into a Google Form placed in the lesson Drive folder.
 * Curriculum templates: no student uploads folder; stimulus assets only.
 */
export async function runDigitizePipeline(options: DigitizePipelineOptions): Promise<DigitizeResult> {
  const { plan, assessmentTitle, handoutDriveFileId } = await buildPlan(options)

  if (options.dryRun) {
    return { status: 'dry-run', plan }
  }

  if (plan.wouldSkip && plan.skipReason && !options.extractOnly) {
    return {
      status: 'skipped',
      reason: plan.skipReason,
      existingFormId: plan.existingEddoFormId ?? undefined,
    }
  }

  if (!handoutDriveFileId) {
    throw new Error(`Cannot extract questions: ${plan.skipReason ?? 'missing handout'}`)
  }

  if (options.force && !options.extractOnly) {
    await trashExistingEddoFormArtifacts({
      accessToken: options.accessToken,
      lessonFolderId: plan.lessonFolderId,
      formTitle: plan.formTitle,
      formId: plan.existingEddoFormId,
    })
  }

  const downloaded = await downloadDriveFileBytes(options.accessToken, handoutDriveFileId)
  const labeledCoordinatePlots = await loadLabeledCoordinatePlotsFromUnit({
    accessToken: options.accessToken,
    unitCode: options.unitCode,
    excludeAssessmentId: options.assessmentId,
  })
  const { text: documentText, images } = await extractDocxWithImages(downloaded.bytes, {
    labeledCoordinatePlots,
  })
  const assetCatalog = buildAssetCatalog(images)
  console.log(`\n${formatAssetCatalogForCli(assetCatalog)}\n`)

  const blocks = await extractFormBlocksFromText(assessmentTitle, documentText, {
    imageCount: images.length,
    assetCatalog,
  })
  const questions = blocksToQuestions(blocks)

  console.log(`\n${formatExtractedBlocks(blocks)}\n`)

  if (options.extractOnly) {
    if (options.dumpAssetsDir) {
      await dumpExtractedAssets(options.dumpAssetsDir, images, assetCatalog, documentText)
    }
    return {
      status: 'extract-only',
      assessmentTitle,
      formTitle: plan.formTitle,
      handoutDriveFileId,
      lessonFolderId: plan.lessonFolderId,
      questionCount: questions.length,
      questions,
      blockCount: blocks.length,
      assets: assetCatalog,
    }
  }

  const imageSourceUris = await uploadFormAssetImages({
    accessToken: options.accessToken,
    parentFolderId: plan.lessonFolderId,
    assetsFolderName: `${plan.formTitle} — assets`,
    images,
    referencedIndexes: collectReferencedImageIndexes(blocks),
  })

  // Curriculum library Forms stay paste-a-link examples (preview).
  // A separate My Drive teacher-ready copy gets native File upload below.
  const formItems = digitizeFormBlocksToFormItems(blocks, {
    imageSourceUris,
    fileResponseVariant: 'curriculum-example',
  })

  const manager = new GoogleFormsManager()
  await manager.initializeWithAccessToken(options.accessToken)
  const form = await manager.createFormWithQuestions(
    {
      title: plan.formTitle,
      description: [
        `OpenSciEd ${options.unitCode} — ${assessmentTitle} (generated by Eddo)`,
        CURRICULUM_FORM_EXAMPLE_NOTICE,
      ].join('\n\n'),
    },
    formItems,
  )

  if (!form.formId) {
    throw new Error('Form created but no formId returned')
  }

  await placeFormForLessonFolder(options.accessToken, form.formId, plan.lessonFolderId)

  // Prefer formId-based view URL so Workspace attach can parse a Forms API formId
  // (published /d/e/ responder URLs are not usable with forms.get / responses.list).
  const formUrl = googleFormViewUrlFromFormId(form.formId)
  // Persist per assessmentId so multiple Forms in the same lesson folder stay distinct.
  persistGoogleFormUrl({
    unitCode: options.unitCode,
    assessmentId: options.assessmentId,
    formUrl,
  })

  let teacherReadyFormId: string | undefined
  let teacherReadyFormUrl: string | undefined
  let fileUploadsConverted: number | undefined
  try {
    const ready = await prepareTeacherReadyFormCopy({
      accessToken: options.accessToken,
      sourceFormId: form.formId,
      formTitle: plan.formTitle,
    })
    teacherReadyFormId = ready.formId
    teacherReadyFormUrl = googleFormViewUrlFromFormId(ready.formId)
    fileUploadsConverted = ready.converted
    persistGoogleFormTeacherReadyUrl({
      unitCode: options.unitCode,
      assessmentId: options.assessmentId,
      formUrl: teacherReadyFormUrl,
    })
    console.log(
      `Prepared teacher-ready Form ${ready.formId}` +
        (ready.converted > 0
          ? ` with ${ready.converted} native File upload item(s)`
          : ' (copy only; no file-response items)'),
    )
  } catch (error) {
    console.warn(
      `Teacher-ready File upload prepare skipped: ${(error as Error).message}. ` +
        'Library preview Form was saved; export can still convert from the preview copy.',
    )
  }

  return {
    status: 'created',
    formId: form.formId,
    formUrl,
    formTitle: plan.formTitle,
    lessonFolderId: plan.lessonFolderId,
    questionCount: questions.length,
    questions,
    blockCount: blocks.length,
    teacherReadyFormId,
    teacherReadyFormUrl,
    fileUploadsConverted,
  }
}
