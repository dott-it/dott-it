'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { UserWithTenant } from '@/types'
import { userRoleLabel } from '@/lib/user-browse'

interface UserCardProps {
  user: UserWithTenant
  /** Shown only when status can still narrow the user list. */
  showStatus?: boolean
}

export function UserCard({ user, showStatus = false }: UserCardProps) {
  const title = user.name || user.email || 'Unnamed User'

  return (
    <Link
      href={`/backoffice/users/${user.id}`}
      className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>{title}</span>
            {showStatus ? (
              <Badge variant={user.active ? 'default' : 'secondary'}>
                {user.active ? 'Active' : 'Inactive'}
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>{user.email || 'No email'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium">Role:</span>
              <span>{userRoleLabel(user.role)}</span>
            </div>
            {user.tenant ? (
              <div className="mt-1 flex items-center gap-2">
                <Users className="size-4" />
                <span>{user.tenant.name}</span>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">No tenant assigned</span>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            <div>Created: {new Date(user.createdAt).toLocaleDateString()}</div>
            {user.emailVerified ? (
              <div>Verified: {new Date(user.emailVerified).toLocaleDateString()}</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
