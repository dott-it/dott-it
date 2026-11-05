function labelSpecificity(value: string): number {
  const isLower = value === value.toLowerCase()
  const isUpper = value === value.toUpperCase()
  if (!isLower && !isUpper) return 2
  if (!isLower) return 1
  return 0
}

/**
 * Collapse labels that differ only by case.
 * Mixed case wins over all caps, which wins over all lowercase.
 */
export function collapseCaseInsensitiveLabels(values: Iterable<string>): string[] {
  const byKey = new Map<string, string>()
  for (const raw of values) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    const current = byKey.get(key)
    if (!current || labelSpecificity(trimmed) > labelSpecificity(current)) {
      byKey.set(key, trimmed)
    }
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b))
}
