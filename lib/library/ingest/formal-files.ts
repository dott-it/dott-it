/**
 * Filename rules for OpenSciEd formal assessments (Drive / 1_data_clean).
 * Shared by content-pipeline ingest and the drive-index reingest pass.
 */

const STOP_TOKENS = new Set([
  'lesson',
  'answer',
  'key',
  'assessment',
  'teacher',
  'reference',
  'handout',
  'for',
  'the',
  'and',
  'of',
  'a',
  'an',
  'to',
  'how',
  'does',
  'what',
  'why',
  'are',
  'is',
  'in',
  'on',
  'part',
  'version',
])

export function fileStem(fileName: string): string {
  return fileName.replace(/\.(docx|pdf)$/i, '').trim()
}

export function lessonNumberFromPath(relativePath: string): number | null {
  const drive = /(?:^|\/)Lesson (\d+) -/i.exec(relativePath)
  if (drive) {
    return Number(drive[1])
  }
  const pipeline = /(?:^|\/)lesson_(\d+)(?:\/|$)/i.exec(relativePath)
  return pipeline ? Number(pipeline[1]) : null
}

export function lessonNumberFromFileName(fileName: string): number | null {
  const match = /Lesson (\d+)/i.exec(fileName)
  return match ? Number(match[1]) : null
}

export function isEnglishCurriculumFile(fileName: string, unitCode: string): boolean {
  if (/Lecci[oó]n|Spanish|^Copy of /i.test(fileName)) {
    return false
  }
  const escaped = unitCode.replaceAll('.', String.raw`\.`)
  return new RegExp(`^${escaped} Lesson \\d+`, 'i').test(fileName)
}

export function isTeacherEditionFile(fileName: string): boolean {
  return /Teacher Edition/i.test(fileName)
}

export function isAnswerKeyFile(fileName: string): boolean {
  return /Answer Key/i.test(fileName)
}

export function isTeacherReferenceFile(fileName: string): boolean {
  return /Teacher Reference/i.test(fileName)
}

export function isSelfAssessmentHandout(fileName: string): boolean {
  return /Handout/i.test(fileName) && /Self[- ]?Assessment/i.test(fileName)
}

export function isPeerFeedbackHandout(fileName: string): boolean {
  return /Handout/i.test(fileName) && /Peer Feedback/i.test(fileName)
}

/**
 * Named student assessment package — not an answer key, TE reference,
 * or classroom self-check / peer-feedback handout.
 */
export function isFormalAssessmentFile(fileName: string): boolean {
  if (/^Copy of /i.test(fileName)) {
    return false
  }
  if (!/Assessment/i.test(fileName)) {
    return false
  }
  if (isAnswerKeyFile(fileName)) {
    return false
  }
  if (isTeacherEditionFile(fileName)) {
    return false
  }
  if (isTeacherReferenceFile(fileName)) {
    return false
  }
  if (isSelfAssessmentHandout(fileName) || isPeerFeedbackHandout(fileName)) {
    return false
  }
  if (/Handout/i.test(fileName)) {
    return false
  }
  return true
}

export function drivePathWithDocx(relativePath: string): string {
  if (/\.(docx|pdf)$/i.test(relativePath)) {
    return relativePath
  }
  return `${relativePath}.docx`
}

export function titleFromAssessmentFileName(
  unitCode: string,
  fileName: string,
  overrides: Record<string, string> = {},
): string {
  const stem = fileStem(fileName)
  const override = overrides[stem]?.trim()
  if (override) {
    return override
  }

  const escaped = unitCode.replaceAll('.', String.raw`\.`)
  const title = stem
    .replace(new RegExp(`^${escaped} Lesson \\d+ Assessment\\s*`, 'i'), '')
    .replace(/^Assessment\s+/i, '')
    .replace(/^[“"']+/, '')
    .replace(/[”"']+$/, '')
    .replace(/,$/, '')
    .replaceAll('Related-Phenomena', 'Related Phenomena')
    .replaceAll(/\s+/g, ' ')
    .trim()

  const partMatch = /^Part (\d+) Cheerleading$/i.exec(title)
  if (partMatch) {
    return `Cheerleading Performance Task (Part ${partMatch[1]})`
  }

  if (!title || /^assessment$/i.test(title)) {
    const lessonNum = lessonNumberFromFileName(stem)
    return lessonNum ? `Lesson ${lessonNum} Assessment` : 'Assessment'
  }

  return title
}

export function classifyFormalAssessment(
  title: string,
  lessonNum: number,
  summativeLessons: number[] = [],
): {
  assessmentType: 'formative' | 'summative' | 'lesson-reflection' | 'peer-feedback'
  isSummative: boolean
} {
  if (summativeLessons.includes(lessonNum) || /summative|unit assessment/i.test(title)) {
    return { assessmentType: 'summative', isSummative: true }
  }
  if (/self-assessment/i.test(title)) {
    return { assessmentType: 'lesson-reflection', isSummative: false }
  }
  if (/peer feedback|stakeholder feedback/i.test(title)) {
    return { assessmentType: 'peer-feedback', isSummative: false }
  }
  return { assessmentType: 'formative', isSummative: false }
}

export function significantTokens(fileName: string): Set<string> {
  const tokens = fileStem(fileName)
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_TOKENS.has(token) && !/^\d+$/.test(token))
  return new Set(tokens)
}

function looksLikeAssessmentKey(fileName: string): boolean {
  return /assessment key|scoring|key for|argument for/i.test(fileName)
}

/**
 * Pick the answer key for a student assessment in the same lesson.
 * Prefer token overlap; boost “Assessment Key” next to an Assessment file.
 * Do not attach an unrelated lesson key just because it is the only file.
 */
export function matchAnswerKey(
  assessmentFileName: string,
  keyFileNames: string[],
): string | null {
  if (keyFileNames.length === 0) {
    return null
  }

  const assessmentTokens = significantTokens(assessmentFileName)
  let best: string | null = null
  let bestScore = 0
  for (const key of keyFileNames) {
    const keyTokens = significantTokens(key)
    let score = 0
    for (const token of assessmentTokens) {
      if (keyTokens.has(token)) {
        score += 1
      }
    }
    if (/assessment/i.test(assessmentFileName) && /assessment key/i.test(key)) {
      score += 2
    }
    if (looksLikeAssessmentKey(key) && score === 0 && keyFileNames.length === 1) {
      score += 1
    }
    if (score > bestScore) {
      bestScore = score
      best = key
    }
  }
  return bestScore > 0 ? best : null
}

export function shortTitleFromLessonTitle(title: string, lessonNum: number): string {
  const trimmed = title.trim()
  if (!trimmed || /^Lesson \d+$/i.test(trimmed)) {
    return `Lesson ${lessonNum}`
  }
  return trimmed.replaceAll(/\?+$/g, '').trim()
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '')
}

export function unitIdPrefix(unitCode: string): string {
  return unitCode.replaceAll('.', '')
}
