export interface DriveFileEntry {
  driveFileId: string
  name: string
  relativePath: string
  modifiedTime?: string
  mimeType?: string
}

export type DrivePathMatchKind = 'exact' | 'stem' | 'basename' | 'lesson-basename'

export interface DrivePathMatch {
  entry: DriveFileEntry
  matchKind: DrivePathMatchKind
}

export interface ManifestFileRefMatch {
  assessmentId: string
  field: string
  manifestPath: string
  driveFileId: string
  driveRelativePath: string
  matchKind: DrivePathMatchKind
  modifiedTime?: string
}

export interface UnitDriveIndex {
  unitId: string
  driveRootFolderId: string
  gradeFolder: string
  unitFolder: string
  unitDriveFolderId: string
  indexedAt: string
  fileCount: number
  manifestPathCount: number
  matchedCount: number
  unmatchedManifestPaths: Array<{
    assessmentId: string
    field: string
    manifestPath: string
  }>
  matches: ManifestFileRefMatch[]
  filesByRelativePath: Record<
    string,
    {
      driveFileId: string
      name: string
      modifiedTime?: string
    }
  >
}
