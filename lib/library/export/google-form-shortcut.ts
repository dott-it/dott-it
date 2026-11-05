import {
  ensureFileExtension,
  sanitizeDownloadFileName,
} from './download-drive-file'

export function googleFormShortcutFileName(label: string): string {
  const base = sanitizeDownloadFileName(label)
  const name = /^google form$/i.test(base) ? 'Google Form' : `Google Form - ${base}`
  return ensureFileExtension(name, '.txt')
}

export function googleFormShortcutContents(label: string, url: string): string {
  return `${label}\n\nOpen this Google Form:\n${url}\n`
}
