export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036F]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function buildItemSlug(title: string, id: string): string {
  const base = slugifyTitle(title)
  let suffix = id
  if (suffix.startsWith('template-')) {
    suffix = suffix.slice('template-'.length)
  }
  if (suffix.startsWith('opp-')) {
    suffix = suffix.slice('opp-'.length)
  }
  return base ? `${base}-${suffix}` : suffix
}
