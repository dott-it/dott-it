import type { IngestedFileRefs } from '@/lib/library/ingest/types'

/**
 * Form URL for Open / Workspace attach.
 * Prefers forms@ My Drive teacher-ready (native File upload) when present.
 */
export function libraryGoogleFormUrl(
  files: Pick<IngestedFileRefs, 'googleForm' | 'googleFormTeacherReady'>,
): string | null {
  const ready = files.googleFormTeacherReady?.trim()
  if (ready?.startsWith('http://') || ready?.startsWith('https://')) {
    return ready
  }
  const preview = files.googleForm?.trim()
  if (preview?.startsWith('http://') || preview?.startsWith('https://')) {
    return preview
  }
  return null
}

/**
 * Form URL for iframe Quick look inside the library modal.
 *
 * Prefer the Shared Drive curriculum Form: Google redirects File upload /
 * verified-email Forms to login, which cannot run inside our iframe and surfaces
 * “Não foi possível publicar o documento”.
 */
export function libraryGoogleFormEmbedUrl(
  files: Pick<IngestedFileRefs, 'googleForm' | 'googleFormTeacherReady'>,
): string | null {
  const preview = files.googleForm?.trim()
  if (preview?.startsWith('http://') || preview?.startsWith('https://')) {
    return preview
  }
  return libraryGoogleFormUrl(files)
}
