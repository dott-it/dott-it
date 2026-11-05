#!/usr/bin/env tsx
/**
 * Digitize OpenSciEd formal Assessment(s) into Google Forms in lesson Drive folders.
 *
 * Usage:
 *   pnpm digitize:form -- --assessment 81-10-baseball-assessment-1 --dry-run
 *   pnpm digitize:form -- --assessment 81-10-baseball-assessment-1 --force
 *   pnpm digitize:form -- --assessment 81-10-baseball-assessment-1 --extract-only --dump-assets ./tmp/assets
 *   pnpm digitize:form -- --unit 8.1
 *   pnpm digitize:form -- --unit 8.1 --lesson-folder <id> --force
 *   pnpm digitize:form -- --unit 8.1 --sync-ingest
 *   pnpm digitize:form -- --unit 8.1 --lesson-folder <id> --sync-ingest
 *   pnpm digitize:form -- --forms-ui-login
 *   pnpm digitize:form -- --convert-file-uploads --assessment <id> [--headed]
 *     → copies preview Form, converts File upload, writes googleFormTeacherReady (preview untouched)
 *   pnpm digitize:form -- --unit 8.1 --convert-file-uploads [--force] [--headed]
 *     → same for every assessment with googleForm (skips distinct teacher-ready unless --force)
 *
 * Env:
 *   GOOGLE_APPLICATION_CREDENTIALS — service account JSON
 *   GOOGLE_FORMS_IMPERSONATE_USER — Workspace user to impersonate (required to create Forms)
 *   GOOGLE_FORMS_UI_EMAIL / GOOGLE_FORMS_UI_PASSWORD — optional for --forms-ui-login
 *   OPENAI_API_KEY — required for extraction / Form create (not needed for --dry-run)
 */
import 'dotenv/config'
import { GoogleAuth } from '../lib/forms/auth'
import { listIngestedUnitCodes, findIngestedAssessment, loadIngestedManifest } from '../lib/library/ingest/load-manifest'
import { listDigitizeTargetsForUnit } from '../lib/library/digitize/list-targets'
import { loginFormsUiSession } from '../lib/library/digitize/convert-file-upload-playwright'
import { runDigitizePipeline } from '../lib/library/digitize/pipeline'
import { syncIngestFormUrlsFromDrive } from '../lib/library/digitize/sync-ingest-form-urls'
import type { DigitizeResult } from '../lib/library/digitize/types'
import { persistGoogleFormTeacherReadyUrl } from '../lib/library/digitize/persist-form-url'
import { prepareTeacherReadyFormCopy } from '../lib/library/digitize/prepare-teacher-ready-form'
import { dottFormTitle } from '../lib/library/digitize/naming'
import {
  distinctTeacherReadyFormId,
  googleFormViewUrlFromFormId,
  parseGoogleFormId,
} from '../lib/library/workspace/parse-google-form'

function readFlagValue(argv: string[], flag: string): string | undefined {
  const equals = argv.find((arg) => arg.startsWith(`${flag}=`))
  if (equals) {
    return equals.slice(flag.length + 1)
  }

  const index = argv.indexOf(flag)
  if (index === -1) {
    return undefined
  }

  return argv[index + 1]
}

function parseArgs(argv: string[]) {
  const cleaned = argv.filter((arg) => arg !== '--')

  return {
    assessmentId: readFlagValue(cleaned, '--assessment'),
    unitCode: readFlagValue(cleaned, '--unit'),
    lessonFolderId: readFlagValue(cleaned, '--lesson-folder'),
    dumpAssetsDir: readFlagValue(cleaned, '--dump-assets'),
    dryRun: cleaned.includes('--dry-run'),
    extractOnly: cleaned.includes('--extract-only'),
    force: cleaned.includes('--force'),
    syncIngest: cleaned.includes('--sync-ingest'),
    convertFileUploads: cleaned.includes('--convert-file-uploads'),
    formsUiLogin: cleaned.includes('--forms-ui-login'),
    headed: cleaned.includes('--headed'),
    formId: readFlagValue(cleaned, '--form'),
  }
}

function resolveIngestedFormId(assessmentId?: string, unitHint?: string): string {
  if (!assessmentId) {
    throw new Error('--convert-file-uploads requires --form <id> or --assessment <id>')
  }
  const unitCode = resolveUnitCode(assessmentId, unitHint)
  const assessment = findIngestedAssessment(unitCode, assessmentId)
  const formUrl = assessment?.files.googleForm?.trim()
  const formId = formUrl ? parseGoogleFormId(formUrl) : null
  if (!formId) {
    throw new Error(
      `No Forms API formId on ingest googleForm for ${assessmentId}. Digitize the assessment first.`,
    )
  }
  return formId
}

function resolveUnitCode(assessmentId: string, unitHint?: string): string {
  if (unitHint) {
    if (!findIngestedAssessment(unitHint, assessmentId)) {
      throw new Error(`Assessment ${assessmentId} not found in unit ${unitHint}`)
    }
    return unitHint
  }

  for (const code of listIngestedUnitCodes()) {
    if (findIngestedAssessment(code, assessmentId)) {
      return code
    }
  }

  throw new Error(`Assessment not found in any ingested unit: ${assessmentId}`)
}

function printResult(assessmentId: string, result: DigitizeResult) {
  if (result.status === 'extract-only') {
    const { questions: _questions, ...summary } = result
    console.log(JSON.stringify({ assessmentId, ...summary }, null, 2))
    return
  }
  if (result.status === 'created') {
    const { questions: _questions, ...summary } = result
    console.log(JSON.stringify({ assessmentId, ...summary }, null, 2))
    return
  }
  console.log(JSON.stringify({ assessmentId, ...result }, null, 2))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.assessmentId && !args.unitCode && !args.formId && !args.formsUiLogin) {
    console.error(`Usage:
  pnpm digitize:form -- --assessment <id> [--unit 8.1] [--dry-run] [--extract-only] [--dump-assets <dir>] [--force]
  pnpm digitize:form -- --unit 8.1 [--lesson-folder <driveFolderId>] [--force]
  pnpm digitize:form -- --unit 8.1 [--lesson-folder <id>] --sync-ingest
  pnpm digitize:form -- --forms-ui-login
  pnpm digitize:form -- --convert-file-uploads --form <formId> [--headed]
  pnpm digitize:form -- --convert-file-uploads --assessment <id> [--headed]
  pnpm digitize:form -- --unit 8.1 --convert-file-uploads [--force] [--headed]

Examples:
  pnpm digitize:form -- --assessment 81-10-baseball-assessment-1 --dry-run
  pnpm digitize:form -- --assessment 81-10-baseball-assessment-1 --extract-only --dump-assets ./tmp/baseball-assets
  pnpm digitize:form -- --unit 8.1 --lesson-folder 1U4oGtUUwQMDLm9pfChRMXYjvvZvlCMBw --force
  pnpm digitize:form -- --unit 8.1 --sync-ingest
  pnpm digitize:form -- --forms-ui-login
  pnpm digitize:form -- --convert-file-uploads --assessment 81-6-soccer-assessment --headed
  pnpm digitize:form -- --unit 8.1 --convert-file-uploads`)
    process.exit(1)
  }

  if (args.dumpAssetsDir && !args.extractOnly) {
    console.error('--dump-assets requires --extract-only')
    process.exit(1)
  }

  if (args.formsUiLogin) {
    const statePath = await loginFormsUiSession()
    console.log(`Saved Forms UI session to ${statePath}`)
    return
  }

  const auth = new GoogleAuth()
  const skipImpersonation = args.dryRun || args.extractOnly
  await auth.authenticate(skipImpersonation ? { subject: null } : undefined)
  const accessToken = await auth.getAccessToken()

  if (args.convertFileUploads) {
    if (args.unitCode && !args.assessmentId) {
      const manifest = loadIngestedManifest(args.unitCode)
      if (!manifest) {
        throw new Error(`No ingest manifest for unit ${args.unitCode}`)
      }
      const targets = manifest.assessments.filter((row) => {
        if (!row.files.googleForm?.trim()) {
          return false
        }
        if (
          distinctTeacherReadyFormId(row.files.googleFormTeacherReady, row.files.googleForm) &&
          !args.force
        ) {
          return false
        }
        return true
      })
      console.log(
        `Preparing teacher-ready Forms for ${targets.length} assessment(s) in unit ${args.unitCode}` +
          (args.force ? ' [--force]' : ' (skipping those with a distinct googleFormTeacherReady)') +
          '...',
      )
      const summary: Array<{
        assessmentId: string
        status: 'ok' | 'error' | 'skipped'
        formId?: string
        converted?: number
        detail?: string
      }> = []
      for (const row of targets) {
        const previewId = parseGoogleFormId(row.files.googleForm!.trim())
        if (!previewId) {
          summary.push({
            assessmentId: row.id,
            status: 'error',
            detail: 'Could not parse googleForm URL',
          })
          continue
        }
        console.log(`\n--- ${row.id} (${row.title}) ---`)
        try {
          const ready = await prepareTeacherReadyFormCopy({
            accessToken,
            sourceFormId: previewId,
            formTitle: dottFormTitle(row.title),
            headed: args.headed,
          })
          persistGoogleFormTeacherReadyUrl({
            unitCode: args.unitCode,
            assessmentId: row.id,
            formUrl: googleFormViewUrlFromFormId(ready.formId),
          })
          summary.push({
            assessmentId: row.id,
            status: 'ok',
            formId: ready.formId,
            converted: ready.converted,
          })
          console.log(
            `Updated googleFormTeacherReady → ${ready.formId}` +
              (ready.converted > 0
                ? ` (${ready.converted} File upload item(s))`
                : ' (copy only)'),
          )
        } catch (error) {
          summary.push({
            assessmentId: row.id,
            status: 'error',
            detail: (error as Error).message,
          })
          console.error(`Failed: ${(error as Error).message}`)
        }
      }
      console.log('\nSummary:')
      console.log(JSON.stringify(summary, null, 2))
      if (summary.some((row) => row.status === 'error')) {
        process.exitCode = 1
      }
      return
    }

    if (!args.assessmentId) {
      throw new Error(
        '--convert-file-uploads requires --assessment <id> or --unit <code> (updates googleFormTeacherReady)',
      )
    }
    const unitCode = resolveUnitCode(args.assessmentId, args.unitCode)
    const formId = args.formId ?? resolveIngestedFormId(args.assessmentId, args.unitCode)
    console.log(
      `Preparing teacher-ready File upload Form from preview ${formId} (assessment ${args.assessmentId})...`,
    )
    const ready = await prepareTeacherReadyFormCopy({
      accessToken,
      sourceFormId: formId,
      formTitle: dottFormTitle(
        findIngestedAssessment(unitCode, args.assessmentId)?.title ?? args.assessmentId,
      ),
      headed: args.headed,
    })
    persistGoogleFormTeacherReadyUrl({
      unitCode,
      assessmentId: args.assessmentId,
      formUrl: googleFormViewUrlFromFormId(ready.formId),
    })
    console.log(
      `Updated ingest googleFormTeacherReady → ${ready.formId}` +
        (ready.converted > 0
          ? ` (${ready.converted} File upload item(s))`
          : ' (copy only; no file-response items)'),
    )
    console.log(JSON.stringify(ready, null, 2))
    return
  }

  if (args.syncIngest) {
    const unitCode = args.unitCode ?? (args.assessmentId ? resolveUnitCode(args.assessmentId) : undefined)
    if (!unitCode) {
      throw new Error('--sync-ingest requires --unit (or --assessment to resolve the unit)')
    }
    console.log(
      `Syncing ingest googleForm URLs for unit ${unitCode}` +
        (args.lessonFolderId ? ` (lesson folder ${args.lessonFolderId})` : '') +
        '...',
    )
    const results = await syncIngestFormUrlsFromDrive({
      accessToken,
      unitCode,
      lessonFolderId: args.lessonFolderId,
    })
    console.log(JSON.stringify(results, null, 2))
    return
  }
  if (args.assessmentId) {
    const unitCode = resolveUnitCode(args.assessmentId, args.unitCode)
    let modeLabel = ''
    if (args.dryRun) {
      modeLabel = ' [dry-run]'
    } else if (args.extractOnly) {
      modeLabel = ' [extract-only]'
    }
    console.log(`Digitizing ${args.assessmentId} (unit ${unitCode})${modeLabel}...`)
    const result = await runDigitizePipeline({
      unitCode,
      assessmentId: args.assessmentId,
      accessToken,
      dryRun: args.dryRun,
      extractOnly: args.extractOnly,
      dumpAssetsDir: args.dumpAssetsDir,
      force: args.force,
    })
    printResult(args.assessmentId, result)
    return
  }

  const unitCode = args.unitCode!
  const targets = await listDigitizeTargetsForUnit({
    accessToken,
    unitCode,
    force: args.force,
    lessonFolderId: args.lessonFolderId,
  })

  console.log(
    `Digitizing ${targets.length} assessment(s) in unit ${unitCode}` +
      (args.lessonFolderId ? ` (lesson folder ${args.lessonFolderId})` : '') +
      (args.force ? ' [--force]' : '') +
      '...',
  )

  const summary: Array<{ assessmentId: string; status: string; detail?: string }> = []

  for (const target of targets) {
    console.log(`\n--- ${target.assessmentId} (${target.assessmentTitle}) ---`)
    try {
      const result = await runDigitizePipeline({
        unitCode: target.unitCode,
        assessmentId: target.assessmentId,
        accessToken,
        dryRun: args.dryRun,
        extractOnly: args.extractOnly,
        dumpAssetsDir: args.dumpAssetsDir
          ? `${args.dumpAssetsDir.replace(/\/$/, '')}/${target.assessmentId}`
          : undefined,
        force: args.force,
      })
      printResult(target.assessmentId, result)
      let detail: string | undefined
      if (result.status === 'created') {
        detail = result.formUrl
      } else if (result.status === 'skipped') {
        detail = result.reason
      }
      summary.push({
        assessmentId: target.assessmentId,
        status: result.status,
        detail,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('❌', message)
      summary.push({ assessmentId: target.assessmentId, status: 'failed', detail: message })
    }
  }

  console.log('\n=== Batch summary ===')
  console.log(JSON.stringify(summary, null, 2))
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((error: unknown) => {
  console.error('❌', error instanceof Error ? error.message : error)
  process.exit(1)
})
