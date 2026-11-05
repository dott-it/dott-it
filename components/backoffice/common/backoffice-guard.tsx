'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loading } from '@/app/lib/components/ui/layout'
import {
  Card,
  CardContent,
} from '@/app/lib/components/ui/layout/card'
import { Typography } from '@/app/lib/components/ui/typography'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'

interface BackofficeGuardProps {
  children: React.ReactNode
}

/**
 * Component that guards backoffice pages
 * Only users from the "dott-it" tenant can access backoffice
 */
export function BackofficeGuard({ children }: BackofficeGuardProps) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [canAccess, setCanAccess] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      if (sessionStatus === 'loading') {
        return
      }

      if (!session?.user) {
        setCanAccess(false)
        setIsChecking(false)
        return
      }

      try {
        const response = await fetch(`/api/backoffice/check-access?t=${Date.now()}`, {
          cache: 'no-store',
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })

        if (response.ok) {
          const data = await response.json()
          const hasAccess = data.canAccess === true
          setCanAccess(hasAccess)
          
          if (!hasAccess) {
            // Redirect to workspace after a short delay
            setTimeout(() => {
              router.push('/workspace')
            }, 2000)
          }
        } else {
          setCanAccess(false)
          setTimeout(() => {
            router.push('/workspace')
          }, 2000)
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error checking backoffice access:', error)
        setCanAccess(false)
        setTimeout(() => {
          router.push('/workspace')
        }, 2000)
      } finally {
        setIsChecking(false)
      }
    }

    checkAccess()
  }, [session, sessionStatus, router])

  // Show loading while checking session or access
  if (sessionStatus === 'loading' || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading variant="assessment" />
      </div>
    )
  }

  // If no access, show access denied message
  if (canAccess === false) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Typography variant="h2" className="mb-2">
              Access Denied
            </Typography>
            <Typography variant="body1" color="muted" className="mb-4">
              Backoffice access is restricted to Dott.it tenant users only.
            </Typography>
            <Typography variant="body2" color="muted" className="mb-6">
              Redirecting to workspace...
            </Typography>
            <Button.Outline onClick={() => router.push('/workspace')}>
              Go to Workspace
            </Button.Outline>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If access is granted, render children
  if (canAccess === true) {
    return <>{children}</>
  }

  // Default: show loading (shouldn't reach here)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loading variant="assessment" />
    </div>
  )
}

