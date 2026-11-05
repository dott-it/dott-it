'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Tenant } from '@/types'

interface TenantCardProps {
  tenant: Tenant
  /** Shown only when status can still narrow the tenant list. */
  showStatus?: boolean
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function TenantCard({ tenant, showStatus = false }: TenantCardProps) {
  const domains = tenant.domains.map((domain) => domain.trim()).filter(Boolean)

  return (
    <Link
      href={`/backoffice/tenants/${tenant.id}`}
      className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">{tenant.name}</CardTitle>
          <CardDescription>Slug: {tenant.slug}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="size-4" />
              <span>{countLabel(tenant.userCount, 'user', 'users')}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs">{countLabel(tenant.adminCount, 'admin', 'admins')}</span>
            </div>
          </div>
          {domains.length > 0 || showStatus ? (
            <div className="text-xs text-muted-foreground">
              {domains.length > 0 ? <div>Domains: {domains.join(', ')}</div> : null}
              {showStatus ? <div>Status: {tenant.status}</div> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}
