#!/usr/bin/env node
/**
 * Rebuild Grade 8 formals (8.2–8.6) from the Drive index.
 * Keeps TE opportunities and existing Google Form URLs (matched by handout stem).
 *
 * Usage:
 *   node --import tsx scripts/ingest/reingest-grade8-from-drive-index.mjs
 *   node --import tsx scripts/ingest/reingest-grade8-from-drive-index.mjs --units=8.2,8.3
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { reingestUnitFromDriveIndex } from '../../lib/library/ingest/reingest-from-drive-index.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '../..')
const ingestedDir = path.join(repoRoot, 'data/ingested')
const driveIndexDir = path.join(ingestedDir, 'drive-index')
const overridesPath = path.join(ingestedDir, 'formal-title-overrides.json')
const unitOverridesPath = path.join(__dirname, 'unit-overrides.json')
const indexScript = path.join(__dirname, 'generate-ingested-index.mjs')

const DEFAULT_UNITS = ['8.2', '8.3', '8.4', '8.5', '8.6']
const unitsArg = process.argv.find((arg) => arg.startsWith('--units='))?.slice('--units='.length)
const unitCodes = unitsArg
  ? unitsArg.split(',').map((code) => code.trim()).filter(Boolean)
  : DEFAULT_UNITS

const titleOverridesRaw = JSON.parse(fs.readFileSync(overridesPath, 'utf8'))
const { _comment: _ignored, ...titleOverrides } = titleOverridesRaw
const unitOverrides = JSON.parse(fs.readFileSync(unitOverridesPath, 'utf8'))

for (const unitCode of unitCodes) {
  const manifestPath = path.join(ingestedDir, `unit-${unitCode}.json`)
  const indexPath = path.join(driveIndexDir, `unit-${unitCode}.json`)
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing ingest manifest ${manifestPath}`)
  }
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing drive index ${indexPath}`)
  }

  const previous = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const driveIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'))

  const next = reingestUnitFromDriveIndex({
    unitCode,
    previous,
    filesByRelativePath: driveIndex.filesByRelativePath ?? {},
    titleOverrides,
    summativeLessons: unitOverrides[unitCode]?.summativeLessons ?? [],
  })

  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`)
  const formal = next.assessments.filter((row) => row.source === 'formal-assessment').length
  const te = next.assessments.filter((row) => row.source === 'te-opportunity').length
  console.log(
    `${unitCode}: ${next.assessments.length} rows (${te} TE, ${formal} formal), ${next.lessonCount} lessons → ${manifestPath}`,
  )
}

execFileSync('node', [indexScript], { stdio: 'inherit' })
