'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { userQueries } from '@/app/lib/services/users/user.queries'
import { UserCreateForm } from '@/components/backoffice/users/user-create-form'
import { createUserSchema, type CreateUserFormState } from '../schemas'

type CreateUserFormErrors = Partial<Record<keyof CreateUserFormState, string>>

export default function CreateUserPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CreateUserFormState>({
    name: '',
    email: '',
    password: '',
    tenantId: '',
    role: '',
    active: true,
  })
  const [formErrors, setFormErrors] = useState<CreateUserFormErrors>({})

  const createUserMutation = userQueries.create.useMutation({
    onSuccess: () => {
      router.push('/backoffice')
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error creating user. Please try again.'
      alert(`Error creating user: ${errorMessage}`)
    },
  })

  const handleInputChange = (field: keyof CreateUserFormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const parsedResult = createUserSchema.safeParse(formData)

    if (!parsedResult.success) {
      const fieldErrors = parsedResult.error.flatten().fieldErrors
      setFormErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        tenantId: fieldErrors.tenantId?.[0],
        role: fieldErrors.role?.[0],
        active: fieldErrors.active?.[0],
      })
      return
    }

    createUserMutation.mutate({
      name: parsedResult.data.name || null,
      email: parsedResult.data.email,
      password: parsedResult.data.password || null,
      tenantId: parsedResult.data.tenantId || null,
      role: parsedResult.data.role || null,
      active: parsedResult.data.active,
    })
  }

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title="Create New User"
        subtitle="Add a new user to the system"
        breadcrumbItems={[{ label: 'Create User', isLast: true }]}
      />

      <UserCreateForm
        formData={formData}
        onFormDataChange={handleInputChange}
        onSubmit={handleSubmit}
        isSubmitting={createUserMutation.isPending}
        formErrors={formErrors}
      />
    </div>
  )
}

