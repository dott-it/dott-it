#!/usr/bin/env node
/**
 * Compare content-pipeline POC manifest vs opensci-assess-hub gold standard.
 * Usage: node scripts/ingest/compare-manifests.mjs <pipeline.json> <gold.json> [report.md]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pipelinePath = process.argv[2]
const goldPath = process.argv[3]
const reportPath = process.argv[4] ?? path.join(__dirname, '../../docs/POC-UNIT-81-GAP-REPORT.md')

if (!pipelinePath || !goldPath) {
  console.error('Usage: compare-manifests.mjs <pipeline.json> <gold.json> [report.md]')
  process.exit(1)
}

const pipeline = JSON.parse(fs.readFileSync(pipelinePath, 'utf8'))
const gold = JSON.parse(fs.readFileSync(goldPath, 'utf8'))

function bySource(assessments, source) {
  return assessments.filter((row) => row.source === source)
}

function byLesson(rows) {
  const map = new Map()
  for (const row of rows) {
    const key = row.lessonNum
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  return map
}

function fieldCoverage(rows, field) {
  const filled = rows.filter((row) => {
    const value = row[field]
    return value != null && String(value).trim() !== ''
  })
  return { filled: filled.length, total: rows.length }
}

function ids(rows) {
  return new Set(rows.map((row) => row.id))
}

const pipelineTe = bySource(pipeline.assessments, 'te-opportunity')
const goldTe = bySource(gold.assessments, 'te-opportunity')
const pipelineFormal = bySource(pipeline.assessments, 'formal-assessment')
const goldFormal = bySource(gold.assessments, 'formal-assessment')

const goldTeIds = ids(goldTe)
const pipelineTeIds = ids(pipelineTe)
const missingInPipeline = [...goldTeIds].filter((id) => !pipelineTeIds.has(id))
const extraInPipeline = [...pipelineTeIds].filter((id) => !goldTeIds.has(id))

const fields = ['buildingTowards', 'lookListenFor', 'whatToDo', 'peCode', 'shortTitle']
const coverage = Object.fromEntries(
  fields.map((field) => [field, fieldCoverage(pipelineTe, field)]),
)
const goldCoverage = Object.fromEntries(
  fields.map((field) => [field, fieldCoverage(goldTe, field)]),
)

const lessonRows = []
const allLessons = new Set([
  ...pipelineTe.map((r) => r.lessonNum),
  ...goldTe.map((r) => r.lessonNum),
])
for (const lessonNum of [...allLessons].sort((a, b) => a - b)) {
  const pCount = pipelineTe.filter((r) => r.lessonNum === lessonNum).length
  const gCount = goldTe.filter((r) => r.lessonNum === lessonNum).length
  lessonRows.push({ lessonNum, pipeline: pCount, gold: gCount, delta: pCount - gCount })
}

const lines = []
lines.push('# POC Unit 8.1 — Gap Report (content-pipeline vs opensci-assess-hub)')
lines.push('')
lines.push(`Generated: ${new Date().toISOString()}`)
lines.push('')
lines.push('## Sources')
lines.push('')
lines.push(`- **Pipeline POC:** \`${pipelinePath}\``)
lines.push(`- **Gold standard:** \`${goldPath}\` (Jess prototype)`)
lines.push(`- **content-pipeline path:** \`${pipeline.ingestedFrom}\``)
lines.push('')
lines.push('## Executive summary')
lines.push('')
lines.push('| Metric | Pipeline POC | Gold (Jess) | Delta |')
lines.push('|--------|-------------|-------------|-------|')
lines.push(`| Total library rows | ${pipeline.assessments.length} | ${gold.assessments.length} | ${pipeline.assessments.length - gold.assessments.length} |`)
lines.push(`| TE opportunities | ${pipelineTe.length} | ${goldTe.length} | ${pipelineTe.length - goldTe.length} |`)
lines.push(`| Formal assessments | ${pipelineFormal.length} | ${goldFormal.length} | ${pipelineFormal.length - goldFormal.length} |`)
lines.push(`| Lessons | ${pipeline.lessonCount ?? pipeline.lessons?.length ?? '?'} | ${gold.lessonCount ?? gold.lessons?.length ?? '?'} | — |`)
lines.push('')
lines.push('## Key finding: raw `.docx` not in git')
lines.push('')
lines.push(
  'The `content-pipeline` repo stores **processed JSON only** under `raw/` (folder metadata). ' +
    'Original `.docx` binaries are not versioned. Jess\'s ingest scripts expect local `.docx` files. ' +
    'This POC uses a **regex adapter** on `page_content`, which differs from paragraph-based `.docx` parsing.',
)
lines.push('')
lines.push('## TE opportunities by lesson')
lines.push('')
lines.push('| Lesson | Pipeline | Gold | Delta |')
lines.push('|--------|----------|------|-------|')
for (const row of lessonRows) {
  const flag = row.delta !== 0 ? ' ⚠️' : ''
  lines.push(`| ${row.lessonNum} | ${row.pipeline} | ${row.gold} | ${row.delta >= 0 ? '+' : ''}${row.delta}${flag} |`)
}
lines.push('')
lines.push('## Field coverage (TE opportunities)')
lines.push('')
lines.push('| Field | Pipeline filled | Gold filled |')
lines.push('|-------|-----------------|-------------|')
for (const field of fields) {
  lines.push(
    `| \`${field}\` | ${coverage[field].filled}/${coverage[field].total} | ${goldCoverage[field].filled}/${goldCoverage[field].total} |`,
  )
}
lines.push('')
lines.push('## ID mismatches (TE opportunities)')
lines.push('')
lines.push(`- **Missing in pipeline (${missingInPipeline.length}):** ${missingInPipeline.slice(0, 20).join(', ') || 'none'}${missingInPipeline.length > 20 ? '…' : ''}`)
lines.push(`- **Extra in pipeline (${extraInPipeline.length}):** ${extraInPipeline.slice(0, 20).join(', ') || 'none'}${extraInPipeline.length > 20 ? '…' : ''}`)
lines.push('')
lines.push('## Formal assessments')
lines.push('')
const goldFormalTitles = goldFormal.map((r) => `${r.lessonNum}: ${r.title}`).sort()
const pipelineFormalTitles = pipelineFormal.map((r) => `${r.lessonNum}: ${r.title}`).sort()
lines.push('**Gold:**')
for (const t of goldFormalTitles) lines.push(`- ${t}`)
lines.push('')
lines.push('**Pipeline:**')
for (const t of pipelineFormalTitles) lines.push(`- ${t}`)
lines.push('')
lines.push('## Gaps & recommendations')
lines.push('')
lines.push('1. **Obtain raw `.docx`** from Google Drive sync or export pipeline — required for verbatim Jess parser.')
lines.push('2. **Improve `page_content` adapter** — processed text merges paragraphs; `ASSESSMENT OPPORTUNITY` often appears inline.')
lines.push('3. **Port Jess scripts** (`ingest-unit.mjs`, `extract-te-assessment-opportunities.py`) into `dott-it-workspace/scripts/ingest/`.')
lines.push('4. **Adopt `IngestedUnitManifest` schema** from `opensci-assess-hub/src/lib/ingest-manifest.ts`.')
lines.push('5. **Batch all 18 MS units** after 8.1 QC passes.')
lines.push('6. **Learning Commons** as tertiary source for gaps only.')
lines.push('')
lines.push('## Next steps for card 375')
lines.push('')
lines.push('- [ ] Share this report with @aw and @Jess on Slack')
lines.push('- [ ] Confirm whether content-pipeline `raw/` docx can be published or fetched from Drive')
lines.push('- [ ] Lock canonical schema in `lib/library/ingest/types.ts`')
lines.push('- [ ] Wire `load-unit-browse.ts` to ingested manifests')
lines.push('')

fs.mkdirSync(path.dirname(reportPath), { recursive: true })
fs.writeFileSync(reportPath, lines.join('\n'))

console.log('Comparison complete')
console.log(`  TE opportunities: pipeline=${pipelineTe.length} gold=${goldTe.length}`)
console.log(`  Formal: pipeline=${pipelineFormal.length} gold=${goldFormal.length}`)
console.log(`  Missing IDs: ${missingInPipeline.length}`)
console.log(`  Report → ${reportPath}`)
