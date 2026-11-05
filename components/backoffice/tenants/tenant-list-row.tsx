'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { Tenant } from '@/types'

interface TenantListRowProps {
  tenant: Tenant
  /** Shown only when status can still narrow the tenant list. */
  showStatus?: boolean
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function TenantListRow({ tenant, showStatus = false }: TenantListRowProps) {
  const visibleDomains = tenant.domains.map((domain) => domain.trim()).filter(Boolean)

  return (
    <Link
      href={`/backoffice/tenants/${tenant.id}`}
      className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium text-foreground">{tenant.name}</p>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {tenant.slug}
          {visibleDomains.length > 0 ? ` · ${visibleDomains.join(', ')}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {showStatus ? <Badge variant="secondary">{tenant.status}</Badge> : null}
        <Badge variant="outline">{countLabel(tenant.userCount, 'user', 'users')}</Badge>
        <Badge variant="outline">{countLabel(tenant.adminCount, 'admin', 'admins')}</Badge>
      </div>
    </Link>
  )
}
