import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Typography } from '../typography'

interface BreadcrumbItem {
  label: string
  href?: string
  isLast?: boolean
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null
  }
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
          )}
          {item.isLast ? (
            <Typography variant="body2" className="font-semibold text-foreground">
              {item.label}
            </Typography>
          ) : (
            <Link
              href={item.href || '#'}
              className="hover:text-foreground transition-colors"
            >
              <Typography variant="body2">
                {item.label}
              </Typography>
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
