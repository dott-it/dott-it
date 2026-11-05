'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/app/lib/components/ui/layout'
import { SmartDate } from '@/app/lib/components/ui/feedback'
import { Mail, Users, GraduationCap } from 'lucide-react'

interface TenantUser {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
  emailVerified?: Date | null
  createdAt: Date
  teacher?: {
    id: string
    firstName: string
    lastName: string
    teacherNickname?: string | null
  } | null
  learnerCount: number
}

interface TenantUsersListProps {
  users: TenantUser[]
  isLoading: boolean
}

export function TenantUsersList({ users, isLoading }: TenantUsersListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Complete list of users associated with this tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Loading variant="assessment" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Complete list of users associated with this tenant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 size-12 text-muted-foreground" />
            <Typography variant="h3" className="mb-2">
              No users found
            </Typography>
            <Typography variant="body1" color="muted">
              This tenant doesn&apos;t have any users yet.
            </Typography>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>Complete list of users associated with this tenant</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div>
                      <Typography variant="body1" className="font-medium">
                        {user.name || 'Unknown User'}
                      </Typography>
                      {user.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Mail className="size-3" />
                          <span>{user.email}</span>
                          {user.emailVerified && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {user.role && (
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      )}
                      {user.teacher && (
                        <Badge variant="outline">
                          <GraduationCap className="mr-1 size-3" />
                          Teacher:{' '}
                          {user.teacher.teacherNickname ||
                            (`${user.teacher.firstName} ${user.teacher.lastName}`)}
                        </Badge>
                      )}
                      {user.learnerCount > 0 && (
                        <Badge variant="outline">
                          {user.learnerCount} {user.learnerCount === 1 ? 'Learner' : 'Learners'}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div>
                        Created:{' '}
                        <SmartDate date={new Date(user.createdAt)} variant="relative" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

