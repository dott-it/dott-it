#!/usr/bin/env node
/**
 * Ingest one MS unit from content-pipeline data/1_data_clean layout using Jess's docx parsers.
 *
 * Usage:
 *   node scripts/ingest/ingest-unit-from-data-clean.mjs <unitCode> <output.json>
 *
 * Env:
 *   CONTENT_PIPELINE_ROOT — default ~/Projects/content-pipeline
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  classifyFormalAssessment,
  isFormalAssessmentFile,
  matchAnswerKey,
  shortTitleFromLessonTitle,
  titleFromAssessmentFileName,
} from '../../lib/library/ingest/formal-files.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.join(__dirname, '../..')
const scriptsDir = __dirname
const registry = JSON.parse(fs.readFileSync(path.join(scriptsDir, 'unit-registry.json'), 'utf8'))
const unitOverrides = JSON.parse(fs.readFileSync(path.join(scriptsDir, 'unit-overrides.json'), 'utf8'))
const seedUnits = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/seed/openscied_units.json'), 'utf8'))

const extractTitleScript = path.join(scriptsDir, 'extract-lesson-title.py')
const extractPacingScript = path.join(scriptsDir, 'extract-lesson-pacing.py')
const extractOpportunitiesScript = path.join(scriptsDir, 'extract-te-assessment-opportunities.py')
const tempGuidanceRoot = path.join('/tmp', 'dott-it-openscied-ingest')

const contentPipelineRoot =
  process.env.CONTENT_PIPELINE_ROOT ?? path.join(process.env.HOME ?? '', 'Projects/content-pipeline')

const unitCode = process.argv[2]
const outPath = process.argv[3]

if (!unitCode || !outPath) {
  console.error('Usage: ingest-unit-from-data-clean.mjs <unitCode> <output.json>')
  process.exit(1)
}

const entry = registry[unitCode]
const seed = seedUnits.find((unit) => unit.unitCode === unitCode)
if (!entry || !seed) {
  console.error(`Unknown unit ${unitCode}`)
  process.exit(1)
}

const unitRoot = path.join(
  contentPipelineRoot,
  'data/1_data_clean',
  String(entry.grade),
  unitCode,
)
if (!fs.existsSync(unitRoot)) {
  console.error(`Missing unit folder: ${unitRoot}`)
  process.exit(1)
}

const overrides = unitOverrides[unitCode] ?? {}
const idPrefix = unitCode.replace('.', '')
const standards = seed.standards ?? []
const titleOverridesPath = overrides.titleOverridesPath
  ? path.join(repoRoot, 'data/ingested', overrides.titleOverridesPath)
  : null

function loadTitleOverrides() {
  if (!titleOverridesPath || !fs.existsSync(titleOverridesPath)) return {}
  const raw = JSON.parse(fs.readFileSync(titleOverridesPath, 'utf8'))
  const { _comment, ...rest } = raw
  return rest
}

const TITLE_OVERRIDES = loadTitleOverrides()
const FORMAL_TITLE_OVERRIDES_PATH = path.join(repoRoot, 'data/ingested/formal-title-overrides.json')
const FORMAL_TITLE_OVERRIDES = (() => {
  if (!fs.existsSync(FORMAL_TITLE_OVERRIDES_PATH)) return {}
  const raw = JSON.parse(fs.readFileSync(FORMAL_TITLE_OVERRIDES_PATH, 'utf8'))
  const { _comment, ...rest } = raw
  return rest
})()

function basename(p) {
  return path.basename(p)
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function relPath(fullPath) {
  return path.relative(unitRoot, fullPath).split(path.sep).join('/')
}

function listLessonDirs() {
  return fs
    .readdirSync(unitRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^lesson_\d+$/.test(d.name))
    .map((d) => ({
      name: d.name,
      path: path.join(unitRoot, d.name, 'original'),
      lessonNum: parseInt(d.name.replace('lesson_', ''), 10),
    }))
    .filter((d) => fs.existsSync(d.path))
    .sort((a, b) => a.lessonNum - b.lessonNum)
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).map((f) => path.join(dir, f))
}

function englishLessonFiles(files) {
  const unitPattern = new RegExp(`${unitCode.replace('.', '\\.')} Lesson \\d+`)
  return files.filter((f) => unitPattern.test(basename(f)) && !/Lecci[oó]n/i.test(basename(f)))
}

function extractLessonTitle(teacherGuidePath) {
  if (!teacherGuidePath || !fs.existsSync(teacherGuidePath)) return null
  try {
    return execFileSync('python3', [extractTitleScript, teacherGuidePath], { encoding: 'utf8' }).trim() || null
  } catch {
    return null
  }
}

function findUnitOverviewDoc() {
  const overviewDir = path.join(unitRoot, 'unit_materials', 'original')
  if (!fs.existsSync(overviewDir)) return null
  const matches = fs
    .readdirSync(overviewDir)
    .filter((f) => /Unit Overview Materials/i.test(f) && /\.docx$/i.test(f))
    .map((f) => path.join(overviewDir, f))
  return matches[0] ?? null
}

function extractLessonPacing(overviewPath) {
  if (!overviewPath || !fs.existsSync(overviewPath)) {
    return { lessons: {}, totalDays: null }
  }
  try {
    const raw = execFileSync('python3', [extractPacingScript, overviewPath], { encoding: 'utf8' }).trim()
    const parsed = JSON.parse(raw)
    return { lessons: parsed.lessons ?? {}, totalDays: parsed.totalDays ?? null }
  } catch {
    return { lessons: {}, totalDays: null }
  }
}

function applyShortTitle(id, shortTitle) {
  return TITLE_OVERRIDES[id] ?? shortTitle
}

const lessonDirs = listLessonDirs()
const unitOverviewPath = findUnitOverviewDoc()
const pacing = extractLessonPacing(unitOverviewPath)
const lessons = []
const assessments = []

for (const { path: lessonPath, lessonNum } of lessonDirs) {
  const lessonLabel = `Lesson ${String(lessonNum).padStart(2, '0')}`
  const files = listFiles(lessonPath)
  const en = englishLessonFiles(files)
  const teacherGuide = en.find((f) => /Teacher Edition/i.test(basename(f)))
  const lessonTitle = teacherGuide ? extractLessonTitle(teacherGuide) : null

  lessons.push({
    lessonNum,
    shortTitle: shortTitleFromLessonTitle(lessonTitle ?? `Lesson ${lessonNum}`, lessonNum),
    title: lessonTitle ?? `Lesson ${lessonNum}`,
    teacherEditionPath: teacherGuide ? relPath(teacherGuide) : null,
    expectedDays: pacing.lessons[lessonNum] ?? undefined,
  })

  const assessmentFiles = en.filter((f) => isFormalAssessmentFile(basename(f)))
  const keyFiles = en.filter((f) => /Answer Key/i.test(basename(f)))

  for (const af of assessmentFiles) {
    const title = titleFromAssessmentFileName(unitCode, basename(af), FORMAL_TITLE_OVERRIDES)
    const keyName = matchAnswerKey(
      basename(af),
      keyFiles.map((file) => basename(file)),
    )
    const key = keyName ? keyFiles.find((file) => basename(file) === keyName) : null
    const classified = classifyFormalAssessment(title, lessonNum, overrides.summativeLessons ?? [])
    assessments.push({
      id: `${idPrefix}-${lessonNum}-${slugify(title)}`,
      lesson: lessonLabel,
      lessonNum,
      title,
      source: 'formal-assessment',
      assessmentType: classified.assessmentType,
      opportunityType: 'named-package',
      libraryOutput: key ? 'full-package' : 'handout-form-planned',
      standards,
      isSummative: classified.isSummative,
      description: `OpenSciEd Unit ${unitCode} ${lessonLabel} — ${title}.`,
      files: {
        studentHandout: relPath(af),
        teacherGuide: teacherGuide ? relPath(teacherGuide) : null,
        answerKey: key ? relPath(key) : null,
        googleForm: null,
        rubric: null,
      },
    })
  }

  const extraRules = overrides.extraHandoutAssessments ?? {}
  const extra = extraRules[String(lessonNum)]
  if (extra) {
    const handout = en.find((f) => basename(f).includes(extra.fileMatch))
    const key = extra.keyMatch ? en.find((f) => basename(f).includes(extra.keyMatch)) : null
    if (handout) {
      assessments.push({
        id: `${idPrefix}-${lessonNum}-${slugify(extra.title)}`,
        lesson: lessonLabel,
        lessonNum,
        title: extra.title,
        source: 'formal-assessment',
        assessmentType: extra.assessmentType,
        opportunityType: 'handout-written',
        libraryOutput: 'handout-form-planned',
        standards,
        isSummative: false,
        description: `OpenSciEd Unit ${unitCode} ${lessonLabel} — ${extra.title}.`,
        files: {
          studentHandout: relPath(handout),
          teacherGuide: teacherGuide ? relPath(teacherGuide) : null,
          answerKey: key ? relPath(key) : null,
          googleForm: null,
          rubric: null,
        },
      })
    }
  }
}

const lessonsForExtract = lessons.map((row) => {
  const lessonDir = lessonDirs.find((d) => d.lessonNum === row.lessonNum)
  const files = lessonDir ? listFiles(lessonDir.path) : []
  const en = englishLessonFiles(files)
  const te = en.find((f) => /Teacher Edition/i.test(basename(f)))
  const handouts = en.filter((f) => /Handout/i.test(basename(f)) && !/Answer Key/i.test(basename(f)))
  return {
    lessonNum: row.lessonNum,
    shortTitle: row.shortTitle,
    teacherEditionAbs: te ?? null,
    handoutAbsPaths: handouts,
  }
})

let embeddedOpportunities = []
fs.mkdirSync(tempGuidanceRoot, { recursive: true })
try {
  const raw = execFileSync(
    'python3',
    [
      extractOpportunitiesScript,
      tempGuidanceRoot,
      unitCode,
      JSON.stringify(lessonsForExtract.filter((l) => l.teacherEditionAbs)),
    ],
    { encoding: 'utf8' },
  ).trim()
  embeddedOpportunities = JSON.parse(raw)
} catch (err) {
  console.warn(`Could not extract TE opportunities for ${unitCode}:`, err.message)
}

const packagedHandouts = new Set(
  assessments.map((a) => a.files.studentHandout).filter(Boolean),
)

for (const opp of embeddedOpportunities) {
  const handoutRel = opp.studentHandout ? relPath(opp.studentHandout) : null
  if (handoutRel && packagedHandouts.has(handoutRel)) continue

  const lessonNum = opp.lessonNum
  const lessonLabel = opp.lesson
  const teacherGuide = lessonsForExtract.find((l) => l.lessonNum === lessonNum)?.teacherEditionAbs
  const tgRel = teacherGuide ? relPath(teacherGuide) : null
  const shortTitle = applyShortTitle(opp.id, opp.shortTitle ?? opp.title)
  const rawType = opp.assessmentType ?? 'formative'
  const assessmentType =
    rawType === 'formative' || rawType === 'lesson-reflection' ? undefined : rawType

  const row = {
    id: opp.id,
    lesson: lessonLabel,
    lessonNum,
    source: 'te-opportunity',
    title: shortTitle,
    shortTitle,
    peCode: opp.peCode ?? null,
    buildingTowards: opp.buildingTowards ?? null,
    lookListenFor: opp.lookListenFor ?? null,
    whatToDo: opp.whatToDo ?? null,
    opportunityType: opp.opportunityType,
    libraryOutput: opp.libraryOutput,
    standards,
    isSummative: rawType === 'summative',
    description: `OpenSciEd Unit ${unitCode} ${lessonLabel} — assessment opportunity from Teacher Edition.`,
    files: {
      studentHandout: handoutRel,
      teacherGuide: tgRel,
      answerKey: null,
      googleForm: null,
      rubric: null,
      guidanceSheet: opp.guidancePath ?? null,
    },
  }
  if (assessmentType) row.assessmentType = assessmentType
  assessments.push(row)
}

assessments.sort((a, b) => {
  if (a.lessonNum !== b.lessonNum) return a.lessonNum - b.lessonNum
  const aFormal = a.source === 'formal-assessment' ? 0 : 1
  const bFormal = b.source === 'formal-assessment' ? 0 : 1
  if (aFormal !== bFormal) return aFormal - bFormal
  return a.title.localeCompare(b.title)
})

const manifest = {
  unitId: unitCode,
  unitTitle: seed.title,
  description: seed.description ?? '',
  lessonCount: lessonDirs.length,
  suggestedPacingDays: pacing.totalDays ?? undefined,
  unitOverviewPath: unitOverviewPath ? relPath(unitOverviewPath) : null,
  ingestedFrom: unitRoot,
  ingestedAt: new Date().toISOString(),
  lessons,
  assessments,
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2))

const teCount = assessments.filter((a) => a.source === 'te-opportunity').length
const formalCount = assessments.filter((a) => a.source === 'formal-assessment').length
console.log(
  `Wrote ${assessments.length} rows (${teCount} TE, ${formalCount} formal), ${lessonDirs.length} lessons → ${outPath}`,
)
