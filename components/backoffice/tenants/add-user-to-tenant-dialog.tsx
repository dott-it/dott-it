'use client'

import React, { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Typography } from '@/app/lib/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/app/lib/components/ui/layout'
import { Mail, Users } from 'lucide-react'
import { UserWithTenant } from '@/app/types/api/user'

interface AddUserToTenantDialogProps {
  allUsers: UserWithTenant[]
  isLoading: boolean
  tenantId: string
  tenantName?: string
  onCancel: () => void
  onAdd: (userId: string) => void
  isAdding: boolean
}

export function AddUserToTenantDialog({
  allUsers,
  isLoading,
  tenantId,
  tenantName: _tenantName,
  onCancel,
  onAdd,
  isAdding,
}: AddUserToTenantDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return allUsers
    const query = searchQuery.toLowerCase()
    return allUsers.filter((user) => {
      const name = user.name?.toLowerCase() || ''
      const email = user.email?.toLowerCase() || ''
      const tenantName = user.tenant?.name?.toLowerCase() || ''
      return name.includes(query) || email.includes(query) || tenantName.includes(query)
    })
  }, [allUsers, searchQuery])

  const handleAdd = () => {
    if (selectedUserId) {
      onAdd(selectedUserId)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Add User to Tenant</CardTitle>
          <CardDescription>
            Select a user from the list below to add them to this tenant. If the user already
            belongs to another tenant, they will be moved to this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Loading variant="assessment" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add User to Tenant</CardTitle>
        <CardDescription>
          Select a user from the list below to add them to this tenant. If the user already
          belongs to another tenant, they will be moved to this tenant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="user-search">Search Users</Label>
          <Input
            id="user-search"
            placeholder="Search by name, email, or tenant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 size-12 text-muted-foreground" />
            <Typography variant="h3" className="mb-2">
              No users found
            </Typography>
            <Typography variant="body1" color="muted">
              {searchQuery ? 'Try a different search term' : 'No users are available in the system'}
            </Typography>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => {
              const isCurrentTenant = user.tenantId === tenantId
              const isSelected = selectedUserId === user.id

              return (
                <Card
                  key={user.id}
                  role="button"
                  tabIndex={isCurrentTenant ? -1 : 0}
                  aria-disabled={isCurrentTenant}
                  aria-pressed={isSelected}
                  aria-label={
                    isCurrentTenant
                      ? `${user.name || 'User'} already in this tenant`
                      : `Select user ${user.name || user.email || user.id}`
                  }
                  className={`border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : (isCurrentTenant
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-primary/50')
                  }`}
                  onClick={() => {
                    if (!isCurrentTenant) {
                      setSelectedUserId(user.id)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (isCurrentTenant) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedUserId(user.id)
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Typography variant="body1" className="font-medium">
                              {user.name || 'Unknown User'}
                            </Typography>
                            {isSelected && <Badge variant="default">Selected</Badge>}
                            {isCurrentTenant && (
                              <Badge variant="secondary">Already in this tenant</Badge>
                            )}
                          </div>
                          {user.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <Mail className="size-3" />
                              <span>{user.email}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {user.role && (
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          )}
                          {user.tenant ? (
                            <Badge variant="outline">Tenant: {user.tenant.name}</Badge>
                          ) : (
                            <Badge variant="outline">No tenant assigned</Badge>
                          )}
                        </div>
                      </div>
                      {!isCurrentTenant && (
                        <div className="ml-4">
                          {isSelected ? (
                            <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              ✓
                            </div>
                          ) : (
                            <div className="flex size-6 items-center justify-center rounded-full border-2 border-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button.Outline type="button" onClick={onCancel} className="flex-1">
            Cancel
          </Button.Outline>
          <Button.Primary
            onClick={handleAdd}
            disabled={!selectedUserId || isAdding}
            className="flex-1"
          >
            {isAdding ? 'Adding...' : 'Add User to Tenant'}
          </Button.Primary>
        </div>
      </CardContent>
    </Card>
  )
}

