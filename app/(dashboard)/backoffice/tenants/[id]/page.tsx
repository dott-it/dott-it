'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { Loading } from '@/app/lib/components/ui/layout'
import { tenantQueries, tenantUsersQueries, tenantTeachersQueries } from '@/app/lib/services/tenants/tenant.queries'
import { userQueries } from '@/app/lib/services/users/user.queries'
import { TenantEditForm } from '@/components/backoffice/tenants/tenant-edit-form'
import { TenantInfoCards } from '@/components/backoffice/tenants/tenant-info-cards'
import { TenantUsersList } from '@/components/backoffice/tenants/tenant-users-list'
import { TenantTeachersSection } from '@/components/backoffice/tenants/tenant-teachers-section'
import { AddUserToTenantDialog } from '@/components/backoffice/tenants/add-user-to-tenant-dialog'
import { AddTeacherToTenantDialog } from '@/components/backoffice/tenants/add-teacher-to-tenant-dialog'
import { BackofficeEmptyState } from '@/components/backoffice/common/backoffice-empty-state'
import { BackofficeTenantActions } from '@/components/backoffice/tenants/backoffice-tenant-actions'

export default function TenantManagePage() {
  const params = useParams()
  const tenantId = params?.id as string | undefined
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isAddingTeacher, setIsAddingTeacher] = useState(false)

  // Queries
  const {
    data: tenant,
    isLoading: isLoadingTenant,
    error: tenantError,
    refetch: refetchTenant,
  } = tenantQueries.get.useQuery({
    variables: { id: tenantId || '' },
    enabled: Boolean(tenantId),
  })

  const {
    data: tenantUsersData,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = tenantUsersQueries.list.useQuery({
    variables: { tenantId: tenantId || '' },
    enabled: Boolean(tenantId && tenant),
  })

  const {
    data: tenantTeachersData,
    isLoading: isLoadingTeachers,
    refetch: refetchTeachers,
  } = tenantTeachersQueries.list.useQuery({
    variables: { tenantId: tenantId || '' },
    enabled: Boolean(tenantId && tenant),
  })

  const {
    data: allUsersResponse,
    isLoading: isLoadingAllUsers,
  } = userQueries.list.useQuery({
    enabled: isAddingUser || isAddingTeacher,
  })

  const updateTenantMutation = tenantQueries.update.useMutation({
    onSuccess: () => {
      setIsEditing(false)
      refetchTenant()
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error updating tenant. Please try again.'
      alert(`Error updating tenant: ${errorMessage}`)
    },
  })

  const updateUserMutation = userQueries.update.useMutation({
    onSuccess: () => {
      refetchTenant()
      refetchUsers()
      refetchTeachers()
      setIsAddingUser(false)
      alert('User successfully added to tenant')
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error adding user. Please try again.'
      alert(`Error adding user: ${errorMessage}`)
    },
  })

  const addTeacherMutation = tenantTeachersQueries.add.useMutation({
    onSuccess: () => {
      refetchTenant()
      refetchTeachers()
      setIsAddingTeacher(false)
      alert('Teacher successfully added to tenant')
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error adding teacher. Please try again.'
      alert(`Error adding teacher: ${errorMessage}`)
    },
  })

  const removeTeacherMutation = tenantTeachersQueries.remove.useMutation({
    onSuccess: () => {
      refetchTenant()
      refetchTeachers()
      alert('Teacher successfully removed from tenant')
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error removing teacher. Please try again.'
      alert(`Error removing teacher: ${errorMessage}`)
    },
  })

  const handleAddUser = (userId: string) => {
    if (!tenantId) {
      alert('Tenant ID is missing')
      return
    }

    const selectedUser = allUsersResponse?.users?.find((u) => u.id === userId)
    if (!selectedUser) {
      alert('Selected user not found')
      return
    }

    if (selectedUser.tenantId === tenantId) {
      alert('This user already belongs to this tenant')
      return
    }

    if (!tenant) {
      alert('Tenant information is not available')
      return
    }

    const confirmMessage = selectedUser.tenant
      ? `This user currently belongs to "${selectedUser.tenant.name}". Do you want to move them to "${tenant.name}"?`
      : `Add "${selectedUser.name || selectedUser.email}" to "${tenant.name}"?`

    if (!confirm(confirmMessage)) {
      return
    }

    updateUserMutation.mutate({
      id: userId,
      data: {
        tenantId: tenantId,
      },
    })
  }

  const handleAddTeacher = (data: {
    mode: 'existing' | 'new'
    userId?: string
    firstName?: string
    lastName?: string
    email?: string
    teacherNickname?: string
  }) => {
    if (!tenantId) return

    if (data.mode === 'existing') {
      if (!data.userId) return

      const selectedUser = allUsersResponse?.users?.find((u) => u.id === data.userId)
      if (!selectedUser) return

      const userName = selectedUser.name || selectedUser.email || 'User'
      const nameParts = userName.split(' ')
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.slice(1).join(' ') || ''

      addTeacherMutation.mutate({
        tenantId,
        userId: selectedUser.id,
        firstName,
        lastName,
        email: selectedUser.email || null,
        teacherNickname: data.teacherNickname || null,
      })
    } else {
      if (!data.firstName || !data.lastName) {
        alert('First name and last name are required')
        return
      }
      addTeacherMutation.mutate({
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        teacherNickname: data.teacherNickname || null,
      })
    }
  }

  const handleRemoveTeacher = (teacherId: string) => {
    if (
      !confirm(
        'Are you sure you want to remove this teacher from the tenant? This action cannot be undone if the teacher has no students.',
      )
    ) {
      return
    }

    if (!tenantId) return

    removeTeacherMutation.mutate({
      tenantId,
      teacherId,
    })
  }

  const handleUpdateTenant = (data: {
    name: string
    slug: string
    logo: string
    domains: string[]
  }) => {
    if (!data.name || !data.slug) {
      alert('Please fill in all required fields: Name and Slug')
      return
    }

    const slugRegex = /^[a-z0-9.-]+$/
    if (!slugRegex.test(data.slug)) {
      alert('Slug must be lowercase and contain only letters, numbers, dots, and hyphens')
      return
    }

    if (!tenantId) {
      alert('Tenant ID is missing')
      return
    }

    updateTenantMutation.mutate({
      id: tenantId,
      data: {
        name: data.name,
        slug: data.slug,
        domains: data.domains,
        logo: data.logo || undefined,
      },
    })
  }

  // Loading state
  if (isLoadingTenant) {
    return (
      <div className="space-y-6">
        <BackofficePageHeader
          title="Loading Tenant..."
          breadcrumbItems={[]}
          showBackButton={false}
        />
        <Loading variant="assessment" />
      </div>
    )
  }

  // Invalid tenant ID
  if (!tenantId) {
    return (
      <div className="space-y-6">
        <BackofficePageHeader
          title="Invalid Tenant ID"
          breadcrumbItems={[{ label: 'Tenant', isLast: true }]}
        />
        <BackofficeEmptyState
          title="Invalid Tenant ID"
          message="No tenant ID provided in the URL."
        />
      </div>
    )
  }

  // Error state
  if (!isLoadingTenant && (tenantError || !tenant)) {
    return (
      <div className="space-y-6">
        <BackofficePageHeader
          title="Tenant Not Found"
          breadcrumbItems={[{ label: 'Tenant', isLast: true }]}
        />
        <BackofficeEmptyState
          title="Tenant not found"
          message={
            tenantError
              ? (tenantError instanceof Error
                  ? tenantError.message
                  : 'An error occurred while loading the tenant.')
              : (tenantId
                  ? `The tenant with ID "${tenantId}" doesn't exist.`
                  : "The tenant you're looking for doesn't exist.")
          }
        />
      </div>
    )
  }

  // Early return if tenant is not loaded
  if (!tenant || isLoadingTenant) {
    return (
      <div className="space-y-6">
        <BackofficePageHeader
          title="Loading Tenant..."
          breadcrumbItems={[]}
          showBackButton={false}
        />
        <Loading variant="assessment" />
      </div>
    )
  }

  const users = tenantUsersData?.users || []
  const teachers = tenantTeachersData?.teachers || []
  const allUsers = allUsersResponse?.users || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackofficePageHeader
        title={tenant.name || 'Tenant Management'}
        subtitle="Manage tenant information, users, and settings"
        breadcrumbItems={[{ label: tenant.name || 'Tenant', isLast: true }]}
      />

      {/* Actions */}
      <BackofficeTenantActions
        isEditing={isEditing}
        isAddingUser={isAddingUser}
        isAddingTeacher={isAddingTeacher}
        onEdit={() => setIsEditing(true)}
        onAddUser={() => setIsAddingUser(true)}
      />

      {/* Content based on mode */}
      {isEditing && (
        <TenantEditForm
          tenant={tenant}
          onCancel={() => setIsEditing(false)}
          onSubmit={handleUpdateTenant}
          isSubmitting={updateTenantMutation.isPending}
        />
      )}
      {!isEditing && isAddingUser && (
        <AddUserToTenantDialog
          allUsers={allUsers}
          isLoading={isLoadingAllUsers}
          tenantId={tenantId}
          tenantName={tenant.name}
          onCancel={() => setIsAddingUser(false)}
          onAdd={handleAddUser}
          isAdding={updateUserMutation.isPending}
        />
      )}
      {!isEditing && !isAddingUser && isAddingTeacher && (
        <AddTeacherToTenantDialog
          allUsers={allUsers}
          existingTeachers={teachers}
          isLoading={isLoadingAllUsers}
          onCancel={() => setIsAddingTeacher(false)}
          onAdd={handleAddTeacher}
          isAdding={addTeacherMutation.isPending}
        />
      )}
      {!isEditing && !isAddingUser && !isAddingTeacher && (
        <>
          {/* Tenant Information and Statistics */}
          <TenantInfoCards tenant={tenant} users={users} teachersCount={teachers.length} />

          {/* Teachers Section */}
          <TenantTeachersSection
            teachers={teachers}
            isLoading={isLoadingTeachers}
            onAddTeacher={() => setIsAddingTeacher(true)}
            onRemoveTeacher={handleRemoveTeacher}
            isRemoving={removeTeacherMutation.isPending}
            showAddButton={true}
          />

          {/* Users List */}
          <TenantUsersList users={users} isLoading={isLoadingUsers} />
        </>
      )}
    </div>
  )
}
