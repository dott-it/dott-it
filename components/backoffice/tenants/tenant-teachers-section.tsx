'use client'

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Typography } from '@/app/lib/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/app/lib/components/ui/layout'
import { SmartDate } from '@/app/lib/components/ui/feedback'
import { Plus, X, Mail, GraduationCap, UserCircle } from 'lucide-react'

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  teacherNickname?: string | null
  userId?: string | null
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
  learnerCount: number
  createdAt: string
}

interface TenantTeachersSectionProps {
  teachers: Teacher[]
  isLoading: boolean
  onAddTeacher: () => void
  onRemoveTeacher: (teacherId: string) => void
  isRemoving: boolean
  showAddButton: boolean
}

export function TenantTeachersSection({
  teachers,
  isLoading,
  onAddTeacher,
  onRemoveTeacher,
  isRemoving,
  showAddButton,
}: TenantTeachersSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teachers</CardTitle>
              <CardDescription>Teachers associated with this tenant</CardDescription>
            </div>
            {showAddButton && (
              <Button.Outline onClick={onAddTeacher} size="sm">
                <Plus className="mr-2 size-4" />
                Add Teacher
              </Button.Outline>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Loading variant="assessment" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (teachers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teachers</CardTitle>
              <CardDescription>Teachers associated with this tenant</CardDescription>
            </div>
            {showAddButton && (
              <Button.Outline onClick={onAddTeacher} size="sm">
                <Plus className="mr-2 size-4" />
                Add Teacher
              </Button.Outline>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <GraduationCap className="mx-auto mb-4 size-12 text-muted-foreground" />
            <Typography variant="h3" className="mb-2">
              No teachers found
            </Typography>
            <Typography variant="body1" color="muted">
              This tenant doesn&apos;t have any teachers yet.
            </Typography>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Teachers</CardTitle>
            <CardDescription>Teachers associated with this tenant</CardDescription>
          </div>
          {showAddButton && (
            <Button.Outline onClick={onAddTeacher} size="sm">
              <Plus className="mr-2 size-4" />
              Add Teacher
            </Button.Outline>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teachers.map((teacher) => (
            <Card key={teacher.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div>
                      <Typography variant="body1" className="font-medium">
                        {teacher.teacherNickname || (`${teacher.firstName} ${teacher.lastName}`)}
                      </Typography>
                      {teacher.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Mail className="size-3" />
                          <span>{teacher.email}</span>
                        </div>
                      )}
                      {teacher.user && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <UserCircle className="size-3" />
                          <span>User: {teacher.user.name || teacher.user.email || 'N/A'}</span>
                          {teacher.user.role && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {teacher.user.role}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {teacher.user ? (
                        <Badge variant="default">
                          <UserCircle className="mr-1 size-3" />
                          Linked to User Account
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <GraduationCap className="mr-1 size-3" />
                          Teacher Only
                        </Badge>
                      )}
                      {teacher.learnerCount > 0 && (
                        <Badge variant="outline">
                          {teacher.learnerCount} {teacher.learnerCount === 1 ? 'Learner' : 'Learners'}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <div>
                        Created:{' '}
                        <SmartDate date={new Date(teacher.createdAt)} variant="relative" />
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button.Outline
                      size="sm"
                      onClick={() => onRemoveTeacher(teacher.id)}
                      disabled={isRemoving || teacher.learnerCount > 0}
                      title={
                        teacher.learnerCount > 0
                          ? 'Cannot remove teacher with students'
                          : 'Remove teacher from tenant'
                      }
                      className={
                        teacher.learnerCount === 0
                          ? 'border-destructive text-destructive hover:bg-destructive/10'
                          : ''
                      }
                    >
                      <X className="size-4" />
                    </Button.Outline>
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

