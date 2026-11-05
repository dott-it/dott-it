'use client'

import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'

interface DomainInputProps {
  domains: string[]
  onDomainsChange: (domains: string[]) => void
  label?: string
  description?: string
}

export function DomainInput({
  domains,
  onDomainsChange,
  label = 'Domains',
  description,
}: DomainInputProps) {
  const [newDomain, setNewDomain] = useState('')

  const handleAddDomain = () => {
    if (newDomain.trim() && !domains.includes(newDomain.trim())) {
      onDomainsChange([...domains.filter((d) => d.trim()), newDomain.trim()])
      setNewDomain('')
    }
  }

  const handleRemoveDomain = (index: number) => {
    onDomainsChange(domains.filter((_, i) => i !== index))
  }

  const handleDomainKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddDomain()
    }
  }

  const validDomains = domains.filter((d) => d.trim())

  return (
    <div className="space-y-2">
      <Label htmlFor="domains">{label}</Label>
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
        {validDomains.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {validDomains.map((domain, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {domain}
                <button
                  type="button"
                  onClick={() => handleRemoveDomain(index)}
                  className="ml-1 rounded-full hover:bg-destructive/20"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

