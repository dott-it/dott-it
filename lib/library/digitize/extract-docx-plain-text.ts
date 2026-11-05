import JSZip from 'jszip'

/**
 * Plain-text extraction from a .docx (Office Open XML).
 * Does not load sharp / image pipelines — safe for Next.js API routes that only need copy.
 */
export async function extractDocxPlainText(bytes: ArrayBuffer | Uint8Array | Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(bytes)
  const documentXmlFile = zip.file('word/document.xml')
  if (!documentXmlFile) {
    throw new Error('Invalid .docx: missing word/document.xml')
  }

  const documentXml = await documentXmlFile.async('string')
  return xmlToPlainText(documentXml)
}

function xmlToPlainText(xml: string): string {
  const withBreaks = xml
    .replaceAll(/<\/w:p>/gi, '\n')
    .replaceAll(/<w:tab[^/]*\/>/gi, '\t')
    .replaceAll(/<w:br[^/]*\/>/gi, '\n')

  const withoutTags = withBreaks.replaceAll(/<[^>]+>/g, '')
  const decoded = decodeXmlEntities(withoutTags)

  return decoded
    .split('\n')
    .map((line) => line.replaceAll(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim()
}

const NAMED_XML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

function characterFromCodePoint(codePoint: number, entity: string): string {
  const valid =
    Number.isInteger(codePoint) &&
    codePoint >= 0 &&
    codePoint <= 0x10_FF_FF &&
    (codePoint < 0xD8_00 || codePoint > 0xDF_FF)
  if (valid) {
    return String.fromCodePoint(codePoint)
  }
  return entity
}

/** Decode named entities and numeric character references used by Word (`&#8217;`, `&#160;`, `&#x2019;`). */
function decodeXmlEntities(value: string): string {
  return value.replaceAll(
    /&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi,
    (entity, decimal: string | undefined, hex: string | undefined, name: string | undefined) => {
      if (decimal) {
        return characterFromCodePoint(Number(decimal), entity)
      }
      if (hex) {
        return characterFromCodePoint(Number.parseInt(hex, 16), entity)
      }
      return NAMED_XML_ENTITIES[(name ?? '').toLowerCase()] ?? entity
    },
  )
}
