/**
 * Same-origin relative path for OAuth returnTo — rejects protocol-relative
 * open redirects like `//evil.example`.
 */
export function isSafeLibraryExportReturnTo(returnTo: string): boolean {
  const trimmed = returnTo.trim()
  if (!trimmed.startsWith('/')) {
    return false
  }
  if (trimmed.startsWith('//')) {
    return false
  }
  if (trimmed.includes('://')) {
    return false
  }
  if (trimmed.includes('\\')) {
    return false
  }
  return true
}

const DEFAULT_LIBRARY_EXPORT_RETURN_TO = '/library/openscied'

/**
 * Derive a safe OAuth returnTo from the request Referer.
 * Malformed Referer values must not turn a 401 into a 500.
 */
export function libraryExportReturnToFromRequest(request: Request): string {
  const referer = request.headers.get('referer')
  if (!referer) {
    return DEFAULT_LIBRARY_EXPORT_RETURN_TO
  }

  try {
    const pathname = new URL(referer).pathname
    if (isSafeLibraryExportReturnTo(pathname)) {
      return pathname
    }
  } catch {
    // ignore invalid Referer
  }

  return DEFAULT_LIBRARY_EXPORT_RETURN_TO
}
