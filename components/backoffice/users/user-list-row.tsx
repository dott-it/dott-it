'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { UserWithTenant } from '@/types'
import { userRoleLabel } from '@/lib/user-browse'

interface UserListRowProps {
  user: UserWithTenant
  /** Shown only when status can still narrow the user list. */
  showStatus?: boolean
}

export function UserListRow({ user, showStatus = false }: UserListRowProps) {
  return (
    <Link
      href={`/backoffice/users/${user.id}`}
      className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium text-foreground">
          {user.name || user.email || 'Unnamed User'}
        </p>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {user.email || 'No email'}
          {user.tenant?.name ? ` · ${user.tenant.name}` : ' · No tenant'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {showStatus ? (
          <Badge variant={user.active ? 'default' : 'secondary'}>
            {user.active ? 'Active' : 'Inactive'}
          </Badge>
        ) : null}
        <Badge variant="outline">{userRoleLabel(user.role)}</Badge>
      </div>
    </Link>
  )
}
