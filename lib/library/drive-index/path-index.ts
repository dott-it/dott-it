import type { DriveFileEntry, DrivePathMatch, DrivePathMatchKind } from './types'

export interface DrivePathIndex {
  entries: DriveFileEntry[]
  byRelativePath: Map<string, DriveFileEntry>
  byBasename: Map<string, DriveFileEntry[]>
}

const OFFICE_EXTENSION_PATTERN = /\.(docx|doc|pdf|pptx|xlsx)$/i

export function normalizeManifestPath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\/+/, '')
}

export function stripKnownExtension(filename: string): string {
  return filename.replace(OFFICE_EXTENSION_PATTERN, '')
}

export function pathWithoutKnownExtension(path: string): string {
  const normalized = normalizeManifestPath(path)
  const parts = normalized.split('/')
  const last = parts.at(-1)
  if (!last) {
    return normalized
  }
  parts[parts.length - 1] = stripKnownExtension(last)
  return parts.join('/')
}

export function basenameOf(path: string): string {
  const parts = normalizeManifestPath(path).split('/')
  return parts.at(-1) ?? path
}

function addBasenameCandidate(map: Map<string, DriveFileEntry[]>, name: string, entry: DriveFileEntry) {
  const list = map.get(name) ?? []
  if (!list.some((row) => row.driveFileId === entry.driveFileId)) {
    list.push(entry)
  }
  map.set(name, list)
}

export function buildDrivePathIndex(entries: DriveFileEntry[]): DrivePathIndex {
  const byRelativePath = new Map<string, DriveFileEntry>()
  const byBasename = new Map<string, DriveFileEntry[]>()

  for (const entry of entries) {
    const key = normalizeManifestPath(entry.relativePath)
    byRelativePath.set(key, entry)
    byRelativePath.set(pathWithoutKnownExtension(key), entry)

    addBasenameCandidate(byBasename, entry.name, entry)
    addBasenameCandidate(byBasename, stripKnownExtension(entry.name), entry)
  }

  return { entries, byRelativePath, byBasename }
}

function lessonFolderPattern(lessonNum: number): RegExp {
  const padded = String(lessonNum).padStart(2, '0')
  return new RegExp(`(?:^|/)lesson[_\\s-]*0?${lessonNum}(?:/|$)|Lesson ${padded}\\b|Lesson ${lessonNum}\\b`, 'i')
}

function basenameCandidatesFor(index: DrivePathIndex, manifestPath: string): DriveFileEntry[] {
  const base = basenameOf(manifestPath)
  const baseStem = stripKnownExtension(base)
  const seen = new Set<string>()
  const candidates: DriveFileEntry[] = []

  for (const name of [base, baseStem]) {
    for (const entry of index.byBasename.get(name) ?? []) {
      if (!seen.has(entry.driveFileId)) {
        seen.add(entry.driveFileId)
        candidates.push(entry)
      }
    }
  }

  return candidates
}

function pickLessonBasenameMatch(
  manifestPath: string,
  candidates: DriveFileEntry[],
): DriveFileEntry | null {
  const lessonMatch = manifestPath.match(/^lesson_(\d+)\/original\/(.+)$/i)
  if (!lessonMatch) {
    return null
  }

  const lessonNum = Number.parseInt(lessonMatch[1], 10)
  const filePart = stripKnownExtension(lessonMatch[2])
  const lessonPattern = lessonFolderPattern(lessonNum)

  const inLesson = candidates.filter(
    (entry) =>
      lessonPattern.test(entry.relativePath) &&
      (entry.relativePath.endsWith(`/${filePart}`) ||
        pathWithoutKnownExtension(entry.relativePath).endsWith(`/${filePart}`)),
  )
  if (inLesson.length === 1) {
    return inLesson[0]
  }

  const suffixMatches = candidates.filter(
    (entry) =>
      entry.relativePath.endsWith(`/${filePart}`) ||
      pathWithoutKnownExtension(entry.relativePath).endsWith(`/${filePart}`),
  )
  if (suffixMatches.length === 1) {
    return suffixMatches[0]
  }

  return null
}

function pickFolderBasenameMatch(manifestPath: string, candidates: DriveFileEntry[]): DriveFileEntry | null {
  const lessonDir = manifestPath.split('/')[0]
  if (!lessonDir) {
    return null
  }

  const inFolder = candidates.filter(
    (entry) =>
      entry.relativePath.startsWith(`${lessonDir}/`) ||
      entry.relativePath.includes(`/${lessonDir}/`),
  )
  if (inFolder.length === 1) {
    return inFolder[0]
  }

  return null
}

export function matchManifestPathToDrive(
  manifestPath: string,
  index: DrivePathIndex,
): DrivePathMatch | null {
  const normalized = normalizeManifestPath(manifestPath)

  const exact = index.byRelativePath.get(normalized)
  if (exact) {
    return { entry: exact, matchKind: 'exact' }
  }

  const stemPath = pathWithoutKnownExtension(normalized)
  if (stemPath !== normalized) {
    const stem = index.byRelativePath.get(stemPath)
    if (stem) {
      return { entry: stem, matchKind: 'stem' }
    }
  }

  const candidates = basenameCandidatesFor(index, normalized)

  const lessonMatch = pickLessonBasenameMatch(normalized, candidates)
  if (lessonMatch) {
    return { entry: lessonMatch, matchKind: 'lesson-basename' }
  }

  if (candidates.length === 1) {
    return { entry: candidates[0], matchKind: 'basename' }
  }

  if (candidates.length > 1) {
    const folderMatch = pickFolderBasenameMatch(normalized, candidates)
    if (folderMatch) {
      return { entry: folderMatch, matchKind: 'basename' }
    }
  }

  return null
}

export function matchKindLabel(kind: DrivePathMatchKind): string {
  return kind
}
