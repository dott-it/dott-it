import { LABEL_MAP } from "./label-map"

export interface BreadcrumbData {
  href: string
  label: string
  isLast: boolean
}

export function getBreadcrumbs(pathname: string, customLabelMap?: Record<string, string>): BreadcrumbData[] {
  const segments = pathname.split('/').filter(Boolean)

  const breadcrumbs: BreadcrumbData[] = [
    { href: '/', label: 'Home', isLast: segments.length === 0 }
  ]

  for (const [idx, segment] of segments.entries()) {
    const href = '/' + segments.slice(0, idx + 1).join('/')

    const label = customLabelMap?.[segment] || LABEL_MAP[segment] || segment.replaceAll('-', ' ').replaceAll(/\b\w/g, l => l.toUpperCase())
    breadcrumbs.push({ href, label, isLast: idx === segments.length - 1 })
  }

  return breadcrumbs
}
