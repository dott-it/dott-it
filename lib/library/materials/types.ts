import type { AssessmentSource, IngestedFileRefs, LibraryOutputKind } from '@/lib/library/ingest/types'
import { libraryGoogleFormEmbedUrl, libraryGoogleFormUrl } from './library-form-url'

export type PackageItemKind =
  | 'student-handout'
  | 'google-form'
  | 'teacher-guide'
  | 'answer-key'
  | 'rubric'
  | 'guidance-sheet'

export interface PackageItem {
  kind: PackageItemKind
  label: string
  fileName?: string
  sourcePath?: string
  /** Primary link (Open / Workspace). Prefer forms@ teacher-ready when present. */
  url?: string
  /**
   * Form to iframe in Quick look. Prefer Shared Drive curriculum Form — Google
   * blocks embedding File upload / verified-email Forms inside our modal.
   */
  embedUrl?: string
  available: boolean
  unavailableReason?: string
}

export interface MaterialAssessmentContext {
  id: string
  source: AssessmentSource
  assessmentType?: string
  isSummative?: boolean
  libraryOutput?: LibraryOutputKind
  previewExcerpt?: string
  package: PackageItem[]
}

function fileNameFromPath(path: string | null): string | undefined {
  if (!path) {
    return undefined
  }
  const parts = path.split(/[/\\]/)
  return parts.at(-1)
}

function localUrl(path: string | null): string | undefined {
  if (!path) {
    return undefined
  }
  return `ingest:${path}`
}

function googleFormFileName(files: IngestedFileRefs): string | undefined {
  if (libraryGoogleFormUrl(files)) {
    return 'Google Form'
  }
  if (files.studentHandout) {
    return 'Google Form (teacher-ready required for export)'
  }
  return fileNameFromPath(files.googleForm)
}

function googleFormUnavailableReason(
  files: IngestedFileRefs,
  libraryOutput?: LibraryOutputKind,
): string | undefined {
  if (files.studentHandout) {
    return undefined
  }
  if (libraryOutput === 'handout-form-planned') {
    return 'Planned — not yet digitized'
  }
  return 'Not yet digitized'
}

export function buildPackageFromFiles(
  files: IngestedFileRefs,
  libraryOutput?: LibraryOutputKind,
): PackageItem[] {
  const guidanceUrl = files.guidanceSheet?.startsWith('/')
    ? files.guidanceSheet
    : localUrl(files.guidanceSheet ?? null)

  return [
    {
      kind: 'guidance-sheet',
      label: 'Assessment opportunity guidance',
      fileName: files.guidanceSheet?.split('/').pop(),
      sourcePath: files.guidanceSheet?.startsWith('/')
        ? undefined
        : (files.guidanceSheet ?? undefined),
      url: guidanceUrl,
      available: Boolean(files.guidanceSheet),
      unavailableReason: 'Not generated',
    },
    {
      kind: 'student-handout',
      label: 'Student handout',
      fileName: fileNameFromPath(files.studentHandout),
      sourcePath: files.studentHandout ?? undefined,
      url: localUrl(files.studentHandout),
      available: Boolean(files.studentHandout),
      unavailableReason: 'Not in library',
    },
    {
      kind: 'google-form',
      label: 'Google Form',
      fileName: googleFormFileName(files),
      sourcePath: files.googleForm?.startsWith('http') ? undefined : (files.googleForm ?? undefined),
      url: libraryGoogleFormUrl(files) ?? undefined,
      embedUrl: libraryGoogleFormEmbedUrl(files) ?? undefined,
      available:
        Boolean(files.studentHandout) ||
        Boolean(files.googleForm) ||
        Boolean(files.googleFormTeacherReady),
      unavailableReason: googleFormUnavailableReason(files, libraryOutput),
    },
    {
      kind: 'teacher-guide',
      label: 'Teacher guide',
      fileName: fileNameFromPath(files.teacherGuide),
      sourcePath: files.teacherGuide ?? undefined,
      url: localUrl(files.teacherGuide),
      available: Boolean(files.teacherGuide),
      unavailableReason: 'Not in library',
    },
    {
      kind: 'answer-key',
      label: 'Answer key (recommended)',
      fileName: fileNameFromPath(files.answerKey),
      sourcePath: files.answerKey ?? undefined,
      url: localUrl(files.answerKey),
      available: Boolean(files.answerKey),
      unavailableReason: 'Not in library',
    },
    {
      kind: 'rubric',
      label: 'Rubric (recommended)',
      fileName: fileNameFromPath(files.rubric),
      sourcePath: files.rubric ?? undefined,
      url: localUrl(files.rubric),
      available: Boolean(files.rubric),
      unavailableReason: 'Not part of this assessment',
    },
  ]
}
