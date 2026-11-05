'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, GraduationCap, UserCircle } from 'lucide-react'
import { Tenant } from '@/app/types/api/tenant'

interface TenantUser {
  id: string
  role?: string | null
  teacher?: { id: string } | null
}

interface TenantInfoCardsProps {
  tenant: Tenant
  users: TenantUser[]
  teachersCount: number
}

export function TenantInfoCards({ tenant, users, teachersCount }: TenantInfoCardsProps) {
  return (
    <>
      {/* Tenant Information and Statistics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Main Information */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Typography variant="caption" color="muted">
                Name
              </Typography>
              <Typography variant="body1" className="mt-1">
                {tenant.name}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" color="muted">
                Slug
              </Typography>
              <Typography variant="body1" className="mt-1 font-mono text-sm">
                {tenant.slug}
              </Typography>
            </div>

            {tenant.domains && tenant.domains.length > 0 && (
              <div>
                <Typography variant="caption" color="muted">
                  Domains
                </Typography>
                <div className="mt-1 flex flex-wrap gap-2">
                  {tenant.domains.map((domain, index) => (
                    <Badge key={index} variant="secondary">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {tenant.logo && (
              <div>
                <Typography variant="caption" color="muted">
                  Logo URL
                </Typography>
                <Typography variant="body1" className="mt-1 break-all text-sm">
                  {tenant.logo}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Typography variant="caption" color="muted">
                Total Users
              </Typography>
              <Typography variant="body1" className="mt-1">
                {Math.max(tenant.userCount || 0, users.length)}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" color="muted">
                Administrators
              </Typography>
              <Typography variant="body1" className="mt-1">
                {Math.max(
                  tenant.adminCount || 0,
                  users.some((u) => u.role === 'admin')
                    ? users.filter((u) => u.role === 'admin').length
                    : 0,
                )}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" color="muted">
                Status
              </Typography>
              <div className="mt-1">
                <Badge variant="default">{tenant.status || 'active'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="size-6 text-primary" />
              </div>
              <div>
                <Typography variant="caption" color="muted">
                  Total Users
                </Typography>
                <Typography variant="h3">{users.length}</Typography>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10">
                <Shield className="size-6 text-blue-500" />
              </div>
              <div>
                <Typography variant="caption" color="muted">
                  Administrators
                </Typography>
                <Typography variant="h3">
                  {users.filter((u) => u.role === 'admin').length}
                </Typography>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10">
                <GraduationCap className="size-6 text-green-500" />
              </div>
              <div>
                <Typography variant="caption" color="muted">
                  Teachers
                </Typography>
                <Typography variant="h3">{teachersCount}</Typography>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-purple-500/10">
                <UserCircle className="size-6 text-purple-500" />
              </div>
              <div>
                <Typography variant="caption" color="muted">
                  Regular Users
                </Typography>
                <Typography variant="h3">
                  {users.filter((u) => !u.role && !u.teacher).length}
                </Typography>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

