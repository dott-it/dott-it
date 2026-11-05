'use client'

import { Mail, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import type { UserWithTenant } from '@/app/types/api/user'
import { DetailItem } from '../common/detail-item'
import { DateItem } from '../common/date-item'
import { RelationItem } from '../common/relation-item'

interface BackofficeUserDetailsGridProps {
  user: UserWithTenant
}

export function BackofficeUserDetailsGrid({
  user,
}: BackofficeUserDetailsGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Main Information */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem label="Name" value={user.name || 'Not provided'} />

          <RelationItem
            label="Email"
            icon={<Mail className="size-4 text-muted-foreground" />}
            value={user.email || 'Not provided'}
            secondaryValue={
              user.emailVerified ? (
                <Badge variant="outline" className="ml-2">
                  Verified
                </Badge>
              ) : undefined
            }
          />

          <div>
            <Typography variant="caption" color="muted">
              Role
            </Typography>
            <div className="mt-1">
              {user.role ? (
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              ) : (
                <Typography variant="body1" className="text-muted-foreground">
                  No role assigned
                </Typography>
              )}
            </div>
          </div>

          <div>
            <Typography variant="caption" color="muted">
              Status
            </Typography>
            <div className="mt-1">
              <Badge variant={user.active ? 'default' : 'secondary'}>
                {user.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <RelationItem
            label="Tenant"
            icon={<Users className="size-4 text-muted-foreground" />}
            value={user.tenant?.name}
            secondaryValue={
              user.tenant ? (
                <Badge variant="outline" className="ml-2">
                  {user.tenant.slug}
                </Badge>
              ) : undefined
            }
            emptyMessage="No tenant assigned"
          />
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DetailItem
            label="User ID"
            value={<span className="font-mono text-sm">{user.id}</span>}
          />

          <DateItem
            label="Created"
            date={user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)}
          />

          <DateItem
            label="Last Updated"
            date={user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt)}
          />

          {user.image && (
            <div>
              <Typography variant="caption" color="muted">
                Profile Image
              </Typography>
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.image}
                  alt={user.name || 'User avatar'}
                  className="size-16 rounded-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

