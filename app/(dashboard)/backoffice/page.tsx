'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BackofficePageHeader } from '@/components/backoffice/common/backoffice-page-header'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { BackofficeHeader } from '@/components/backoffice/common/backoffice-header'
import type { BackofficeTab } from '@/components/backoffice/common/backoffice-tabs'
import {
  backofficeTabFromQuery,
  backofficeTabHref,
} from '@/components/backoffice/common/backoffice-tab-query'
import { LoadingState } from '@/components/backoffice/common/loading-state'
import UsersListComponent from './_components/users-list'
import TenantsListComponent from './_components/tenants-list'
import AssessmentListComponent from './_components/assement-list'
import AssessmentTemplateListComponent from './_components/assessment-template-list'

function AssessmentManagerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = backofficeTabFromQuery(searchParams.get('tab'))

  const handleTabChange = (tab: BackofficeTab) => {
    router.replace(backofficeTabHref(tab, searchParams.toString()), { scroll: false })
  }

  return (
    <div className="space-y-6">
      <BackofficePageHeader
        title="Backoffice"
        subtitle="Manage assessments, templates, tenants, and users"
        breadcrumbItems={[]}
        showBackButton={false}
      />

      <BackofficeHeader activeTab={activeTab} onTabChange={handleTabChange} />

      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as BackofficeTab)}
      >
        <TabsContent value="assessments">
          <AssessmentListComponent />
        </TabsContent>

        <TabsContent value="templates">
          <AssessmentTemplateListComponent />
        </TabsContent>

        <TabsContent value="tenants">
          <TenantsListComponent />
        </TabsContent>

        <TabsContent value="users">
          <UsersListComponent />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function BackofficePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AssessmentManagerPage />
    </Suspense>
  )
}
