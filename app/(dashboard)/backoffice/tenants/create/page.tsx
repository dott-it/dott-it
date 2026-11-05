'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { tenantQueries } from '@/app/lib/services/tenants/tenant.queries'
import { TenantCreateForm } from '@/components/backoffice/tenants/tenant-create-form'
import { createTenantSchema, type CreateTenantFormState } from '../schemas'

type CreateTenantFormErrors = Partial<Record<keyof CreateTenantFormState, string>>

export default function CreateTenantPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CreateTenantFormState>({
    name: '',
    slug: '',
    logo: '',
  })
  const [formErrors, setFormErrors] = useState<CreateTenantFormErrors>({})
  const [domains, setDomains] = useState<string[]>([])

  const createTenantMutation = tenantQueries.create.useMutation({
    onSuccess: () => {
      router.push('/backoffice')
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Error creating tenant. Please try again.'
      alert(`Error creating tenant: ${errorMessage}`)
    },
  })

  const handleInputChange = (field: keyof CreateTenantFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    
    // Auto-generate slug from name if slug is empty
    if (field === 'name' && !formData.slug) {
      const generatedSlug = value
        .toLowerCase()
        .trim()
        .replaceAll(/[^a-z0-9\s-]/g, '')
        .replaceAll(/\s+/g, '-')
        .replaceAll(/-+/g, '-')
      setFormData((prev) => ({ ...prev, slug: generatedSlug }))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const parsedResult = createTenantSchema.safeParse(formData)

    if (!parsedResult.success) {
      const fieldErrors = parsedResult.error.flatten().fieldErrors
      setFormErrors({
        name: fieldErrors.name?.[0],
        slug: fieldErrors.slug?.[0],
        logo: fieldErrors.logo?.[0],
      })
      return
    }

    createTenantMutation.mutate({
      name: parsedResult.data.name,
      slug: parsedResult.data.slug,
      domains: domains.filter((d) => d.trim()),
      logo: parsedResult.data.logo || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title="Create New Tenant"
        subtitle="Set up a new tenant organization"
        breadcrumbItems={[{ label: 'Create Tenant', isLast: true }]}
      />

      <TenantCreateForm
        formData={formData}
            domains={domains}
        onFormDataChange={handleInputChange}
            onDomainsChange={setDomains}
        onSubmit={handleSubmit}
        isSubmitting={createTenantMutation.isPending}
        formErrors={formErrors}
      />
    </div>
  )
}

