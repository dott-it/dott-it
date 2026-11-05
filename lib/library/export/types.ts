import type { PackageItemKind } from '@/lib/library/materials/types'

export interface UnitExportSummary {
  unitCode: string
  ready: boolean
  assessmentCount: number
  materialCount: number
}

export interface LibraryUnitExportRequest {
  unitCode: string
}

export interface LibraryUnitExportAssessmentResult {
  assessmentId: string
  assessmentTitle: string
  folderUrl: string
  files: LibraryExportFileResult[]
}

export interface LibraryUnitExportResponse {
  folderUrl: string
  folderId: string
  assessmentCount: number
  materialCount: number
  assessments: LibraryUnitExportAssessmentResult[]
  externalLinks: LibraryExportFileResult[]
}

export interface LibraryExportRequest {
  unitCode: string
  assessmentId: string
  assessmentTitle: string
  kinds: PackageItemKind[]
}

export type LibraryExportFileAction = 'copied' | 'external-link' | 'created' | 'reused'

export interface LibraryExportFileResult {
  kind: PackageItemKind
  name: string
  url: string
  action: LibraryExportFileAction
}

export interface LibraryExportResponse {
  folderUrl: string
  folderId: string
  files: LibraryExportFileResult[]
}

export interface LibraryExportGoogleTokenPayload {
  accessToken: string
  expiryDate?: number
  email?: string
  /** When set at OAuth time, subsequent export/download must match this Dott.it user. */
  dottUserId?: string
}

export interface DriveCopyTarget {
  kind: PackageItemKind
  label: string
  driveFileId: string
  name: string
}

export interface ExternalExportLink {
  kind: PackageItemKind
  label: string
  url: string
}

/** Place a Google Form in the teacher's export folder (copy curriculum Form, or create). */
export interface GenerateFormTarget {
  kind: 'google-form'
  label: string
  assessmentTitle: string
}
