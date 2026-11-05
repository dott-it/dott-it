'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Card, CardHeader } from '@/app/lib/components/ui/layout/card'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { BackofficeTabs, type BackofficeTab } from './backoffice-tabs'

interface BackofficeHeaderProps {
  activeTab: BackofficeTab
  onTabChange: (tab: BackofficeTab) => void
}

const getAddButtonText = (activeTab: BackofficeTab): string => {
  switch (activeTab) {
    case 'assessments': {
      return 'Add Assessment'
    }
    case 'templates': {
      return 'Add Template'
    }
    case 'tenants': {
      return 'Add Tenant'
    }
    case 'users': {
      return 'Add User'
    }
    default: {
      return 'Add Assessment'
    }
  }
}

export function BackofficeHeader({ activeTab, onTabChange }: BackofficeHeaderProps) {
  const getCreateLink = (): string => {
    switch (activeTab) {
      case 'assessments': {
        return '/backoffice/assessments/create'
      }
      case 'templates': {
        return '/backoffice/assessment-templates/create'
      }
      case 'tenants': {
        return '/backoffice/tenants/create'
      }
      case 'users': {
        return '/backoffice/users/create'
      }
      default: {
        return '/backoffice/assessments/create'
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <BackofficeTabs value={activeTab} onValueChange={onTabChange} />
          <Button.Primary asChild className="ml-4">
            <Link href={getCreateLink()}>
              <Plus className="mr-2 size-4" />
              {getAddButtonText(activeTab)}
            </Link>
          </Button.Primary>
        </div>
      </CardHeader>
    </Card>
  )
}



