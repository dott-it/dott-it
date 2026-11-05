/** Marker written into paragraph placeholders so Apps Script can find file answers. */
export const FILE_RESPONSE_MARKER = '[File response]'

/**
 * True when a Forms item title/description is a digitize file-answer placeholder.
 */
export function textHasFileResponseMarker(value: string | undefined): boolean {
  return Boolean(value?.includes(FILE_RESPONSE_MARKER))
}

/**
 * Drop the `[File response] …` hint so the native File upload item stays clean.
 */
export function stripFileResponseHint(helpText: string | undefined): string {
  if (!helpText?.trim()) {
    return ''
  }

  return helpText
    .replaceAll(new RegExp(String.raw`\n*${escapeRegExp(FILE_RESPONSE_MARKER)}[\s\S]*$`, 'gi'), '')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}
