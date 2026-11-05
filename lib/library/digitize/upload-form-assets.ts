import { googleApiJson } from '@/lib/library/export/google-api-fetch'
import {
  assetUploadFileName,
  buildAssetCatalog,
  type AssetCatalogEntry,
} from './asset-catalog'
import { createDriveFolder } from './create-drive-folder'
import type { ExtractedDocxImage } from './extract-docx-text'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3'

export function formImageSourceUri(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

export interface UploadFormAssetImagesResult {
  sourceUris: Map<number, string>
  assetsFolderId?: string
  catalog: AssetCatalogEntry[]
  manifestFileId?: string
}

/**
 * Upload referenced handout images to a Drive assets folder and make them
 * fetchable by the Forms API via anyone-with-link reader permission.
 * Writes assets-manifest.json for human-in-the-loop review.
 */
export async function uploadFormAssetImages(args: {
  accessToken: string
  parentFolderId: string
  assetsFolderName: string
  images: ExtractedDocxImage[]
  /** 1-based image indexes referenced by extracted questions. */
  referencedIndexes: number[]
}): Promise<Map<number, string>> {
  const result = await uploadFormAssetImagesWithManifest(args)
  return result.sourceUris
}

/**
 * Same as {@link uploadFormAssetImages} but also returns catalog + folder ids.
 */
export async function uploadFormAssetImagesWithManifest(args: {
  accessToken: string
  parentFolderId: string
  assetsFolderName: string
  images: ExtractedDocxImage[]
  referencedIndexes: number[]
}): Promise<UploadFormAssetImagesResult> {
  const needed = new Set(args.referencedIndexes.filter((n) => Number.isInteger(n) && n > 0))
  const toUpload = args.images.filter((image) => needed.has(image.index))
  const catalog = buildAssetCatalog(toUpload)
  const sourceUris = new Map<number, string>()

  if (toUpload.length === 0) {
    return { sourceUris, catalog }
  }

  const assetsFolder = await createDriveFolder({
    accessToken: args.accessToken,
    parentId: args.parentFolderId,
    name: args.assetsFolderName,
  })

  for (const image of toUpload) {
    const uploaded = await uploadBinaryFileToFolder({
      accessToken: args.accessToken,
      folderId: assetsFolder.id,
      fileName: assetUploadFileName(image),
      mimeType: image.mimeType === 'image/jpeg' ? 'image/jpeg' : 'image/png',
      bytes: image.bytes,
    })
    await makeAnyoneWithLinkReader(args.accessToken, uploaded.id)
    sourceUris.set(image.index, formImageSourceUri(uploaded.id))
  }

  const manifestBody = JSON.stringify(
    {
      generatedBy: 'dott-it-digitize',
      assetsFolderName: args.assetsFolderName,
      assets: catalog.map((entry) => ({
        ...entry,
        driveFileName: assetUploadFileName(
          toUpload.find((image) => image.index === entry.index) ?? {
            index: entry.index,
            fileName: entry.fileName,
            mimeType: 'image/png',
            bytes: Buffer.alloc(0),
            kind: entry.kind,
            contextHint: entry.contextHint,
          },
        ),
        sourceUri: sourceUris.get(entry.index) ?? null,
      })),
    },
    null,
    2,
  )

  const manifest = await uploadBinaryFileToFolder({
    accessToken: args.accessToken,
    folderId: assetsFolder.id,
    fileName: 'assets-manifest.json',
    mimeType: 'application/json',
    bytes: Buffer.from(manifestBody, 'utf8'),
  })

  return {
    sourceUris,
    assetsFolderId: assetsFolder.id,
    catalog,
    manifestFileId: manifest.id,
  }
}

async function uploadBinaryFileToFolder(args: {
  accessToken: string
  folderId: string
  fileName: string
  mimeType: string
  bytes: Buffer
}): Promise<{ id: string }> {
  const boundary = `dott_boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const metadata = JSON.stringify({
    name: args.fileName,
    parents: [args.folderId],
  })

  const preamble =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${args.mimeType}\r\n\r\n`

  const epilogue = `\r\n--${boundary}--`

  const body = Buffer.concat([
    Buffer.from(preamble, 'utf8'),
    args.bytes,
    Buffer.from(epilogue, 'utf8'),
  ])

  const response = await fetch(
    `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name&supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Accept-Encoding': 'identity',
      },
      body,
    },
  )

  const data = (await response.json()) as {
    id?: string
    error?: { message?: string }
  }

  if (!response.ok || !data.id) {
    throw new Error(data.error?.message ?? `Failed to upload ${args.fileName} to Google Drive`)
  }

  return { id: data.id }
}

async function makeAnyoneWithLinkReader(accessToken: string, fileId: string): Promise<void> {
  await googleApiJson(
    accessToken,
    `${DRIVE_API_BASE}/files/${fileId}/permissions?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'anyone',
        role: 'reader',
      }),
    },
  )
}
