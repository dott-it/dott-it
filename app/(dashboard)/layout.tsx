'use client'
import { useSession } from "next-auth/react"
import React from 'react'
import { AppHeader } from '@/app/lib/components/ui/layout'
import { PageEventTracker } from '@/app/lib/components/events'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  if(!session?.user) {
    return null
  }

  return (
    <PageEventTracker>
      <div className="min-h-screen bg-background overflow-x-clip">
        {/* Header */}
        <AppHeader user={session.user} />

        {/* Main Content */}
        <main id="main-content" className="container mx-auto px-4 py-6">{children}</main>
      </div>
    </PageEventTracker>
  )
}
