import assert from 'node:assert/strict'
import { test } from 'node:test'
import { loadIngestedManifest } from '../lib/library/ingest/load-manifest.ts'
import {
  buildDrivePathIndex,
  buildUnitDriveIndex,
  collectManifestFileRefs,
  matchManifestPathToDrive,
} from '../lib/library/drive-index/index.ts'
import type { DriveFileEntry } from '../lib/library/drive-index/types.ts'

const soccerDriveFiles: DriveFileEntry[] = [
  {
    driveFileId: 'handout-id',
    name: '8.1 Lesson 6 Assessment Soccer Assessment',
    relativePath:
      'Lesson 6 - 8.1 Contact Forces/8.1 Lesson 6 Assessment Soccer Assessment',
  },
  {
    driveFileId: 'key-id',
    name: '8.1 Lesson 6 Answer Key Soccer Assessment Key',
    relativePath:
      'Lesson 6 - 8.1 Contact Forces/8.1 Lesson 6 Answer Key Soccer Assessment Key',
  },
  {
    driveFileId: 'teacher-id',
    name: '8.1 Lesson 6 Teacher Edition',
    relativePath: 'Lesson 6 - 8.1 Contact Forces/8.1 Lesson 6 Teacher Edition',
  },
]

test('should match Drive paths when manifest uses .docx but Drive omits extension', () => {
  const driveFiles: DriveFileEntry[] = [
    {
      driveFileId: 'soccer-handout',
      name: '8.1 Lesson 6 Assessment Soccer Assessment',
      relativePath:
        'Lesson 6 - 8.1 Contact Forces/8.1 Lesson 6 Assessment Soccer Assessment',
    },
  ]

  const index = buildDrivePathIndex(driveFiles)
  const manifestPath =
    'Lesson 6 - 8.1 Contact Forces/8.1 Lesson 6 Assessment Soccer Assessment.docx'

  const match = matchManifestPathToDrive(manifestPath, index)
  assert.ok(match)
  assert.equal(match.matchKind, 'stem')
  assert.equal(match.entry.driveFileId, 'soccer-handout')
})

test('should match Soccer handout via stem when manifest includes .docx', () => {
  const index = buildDrivePathIndex(soccerDriveFiles)
  const manifestPath =
    'Lesson 6 - 8.1 Contact Forces/8.1 Lesson 6 Assessment Soccer Assessment.docx'

  const match = matchManifestPathToDrive(manifestPath, index)
  assert.ok(match)
  assert.equal(match.matchKind, 'stem')
  assert.equal(match.entry.driveFileId, 'handout-id')
})

test('should match content-pipeline lesson paths by lesson basename', () => {
  const pipelineFiles: DriveFileEntry[] = [
    {
      driveFileId: 'pipeline-handout',
      name: '7.1 Lesson 1 Handout Initial Model-based Explanation.docx',
      relativePath:
        'Lesson 1 - 7.1 Chemical Reactions & Matter/7.1 Lesson 1 Handout Initial Model-based Explanation.docx',
    },
  ]

  const index = buildDrivePathIndex(pipelineFiles)
  const manifestPath = 'lesson_1/original/7.1 Lesson 1 Handout Initial Model-based Explanation.docx'

  const match = matchManifestPathToDrive(manifestPath, index)
  assert.ok(match)
  assert.equal(match.matchKind, 'lesson-basename')
  assert.equal(match.entry.driveFileId, 'pipeline-handout')
})

test('should build unit drive index for Soccer Assessment from manifest and drive files', () => {
  const manifest = loadIngestedManifest('8.1')
  assert.ok(manifest)

  const index = buildUnitDriveIndex({
    unitId: '8.1',
    driveRootFolderId: 'root-folder',
    gradeFolder: 'Grade 8',
    unitFolder: '8.1 Contact Forces',
    unitDriveFolderId: 'unit-folder',
    manifest,
    driveFiles: soccerDriveFiles,
  })

  const soccerMatches = index.matches.filter((row) => row.assessmentId === '81-6-soccer-assessment')
  assert.equal(soccerMatches.length, 3)

  const handout = soccerMatches.find((row) => row.field === 'studentHandout')
  const answerKey = soccerMatches.find((row) => row.field === 'answerKey')
  const teacherGuide = soccerMatches.find((row) => row.field === 'teacherGuide')

  assert.ok(handout)
  assert.equal(handout.driveFileId, 'handout-id')
  assert.ok(answerKey)
  assert.equal(answerKey.driveFileId, 'key-id')
  assert.ok(teacherGuide)
  assert.equal(teacherGuide.driveFileId, 'teacher-id')
})

test('should collect local manifest file refs and skip http guidance paths', () => {
  const manifest = loadIngestedManifest('8.1')
  assert.ok(manifest)

  const refs = collectManifestFileRefs(manifest)
  assert.ok(refs.some((row) => row.assessmentId === '81-6-soccer-assessment'))
  assert.ok(
    refs.some(
      (row) =>
        row.assessmentId === '81-6-soccer-assessment' &&
        row.field === 'studentHandout' &&
        /Soccer Assessment/.test(row.manifestPath),
    ),
  )
  assert.equal(
    refs.some((row) => row.manifestPath.startsWith('http')),
    false,
  )
})
