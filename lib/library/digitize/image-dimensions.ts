export interface ImagePixelSize {
  width: number
  height: number
}

/** Read width/height from PNG or JPEG bytes without extra dependencies. */
export function readRasterImageSize(bytes: Buffer, mimeType: string): ImagePixelSize | null {
  if (mimeType === 'image/png') {
    return readPngSize(bytes)
  }
  if (mimeType === 'image/jpeg') {
    return readJpegSize(bytes)
  }
  return null
}

function readPngSize(bytes: Buffer): ImagePixelSize | null {
  // PNG signature + IHDR chunk: width/height are big-endian at offsets 16 and 20.
  if (bytes.length < 24) {
    return null
  }
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
    return null
  }
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  if (width < 1 || height < 1) {
    return null
  }
  return { width, height }
}

function readJpegSize(bytes: Buffer): ImagePixelSize | null {
  if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
    return null
  }

  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xFF) {
      offset += 1
      continue
    }
    const marker = bytes[offset + 1]
    // Soften / start-of-frame markers carry dimensions.
    const isSof =
      (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF)
    if (isSof) {
      const height = bytes.readUInt16BE(offset + 5)
      const width = bytes.readUInt16BE(offset + 7)
      if (width < 1 || height < 1) {
        return null
      }
      return { width, height }
    }
    if (marker === 0xD9 || marker === 0xDA) {
      break
    }
    const length = bytes.readUInt16BE(offset + 2)
    if (length < 2) {
      break
    }
    offset += 2 + length
  }
  return null
}
