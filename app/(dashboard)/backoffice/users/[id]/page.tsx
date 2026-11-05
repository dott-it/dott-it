'use client'

import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { Loading } from '@/app/lib/components/ui/layout'
import { userQueries } from '@/app/lib/services/users/user.queries'
import { tenantQueries } from '@/app/lib/services/tenants/tenant.queries'
import { UserEditForm } from '@/components/backoffice/users/user-edit-form'
import { BackofficeEmptyState } from '@/components/backoffice/common/backoffice-empty-state'
import { BackofficeUserDetailsGrid } from '@/components/backoffice/users/backoffice-user-details-grid'
import { BackofficeUserActions } from '@/components/backoffice/users/backoffice-user-actions'

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    tenantId: '',
    role: '',
    active: true,
  })

  // Queries
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = userQueries.get.useQuery({
    variables: { id: userId },
    enabled: Boolean(userId),
  })

  const { data: tenants } = tenantQueries.list.useQuery()

  const updateUserMutation = userQueries.update.useMutation({
    onSuccess: () => {
      setIsEditing(false)
      refetchUser()
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error updating user. Please try again.'
      alert(`Error updating user: ${errorMessage}`)
    },
  })

  const toggleActiveMutation = userQueries.update.useMutation({
    onSuccess: () => {
      refetchUser()
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error updating user status. Please try again.'
      alert(`Error updating user status: ${errorMessage}`)
    },
  })

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        tenantId: user.tenantId || '',
        role: user.role || '',
        active: user.active ?? true,
      })
    }
  }, [user])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    updateUserMutation.mutate({
      id: userId,
      data: {
        tenantId: formData.tenantId || null,
        role: formData.role || null,
        active: formData.active,
      },
    })
  }

  const handleToggleActive = async (nextActive: boolean) => {
    toggleActiveMutation.mutate({
      id: userId,
      data: { active: nextActive },
    })
  }

  if (isLoadingUser) {
    return (
      <div className="space-y-6">
        <BackofficePageHeader
          title="Loading User..."
          breadcrumbItems={[]}
          showBackButton={false}
        />
        <Loading variant="assessment" />
      </div>
    )
  }

  if (!isLoadingUser && (!user || userError)) {
    return (
      <div className="space-y-6">
        <BackofficePageHeader
          title="User Not Found"
          breadcrumbItems={[{ label: 'User', isLast: true }]}
        />
        <BackofficeEmptyState
          title="User not found"
          message="The user you're looking for doesn't exist."
        />
      </div>
    )
  }

  // TypeScript guard: user is guaranteed to be defined at this point
  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackofficePageHeader
        title={user.name || user.email || 'User Management'}
        subtitle="View and manage user information"
        breadcrumbItems={[
          { label: 'Users', href: '/backoffice?tab=users' },
          { label: user.name || user.email || 'User', isLast: true },
        ]}
        showBackButton={true}
        onBack={() => router.push('/backoffice')}
        backButtonText="Back to Backoffice"
      />

      {/* Actions */}
      <BackofficeUserActions
        isEditing={isEditing}
        userActive={user.active ?? true}
        onEdit={() => setIsEditing(true)}
        onToggleActive={handleToggleActive}
        isTogglingActive={toggleActiveMutation.isPending}
        userName={user.name}
        userEmail={user.email}
      />

      {/* User Details/Edit Form */}
      {isEditing ? (
        <UserEditForm
          formData={formData}
          tenants={tenants || []}
          onFormDataChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsEditing(false)
            if (user) {
              setFormData({
                tenantId: user.tenantId || '',
                role: user.role || '',
                active: user.active ?? true,
              })
            }
          }}
          isSubmitting={updateUserMutation.isPending}
        />
      ) : (
        user && <BackofficeUserDetailsGrid user={user} />
      )}
    </div>
  )
}

