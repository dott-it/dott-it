#!/usr/bin/env node
/**
 * Index OpenSciEd unit materials on Google Drive and match ingest manifest paths to driveFileId.
 *
 * Usage:
 *   node scripts/ingest/index-drive-materials.mjs --unit 8.1
 *   node scripts/ingest/index-drive-materials.mjs --all
 *   node scripts/ingest/index-drive-materials.mjs --unit 8.1 --dry-run
 *
 * Env:
 *   GOOGLE_APPLICATION_CREDENTIALS — service account JSON (default ./google-credentials.json)
 *   OPENSCIED_DRIVE_ROOT_FOLDER_ID — OpenSciEd Curriculum Drive root folder (required)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { google } from 'googleapis'
import { buildUnitDriveIndex } from '../../lib/library/drive-index/match-manifest.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '../..')

dotenv.config({ path: path.join(repoRoot, '.env') })
dotenv.config({ path: path.join(repoRoot, '.env.local'), override: true })
const registryPath = path.join(__dirname, 'unit-registry.json')
const ingestedDir = path.join(repoRoot, 'data/ingested')
const outputDir = path.join(ingestedDir, 'drive-index')

const FOLDER_MIME = 'application/vnd.google-apps.folder'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const unitArg = args.find((arg) => arg.startsWith('--unit='))?.slice('--unit='.length)
const allUnits = args.includes('--all')

if (!unitArg && !allUnits) {
  console.error('Usage: index-drive-materials.mjs --unit 8.1 | --all [--dry-run]')
  process.exit(1)
}

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'))
const unitCodes = allUnits
  ? Object.keys(registry).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  : [unitArg]

const driveRootFolderId = process.env.OPENSCIED_DRIVE_ROOT_FOLDER_ID
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? path.join(repoRoot, 'google-credentials.json')

if (!driveRootFolderId) {
  console.error('Missing OPENSCIED_DRIVE_ROOT_FOLDER_ID in .env or .env.local')
  process.exit(1)
}

if (!fs.existsSync(credentialsPath)) {
  console.error(`Missing Google credentials at ${credentialsPath}`)
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS or place google-credentials.json in the repo root.')
  process.exit(1)
}

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
})

const drive = google.drive({ version: 'v3', auth })

async function listChildren(folderId) {
  const items = []
  let pageToken

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime)',
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageToken,
    })

    items.push(...(response.data.files ?? []))
    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken)

  return items
}

async function findChildFolderByName(parentId, folderName) {
  const children = await listChildren(parentId)
  const match = children.find(
    (item) => item.mimeType === FOLDER_MIME && item.name?.trim() === folderName.trim(),
  )
  return match ?? null
}

async function walkUnitFolder(folderId, relativePrefix = '') {
  const entries = []
  const children = await listChildren(folderId)

  for (const child of children) {
    const name = child.name ?? 'untitled'
    const childRelative = relativePrefix ? `${relativePrefix}/${name}` : name

    if (child.mimeType === FOLDER_MIME) {
      const nested = await walkUnitFolder(child.id, childRelative)
      entries.push(...nested)
      continue
    }

    entries.push({
      driveFileId: child.id,
      name,
      relativePath: childRelative,
      modifiedTime: child.modifiedTime ?? undefined,
      mimeType: child.mimeType ?? undefined,
    })
  }

  return entries
}

function loadManifest(unitCode) {
  const manifestPath = path.join(ingestedDir, `unit-${unitCode}.json`)
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest ${manifestPath}`)
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

async function indexUnit(unitCode) {
  const entry = registry[unitCode]
  if (!entry) {
    throw new Error(`Unknown unit ${unitCode}`)
  }

  const manifest = loadManifest(unitCode)

  console.log(`\n=== ${unitCode} ${entry.unitFolder} ===`)

  const gradeFolder = await findChildFolderByName(driveRootFolderId, entry.gradeFolder)
  if (!gradeFolder?.id) {
    throw new Error(`Grade folder not found: ${entry.gradeFolder}`)
  }

  const unitFolder = await findChildFolderByName(gradeFolder.id, entry.unitFolder)
  if (!unitFolder?.id) {
    throw new Error(`Unit folder not found: ${entry.unitFolder}`)
  }

  console.log(`Drive unit folder: ${unitFolder.name} (${unitFolder.id})`)

  const driveFiles = await walkUnitFolder(unitFolder.id)
  console.log(`Indexed ${driveFiles.length} files under unit folder`)

  const index = buildUnitDriveIndex({
    unitId: unitCode,
    driveRootFolderId,
    gradeFolder: entry.gradeFolder,
    unitFolder: entry.unitFolder,
    unitDriveFolderId: unitFolder.id,
    manifest,
    driveFiles,
  })

  const outPath = path.join(outputDir, `unit-${unitCode}.json`)

  if (dryRun) {
    console.log(`dry-run: would write ${outPath}`)
  } else {
    fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(index, null, 2))
    console.log(`Wrote ${outPath}`)
  }

  console.log(
    `Matched ${index.matchedCount}/${index.manifestPathCount} manifest paths (${index.unmatchedManifestPaths.length} unmatched)`,
  )

  if (index.unmatchedManifestPaths.length > 0) {
    console.log('Unmatched:')
    for (const row of index.unmatchedManifestPaths.slice(0, 10)) {
      console.log(`  - ${row.assessmentId} ${row.field}: ${row.manifestPath}`)
    }
    if (index.unmatchedManifestPaths.length > 10) {
      console.log(`  ... and ${index.unmatchedManifestPaths.length - 10} more`)
    }
  }

  const soccer = index.matches.filter((row) => row.assessmentId === '81-6-soccer-assessment')
  if (soccer.length > 0) {
    console.log('Soccer Assessment matches:')
    for (const row of soccer) {
      console.log(`  - ${row.field}: ${row.driveFileId} (${row.matchKind})`)
    }
  }

  return {
    unitCode,
    status: index.unmatchedManifestPaths.length === 0 ? 'ok' : 'partial',
    matched: index.matchedCount,
    total: index.manifestPathCount,
  }
}

const results = []

for (const unitCode of unitCodes) {
  try {
    results.push(await indexUnit(unitCode))
  } catch (error) {
    console.error(`failed ${unitCode}:`, error.message)
    results.push({ unitCode, status: 'failed', error: error.message })
  }
}

const failed = results.filter((row) => row.status === 'failed')
const partial = results.filter((row) => row.status === 'partial')

console.log('\n=== Drive index summary ===')
for (const row of results) {
  if (row.status === 'failed') {
    console.log(`${row.unitCode}: failed — ${row.error}`)
  } else {
    console.log(`${row.unitCode}: ${row.status} (${row.matched}/${row.total})`)
  }
}

process.exit(failed.length > 0 ? 1 : partial.length > 0 ? 2 : 0)
