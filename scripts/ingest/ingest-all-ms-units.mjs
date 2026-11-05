#!/usr/bin/env node
/**
 * Batch ingest middle school units from content-pipeline data/1_data_clean (docx source).
 *
 * Usage:
 *   CONTENT_PIPELINE_ROOT=~/Projects/content-pipeline node scripts/ingest/ingest-all-ms-units.mjs
 *   node scripts/ingest/ingest-all-ms-units.mjs --units 8.2,8.3
 *   node scripts/ingest/ingest-all-ms-units.mjs --skip 8.1
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '../..')
const registryPath = path.join(__dirname, 'unit-registry.json')
const outputDir = path.join(repoRoot, 'data/ingested')
const ingestScript = path.join(__dirname, 'ingest-unit-from-data-clean.mjs')
const indexScript = path.join(__dirname, 'generate-ingested-index.mjs')

const contentPipelineRoot =
  process.env.CONTENT_PIPELINE_ROOT ?? path.join(process.env.HOME ?? '', 'Projects/content-pipeline')

const args = process.argv.slice(2)
const unitsArg = args.find((a) => a.startsWith('--units='))?.slice('--units='.length)
const skipArg = args.find((a) => a.startsWith('--skip='))?.slice('--skip='.length)
const dryRun = args.includes('--dry-run')

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
const skipSet = new Set((skipArg ?? '8.1').split(',').map((s) => s.trim()).filter(Boolean))
const unitCodes = unitsArg
  ? unitsArg.split(',').map((s) => s.trim())
  : Object.keys(registry).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

fs.mkdirSync(outputDir, { recursive: true })

const results = []

for (const unitCode of unitCodes) {
  if (skipSet.has(unitCode)) {
    console.log(`skip ${unitCode} (protected)`)
    results.push({ unitCode, status: 'skipped' })
    continue
  }

  const entry = registry[unitCode]
  if (!entry) {
    console.warn(`unknown unit ${unitCode}`)
    results.push({ unitCode, status: 'failed', reason: 'unknown unit' })
    continue
  }

  const unitRoot = path.join(contentPipelineRoot, 'data/1_data_clean', String(entry.grade), unitCode)
  if (!fs.existsSync(unitRoot)) {
    console.warn(`missing ${unitRoot}`)
    results.push({ unitCode, status: 'failed', reason: 'missing folder' })
    continue
  }

  const outPath = path.join(outputDir, `unit-${unitCode}.json`)

  if (dryRun) {
    console.log(`would ingest ${unitCode} ← ${unitRoot}`)
    results.push({ unitCode, status: 'dry-run' })
    continue
  }

  try {
    execFileSync('node', ['--import', 'tsx', ingestScript, unitCode, outPath], {
      stdio: 'inherit',
      env: { ...process.env, CONTENT_PIPELINE_ROOT: contentPipelineRoot },
    })
    const manifest = JSON.parse(fs.readFileSync(outPath, 'utf8'))
    const te = manifest.assessments.filter((a) => a.source === 'te-opportunity').length
    const formal = manifest.assessments.filter((a) => a.source === 'formal-assessment').length
    results.push({
      unitCode,
      status: 'ok',
      lessons: manifest.lessonCount,
      te,
      formal,
      total: manifest.assessments.length,
    })
  } catch (err) {
    console.error(`failed ${unitCode}:`, err.message)
    results.push({ unitCode, status: 'failed', reason: err.message })
  }
}

if (!dryRun) {
  execFileSync('node', [indexScript], { stdio: 'inherit' })
}

const ok = results.filter((r) => r.status === 'ok')
const failed = results.filter((r) => r.status === 'failed')
const skipped = results.filter((r) => r.status === 'skipped')

console.log('\n=== Batch summary ===')
for (const row of ok) {
  console.log(`${row.unitCode}: ${row.total} rows (${row.te} TE, ${row.formal} formal), ${row.lessons} lessons`)
}
console.log(`\n${ok.length} ingested, ${skipped.length} skipped, ${failed.length} failed`)

fs.writeFileSync(
  path.join(outputDir, 'batch-summary.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
)

process.exit(failed.length > 0 ? 1 : 0)
