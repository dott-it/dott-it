'use client'

import { FileText, ClipboardList, Users, UserCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { BackofficeTab } from './backoffice-tab-query'

export type { BackofficeTab } from './backoffice-tab-query'

interface BackofficeTabsProps {
  value: BackofficeTab
  onValueChange: (value: BackofficeTab) => void
}

export function BackofficeTabs({ value, onValueChange }: BackofficeTabsProps) {
  const handleValueChange = (newValue: string) => {
    onValueChange(newValue as BackofficeTab)
  }

  return (
    <Tabs value={value} onValueChange={handleValueChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="assessments" className="flex items-center gap-2">
          <FileText className="size-4" />
          Assessments
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <ClipboardList className="size-4" />
          Templates
        </TabsTrigger>
        <TabsTrigger value="tenants" className="flex items-center gap-2">
          <Users className="size-4" />
          Tenants
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center gap-2">
          <UserCircle className="size-4" />
          Users
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}



