import type { DriveFileEntry } from '@/lib/library/drive-index/types'
import {
  classifyFormalAssessment,
  drivePathWithDocx,
  fileStem,
  isAnswerKeyFile,
  isEnglishCurriculumFile,
  isFormalAssessmentFile,
  isTeacherEditionFile,
  lessonNumberFromPath,
  matchAnswerKey,
  shortTitleFromLessonTitle,
  slugify,
  titleFromAssessmentFileName,
  unitIdPrefix,
} from './formal-files'
import { pickLinkedTeOpportunityId } from './link-te-opportunity'
import type { IngestedAssessment, IngestedLesson, IngestedUnitManifest } from './types'

export type DriveIndexFileMeta = {
  name?: string
  driveFileId?: string
  modifiedTime?: string
}

export interface ReingestFromDriveIndexInput {
  unitCode: string
  previous: IngestedUnitManifest
  filesByRelativePath: Record<string, DriveIndexFileMeta>
  titleOverrides?: Record<string, string>
  summativeLessons?: number[]
  standards?: string[]
}

function basename(relativePath: string): string {
  const parts = relativePath.split('/')
  return parts.at(-1) ?? relativePath
}

function previousFormUrlsByHandoutStem(
  previous: IngestedUnitManifest,
): Map<string, { googleForm: string | null; googleFormTeacherReady: string | null }> {
  const map = new Map<string, { googleForm: string | null; googleFormTeacherReady: string | null }>()
  for (const row of previous.assessments) {
    if (row.source !== 'formal-assessment') {
      continue
    }
    const handout = row.files.studentHandout
    if (!handout) {
      continue
    }
    map.set(fileStem(basename(handout)), {
      googleForm: row.files.googleForm ?? null,
      googleFormTeacherReady: row.files.googleFormTeacherReady ?? null,
    })
  }
  return map
}

function entriesFromIndex(
  unitCode: string,
  filesByRelativePath: Record<string, DriveIndexFileMeta>,
): Array<{ relativePath: string; name: string; lessonNum: number }> {
  const rows: Array<{ relativePath: string; name: string; lessonNum: number }> = []
  for (const [relativePath, meta] of Object.entries(filesByRelativePath)) {
    const name = meta.name?.trim() || basename(relativePath)
    if (!isEnglishCurriculumFile(name, unitCode)) {
      continue
    }
    const lessonNum = lessonNumberFromPath(relativePath) ?? lessonNumberFromPath(name)
    if (!lessonNum) {
      continue
    }
    rows.push({ relativePath, name, lessonNum })
  }
  return rows
}

export function reingestUnitFromDriveIndex(
  input: ReingestFromDriveIndexInput,
): IngestedUnitManifest {
  const titleOverrides = input.titleOverrides ?? {}
  const summativeLessons = input.summativeLessons ?? []
  const standards = input.standards ?? input.previous.assessments[0]?.standards ?? []
  const idPrefix = unitIdPrefix(input.unitCode)
  const files = entriesFromIndex(input.unitCode, input.filesByRelativePath)
  const formUrls = previousFormUrlsByHandoutStem(input.previous)
  const previousLessons = new Map(
    (input.previous.lessons ?? []).map((lesson) => [lesson.lessonNum, lesson]),
  )

  const lessonNums = [...new Set(files.map((file) => file.lessonNum))].sort((a, b) => a - b)
  const lessons: IngestedLesson[] = lessonNums.map((lessonNum) => {
    const previous = previousLessons.get(lessonNum)
    const te = files.find(
      (file) => file.lessonNum === lessonNum && isTeacherEditionFile(file.name),
    )
    const title = previous?.title?.trim() || `Lesson ${lessonNum}`
    return {
      lessonNum,
      shortTitle: shortTitleFromLessonTitle(title, lessonNum),
      title,
      teacherEditionPath: previous?.teacherEditionPath ?? (te ? drivePathWithDocx(te.relativePath) : null),
      expectedDays: previous?.expectedDays,
    }
  })

  const formals: IngestedAssessment[] = []
  for (const lessonNum of lessonNums) {
    const lessonFiles = files.filter((file) => file.lessonNum === lessonNum)
    const teacherGuide = lessonFiles.find((file) => isTeacherEditionFile(file.name))
    const keyNames = lessonFiles.filter((file) => isAnswerKeyFile(file.name)).map((file) => file.name)
    const lessonLabel = `Lesson ${String(lessonNum).padStart(2, '0')}`

    for (const assessmentFile of lessonFiles.filter((file) => isFormalAssessmentFile(file.name))) {
      const title = titleFromAssessmentFileName(input.unitCode, assessmentFile.name, titleOverrides)
      const { assessmentType, isSummative } = classifyFormalAssessment(
        title,
        lessonNum,
        summativeLessons,
      )
      const keyName = matchAnswerKey(assessmentFile.name, keyNames)
      const keyFile = keyName
        ? lessonFiles.find((file) => file.name === keyName)
        : undefined
      const previousUrls = formUrls.get(fileStem(assessmentFile.name))
      const hasKey = Boolean(keyFile)

      formals.push({
        id: `${idPrefix}-${lessonNum}-${slugify(title)}`,
        lesson: lessonLabel,
        lessonNum,
        title,
        source: 'formal-assessment',
        assessmentType,
        opportunityType: 'named-package',
        libraryOutput: hasKey ? 'full-package' : 'handout-form-planned',
        standards,
        isSummative,
        description: `OpenSciEd Unit ${input.unitCode} ${lessonLabel} — ${title}.`,
        files: {
          studentHandout: drivePathWithDocx(assessmentFile.relativePath),
          teacherGuide: teacherGuide
            ? drivePathWithDocx(teacherGuide.relativePath)
            : (previousLessons.get(lessonNum)?.teacherEditionPath ?? null),
          answerKey: keyFile ? drivePathWithDocx(keyFile.relativePath) : null,
          googleForm: previousUrls?.googleForm ?? null,
          googleFormTeacherReady: previousUrls?.googleFormTeacherReady ?? null,
          rubric: null,
        },
      })
    }
  }

  const teOpportunities = input.previous.assessments.filter(
    (row) => row.source === 'te-opportunity',
  )

  const usedTeIds = new Set<string>()
  for (const formal of formals) {
    const previousLink = input.previous.assessments.find(
      (row) =>
        row.source === 'formal-assessment' &&
        row.lessonNum === formal.lessonNum &&
        row.linkedTeOpportunityId &&
        teOpportunities.some((opportunity) => opportunity.id === row.linkedTeOpportunityId),
    )?.linkedTeOpportunityId
    if (previousLink && !usedTeIds.has(previousLink)) {
      formal.linkedTeOpportunityId = previousLink
      usedTeIds.add(previousLink)
      continue
    }

    const linkedId = pickLinkedTeOpportunityId(
      formal.title,
      teOpportunities.filter((row) => row.lessonNum === formal.lessonNum),
      usedTeIds,
    )
    if (linkedId) {
      formal.linkedTeOpportunityId = linkedId
      usedTeIds.add(linkedId)
    }
  }

  const assessments = [...formals, ...teOpportunities].sort((a, b) => {
    if (a.lessonNum !== b.lessonNum) {
      return a.lessonNum - b.lessonNum
    }
    const aFormal = a.source === 'formal-assessment' ? 0 : 1
    const bFormal = b.source === 'formal-assessment' ? 0 : 1
    if (aFormal !== bFormal) {
      return aFormal - bFormal
    }
    return a.title.localeCompare(b.title)
  })

  return {
    ...input.previous,
    lessonCount: lessons.length,
    ingestedFrom: 'drive-index reingest (formals) + prior TE extract',
    ingestedAt: new Date().toISOString(),
    lessons,
    assessments,
  }
}

/** Map drive-index JSON `filesByRelativePath` into DriveFileEntry rows (tests / index rebuild). */
export function driveIndexFilesToEntries(
  filesByRelativePath: Record<string, DriveIndexFileMeta>,
): DriveFileEntry[] {
  return Object.entries(filesByRelativePath).map(([relativePath, meta]) => ({
    driveFileId: meta.driveFileId ?? '',
    name: meta.name ?? basename(relativePath),
    relativePath,
    modifiedTime: meta.modifiedTime,
  }))
}
