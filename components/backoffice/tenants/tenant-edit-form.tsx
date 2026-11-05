'use client'

import React, { useState, type FormEvent } from 'react'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/lib/components/ui/layout/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { Tenant } from '@/app/types/api/tenant'

interface TenantEditFormProps {
  tenant: Tenant
  onCancel: () => void
  onSubmit: (data: { name: string; slug: string; logo: string; domains: string[] }) => void
  isSubmitting: boolean
}

export function TenantEditForm({
  tenant,
  onCancel,
  onSubmit,
  isSubmitting,
}: TenantEditFormProps) {
  const [formData, setFormData] = useState({
    name: tenant.name || '',
    slug: tenant.slug || '',
    logo: tenant.logo || '',
  })
  const [domains, setDomains] = useState<string[]>(
    tenant.domains && tenant.domains.length > 0 ? tenant.domains : ['']
  )
  const [newDomain, setNewDomain] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddDomain = () => {
    if (newDomain.trim() && !domains.includes(newDomain.trim())) {
      setDomains([...domains.filter((d) => d.trim()), newDomain.trim()])
      setNewDomain('')
    }
  }

  const handleRemoveDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index))
  }

  const handleDomainKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddDomain()
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      domains: domains.filter((d) => d.trim()),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Tenant Information</CardTitle>
          <CardDescription>Update the details of this tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Tenant Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Cameron School District"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-destructive">*</span>
            </Label>
            <Input
              id="slug"
              placeholder="e.g., cameron-k12"
              value={formData.slug}
              onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase())}
              required
            />
            <p className="text-sm text-muted-foreground">
              A unique identifier for this tenant (lowercase, letters, numbers, dots, and hyphens only).
            </p>
          </div>

          {/* Domains */}
          <div className="space-y-2">
            <Label htmlFor="domains">Domains</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="domains"
                  placeholder="e.g., cameron.k12.wi.us"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={handleDomainKeyDown}
                />
                <Button.Outline
                  type="button"
                  onClick={handleAddDomain}
                  disabled={!newDomain.trim()}
                >
                  Add
                </Button.Outline>
              </div>
              {domains.some((d) => d.trim()) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {domains
                    .filter((d) => d.trim())
                    .map((domain, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {domain}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveDomain(
                              domains.findIndex((d, i) => d === domain && i === index),
                            )
                          }
                          className="ml-1 rounded-full hover:bg-destructive/20"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Optional: Custom domains associated with this tenant
            </p>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              type="url"
              placeholder="e.g., https://example.com/logo.png"
              value={formData.logo}
              onChange={(e) => handleInputChange('logo', e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button.Outline type="button" onClick={onCancel} className="flex-1">
              Cancel
            </Button.Outline>
            <Button.SubmitWithLoading
              isLoading={isSubmitting}
              loadingText="Saving..."
              className="flex-1"
            >
              Save Changes
            </Button.SubmitWithLoading>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

