import type { PackageItemKind } from './types'

const DRIVE_DOCUMENT_PREVIEW_KINDS = new Set<PackageItemKind>([
  'student-handout',
  'teacher-guide',
  'answer-key',
  'rubric',
])

export function isDriveDocumentPreviewKind(kind: PackageItemKind): boolean {
  return DRIVE_DOCUMENT_PREVIEW_KINDS.has(kind)
}

/** In-app Quick look PDF stream for Drive-backed catalog materials. */
export function libraryMaterialPreviewUrl(args: {
  unitCode: string
  assessmentId: string
  kind: PackageItemKind
}): string {
  const params = new URLSearchParams({
    unitCode: args.unitCode,
    assessmentId: args.assessmentId,
    kind: args.kind,
  })
  return `/api/library/material-preview?${params.toString()}`
}
