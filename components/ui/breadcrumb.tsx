import React from 'react'
import Link from 'next/link'
import { BreadcrumbRoot } from './breadcrumbs/breadcrumb-root'
import { BreadcrumbList } from './breadcrumbs/breadcrumb-list'
import { BreadcrumbItem } from './breadcrumbs/breadcrumb-item'
import { BreadcrumbLink } from './breadcrumbs/breadcrumb-link'
import { BreadcrumbPage } from './breadcrumbs/breadcrumb-page'
import { BreadcrumbSeparator } from './breadcrumbs/breadcrumb-separator'

interface BreadcrumbItemData {
    href: string
    label: string
    isLast: boolean
}

interface BreadcrumbsProps {
    breadcrumbs: BreadcrumbItemData[]
}

export function Breadcrumb({ breadcrumbs }: BreadcrumbsProps) {
    return (
        <BreadcrumbRoot>
            <BreadcrumbList>
                {breadcrumbs.map((crumb) => (
                    <React.Fragment key={crumb.href}>
                        <BreadcrumbItem>
                            {crumb.isLast ? (
                                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink asChild>
                                    <Link href={crumb.href}>{crumb.label}</Link>
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {!crumb.isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </BreadcrumbRoot>
    );
}

// Component that can be used as a wrapper with children
export function BreadcrumbWrapper({ children }: { children: React.ReactNode }) {
  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        {children}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}

// Re-export all breadcrumb components for convenience
export { BreadcrumbList } from './breadcrumbs/breadcrumb-list'
export { BreadcrumbItem } from './breadcrumbs/breadcrumb-item'
export { BreadcrumbLink } from './breadcrumbs/breadcrumb-link'
export { BreadcrumbPage } from './breadcrumbs/breadcrumb-page'
export { BreadcrumbSeparator } from './breadcrumbs/breadcrumb-separator'

// Re-export PageHeader
export { PageHeader } from './pageHeader/page-header' 