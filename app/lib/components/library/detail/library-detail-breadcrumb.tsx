import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbWrapper,
} from '@/components/ui/breadcrumb'
import { unitBrowsePath } from '@/lib/library/browse/paths'
import { cn } from '@/lib/utils'

const crumbLink =
  'font-bold text-[#E67E51] underline-offset-2 transition-colors hover:text-[#E67E51]/80 hover:underline'

const crumbCurrent = 'truncate font-bold text-[#E67E51] max-w-[min(100%,14rem)] sm:max-w-xs'

interface LibraryDetailBreadcrumbProps {
  grade: number
  unitCode: string
  unitTitle: string
  itemTitle: string
}

export function LibraryDetailBreadcrumb({
  grade,
  unitCode,
  unitTitle,
  itemTitle,
}: LibraryDetailBreadcrumbProps) {
  const unitLabel = `Unit ${unitCode}: ${unitTitle}`
  const unitHref = unitBrowsePath(grade, unitCode)

  return (
    <BreadcrumbWrapper>
      <BreadcrumbItem className="shrink-0">
        <BreadcrumbLink asChild>
          <Link href="/library/openscied" className={crumbLink} title="OpenSciEd Assessment Library">
            Library
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>

      <BreadcrumbSeparator className="shrink-0 text-[#E67E51]/50">
        <ChevronRight className="size-3.5" aria-hidden />
      </BreadcrumbSeparator>

      <BreadcrumbItem className="min-w-0 shrink">
        <BreadcrumbLink asChild>
          <Link
            href={unitHref}
            className={cn(crumbLink, 'max-w-[8rem] truncate sm:max-w-none')}
            title={unitLabel}
          >
            <span className="sm:hidden">Unit {unitCode}</span>
            <span className="hidden sm:inline">
              Grade {grade} · {unitLabel}
            </span>
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>

      <BreadcrumbSeparator className="shrink-0 text-[#E67E51]/50">
        <ChevronRight className="size-3.5" aria-hidden />
      </BreadcrumbSeparator>

      <BreadcrumbItem className="min-w-0">
        <BreadcrumbPage className={crumbCurrent} title={itemTitle}>
          {itemTitle}
        </BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbWrapper>
  )
}
