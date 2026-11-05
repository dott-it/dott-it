import JSZip from 'jszip'
import {
  downloadDriveFileBytes,
  sanitizeDownloadFileName,
  withPreferredExtension,
} from './download-drive-file'
import {
  googleFormShortcutContents,
  googleFormShortcutFileName,
} from './google-form-shortcut'
import type { DriveCopyTarget, ExternalExportLink } from './types'

export async function buildMaterialsZip(args: {
  accessToken: string
  entries: Array<{
    folderPath: string
    target: DriveCopyTarget
  }>
  formLinks?: Array<{
    folderPath: string
    link: ExternalExportLink
  }>
}): Promise<{ zipBytes: Uint8Array; fileCount: number }> {
  const zip = new JSZip()
  let fileCount = 0
  const usedPaths = new Set<string>()

  const addZipPath = (folder: string, baseName: string, bytes: ArrayBuffer | string) => {
    const normalizedFolder = folder.replaceAll('\\', '/').replaceAll(/^\/+|\/+$/g, '')
    let zipPath = normalizedFolder ? `${normalizedFolder}/${baseName}` : baseName
    let suffix = 2
    while (usedPaths.has(zipPath.toLowerCase())) {
      const dot = baseName.lastIndexOf('.')
      const stem = dot > 0 ? baseName.slice(0, dot) : baseName
      const ext = dot > 0 ? baseName.slice(dot) : ''
      const candidate = `${stem} (${suffix})${ext}`
      zipPath = normalizedFolder ? `${normalizedFolder}/${candidate}` : candidate
      suffix += 1
    }
    usedPaths.add(zipPath.toLowerCase())
    zip.file(zipPath, bytes)
    fileCount += 1
  }

  for (const entry of args.entries) {
    const downloaded = await downloadDriveFileBytes(args.accessToken, entry.target.driveFileId)
    const baseName = withPreferredExtension(
      entry.target.name || entry.target.label || downloaded.fileName || 'material',
      downloaded.extension,
    )
    addZipPath(entry.folderPath, baseName, downloaded.bytes)
  }

  for (const entry of args.formLinks ?? []) {
    addZipPath(
      entry.folderPath,
      googleFormShortcutFileName(entry.link.label),
      googleFormShortcutContents(entry.link.label, entry.link.url),
    )
  }

  if (fileCount === 0) {
    throw new Error('No downloadable Drive files for this selection')
  }

  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return { zipBytes, fileCount }
}

export function flattenUnitDownloadEntries(
  assessments: Array<{
    assessmentTitle: string
    driveCopies: DriveCopyTarget[]
    externalLinks: ExternalExportLink[]
  }>,
): Array<{ folderPath: string; target: DriveCopyTarget }> {
  return assessments.flatMap((assessment) =>
    assessment.driveCopies.map((target) => ({
      folderPath: sanitizeDownloadFileName(assessment.assessmentTitle),
      target,
    })),
  )
}
