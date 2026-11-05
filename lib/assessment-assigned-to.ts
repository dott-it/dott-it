/**
 * Format Assessment.assignedTo JSON into a short Class label for list UIs.
 */
export function formatAssignedToClass(assignedTo: unknown): string {
  if (assignedTo == null) return '—'

  if (typeof assignedTo === 'string') {
    const trimmed = assignedTo.trim()
    return trimmed.length > 0 ? trimmed : '—'
  }

  if (Array.isArray(assignedTo)) {
    const names = assignedTo
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim()
        if (entry && typeof entry === 'object' && 'name' in entry) {
          const name = (entry as { name?: unknown }).name
          return typeof name === 'string' ? name.trim() : ''
        }
        return ''
      })
      .filter(Boolean)
    return names.length > 0 ? names.join(', ') : '—'
  }

  if (typeof assignedTo === 'object' && assignedTo !== null && 'name' in assignedTo) {
    const name = (assignedTo as { name?: unknown }).name
    if (typeof name === 'string' && name.trim()) return name.trim()
  }

  return '—'
}
