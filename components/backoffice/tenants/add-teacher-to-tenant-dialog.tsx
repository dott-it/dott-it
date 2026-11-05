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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, UserCircle } from 'lucide-react'
import { UserWithTenant } from '@/app/types/api/user'

interface Teacher {
  id: string
  userId?: string | null
}

interface AddTeacherToTenantDialogProps {
  allUsers: UserWithTenant[]
  existingTeachers: Teacher[]
  isLoading: boolean
  onCancel: () => void
  onAdd: (data: {
    mode: 'existing' | 'new'
    userId?: string
    firstName?: string
    lastName?: string
    email?: string
    teacherNickname?: string
  }) => void
  isAdding: boolean
}

export function AddTeacherToTenantDialog({
  allUsers,
  existingTeachers,
  isLoading,
  onCancel,
  onAdd,
  isAdding,
}: AddTeacherToTenantDialogProps) {
  const [teacherFormMode, setTeacherFormMode] = useState<'existing' | 'new'>('existing')
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('')
  const [selectedUserForTeacher, setSelectedUserForTeacher] = useState<string | null>(null)
  const [newTeacherForm, setNewTeacherForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    teacherNickname: '',
  })

  const filteredUsersForTeacher = useMemo(() => {
    if (!teacherSearchQuery) return allUsers
    const query = teacherSearchQuery.toLowerCase()
    return allUsers.filter((user) => {
      const name = user.name?.toLowerCase() || ''
      const email = user.email?.toLowerCase() || ''
      const tenantName = user.tenant?.name?.toLowerCase() || ''
      return name.includes(query) || email.includes(query) || tenantName.includes(query)
    })
  }, [allUsers, teacherSearchQuery])

  const handleAdd = () => {
    if (teacherFormMode === 'existing') {
      if (selectedUserForTeacher) {
        onAdd({
          mode: 'existing',
          userId: selectedUserForTeacher,
        })
      }
    } else {
      if (newTeacherForm.firstName && newTeacherForm.lastName) {
        onAdd({
          mode: 'new',
          firstName: newTeacherForm.firstName,
          lastName: newTeacherForm.lastName,
          email: newTeacherForm.email || undefined,
          teacherNickname: newTeacherForm.teacherNickname || undefined,
        })
      }
    }
  }

  const handleCancel = () => {
    setSelectedUserForTeacher(null)
    setTeacherSearchQuery('')
    setNewTeacherForm({ firstName: '', lastName: '', email: '', teacherNickname: '' })
    setTeacherFormMode('existing')
    onCancel()
  }

  const isFormValid =
    teacherFormMode === 'existing'
      ? Boolean(selectedUserForTeacher)
      : Boolean(newTeacherForm.firstName && newTeacherForm.lastName)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Teacher to Tenant</CardTitle>
        <CardDescription>
          Add a teacher to this tenant by associating an existing user or creating a new teacher
          record.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={teacherFormMode} onValueChange={(value) => setTeacherFormMode(value as 'existing' | 'new')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Add Existing User</TabsTrigger>
            <TabsTrigger value="new">Create New Teacher</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teacher-search">Search Users</Label>
              <Input
                id="teacher-search"
                placeholder="Search by name, email, or tenant..."
                value={teacherSearchQuery}
                onChange={(e) => setTeacherSearchQuery(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="py-12 text-center">
                <Loading variant="assessment" />
              </div>
            ) : (
              filteredUsersForTeacher.length === 0 ? (
                <div className="py-12 text-center">
                  <UserCircle className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <Typography variant="h3" className="mb-2">
                    No users found
                  </Typography>
                  <Typography variant="body1" color="muted">
                    {teacherSearchQuery ? 'Try a different search term' : 'No users are available in the system'}
                  </Typography>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsersForTeacher.map((user) => {
                  const existingTeacherForUser = existingTeachers.find((t) => t.userId === user.id)
                  const isSelected = selectedUserForTeacher === user.id

                  return (
                    <Card
                      key={user.id}
                      role="button"
                      tabIndex={existingTeacherForUser ? -1 : 0}
                      aria-pressed={isSelected}
                      aria-disabled={Boolean(existingTeacherForUser)}
                      aria-label={
                        existingTeacherForUser
                          ? `${user.name || 'User'} is already a teacher in this tenant`
                          : `Select ${user.name || 'user'} as teacher for this tenant`
                      }
                      className={`border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : (existingTeacherForUser
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:border-primary/50')
                      }`}
                      onClick={() => {
                        if (!existingTeacherForUser) {
                          setSelectedUserForTeacher(user.id)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (existingTeacherForUser) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedUserForTeacher(user.id)
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
                                {existingTeacherForUser && (
                                  <Badge variant="secondary">Already a teacher in this tenant</Badge>
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
                          {!existingTeacherForUser && (
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
              )
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g., John"
                  value={newTeacherForm.firstName}
                  onChange={(e) =>
                    setNewTeacherForm((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="e.g., Doe"
                  value={newTeacherForm.lastName}
                  onChange={(e) =>
                    setNewTeacherForm((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teacherNickname">Teacher Nickname</Label>
                <Input
                  id="teacherNickname"
                  placeholder="e.g., Mr. Doe"
                  value={newTeacherForm.teacherNickname}
                  onChange={(e) =>
                    setNewTeacherForm((prev) => ({ ...prev, teacherNickname: e.target.value }))
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Optional: Preferred display name (e.g., &quot;Ms. Johnson&quot;)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john.doe@example.com"
                  value={newTeacherForm.email}
                  onChange={(e) =>
                    setNewTeacherForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
                <p className="text-sm text-muted-foreground">Optional: Email address for the teacher</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button.Outline type="button" onClick={handleCancel} className="flex-1">
            Cancel
          </Button.Outline>
          <Button.Primary onClick={handleAdd} disabled={!isFormValid || isAdding} className="flex-1">
            {isAdding
              ? 'Adding...'
              : (teacherFormMode === 'existing'
                ? 'Add User as Teacher'
                : 'Create Teacher')}
          </Button.Primary>
        </div>
      </CardContent>
    </Card>
  )
}

