'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '../../buttons/button'
import { Typography } from '../../typography'
import { LogOut, User, Settings, ChevronDown, BookOpen } from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LIBRARY_OPENSCI_ED_HREF } from '@/lib/library/browse/library-workspace-nav'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  user: {
    name?: string | null | undefined
    email?: string | null | undefined
  }
  title?: string
  onLogout?: () => void
}

const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(
  ({ user, title = 'Dott.it', onLogout }, ref) => {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [canAccessBackoffice, setCanAccessBackoffice] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(true)

    const planActive = pathname === '/workspace'
    const assessmentsActive =
      pathname.startsWith('/workspace/assessments') && !pathname.includes('/create')

    React.useEffect(() => {
      const checkBackofficeAccess = async () => {
        // Always reset state when checking
        setCanAccessBackoffice(false)
        setIsLoading(true)

        if (!session?.user?.tenantId) {
          setIsLoading(false)
          return
        }

        try {
          // Add cache: 'no-store' and timestamp to prevent caching
          const response = await fetch(`/api/backoffice/check-access?t=${Date.now()}`, {
            cache: 'no-store',
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
            },
          })
          
          if (response.ok) {
            const data = await response.json()
            // STRICT check - only true if explicitly true
            const hasAccess = data.canAccess === true
            setCanAccessBackoffice(hasAccess)
          } else {
            setCanAccessBackoffice(false)
          }
        } catch (error) {
          // Error fetching access, no access
          setCanAccessBackoffice(false)
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('[HEADER] Error checking backoffice access:', error)
          }
        } finally {
          setIsLoading(false)
        }
      }

      // Only check if we have a session
      if (session) {
        checkBackofficeAccess()
      } else {
        setIsLoading(false)
      }
    }, [session?.user?.tenantId, session])

    const handleLogout = () => {
      if (onLogout) {
        onLogout()
      } else {
        // Default logout behavior - redirect to login page
        signOut({ callbackUrl: '/login' })
      }
    }

    return (
      <header ref={ref} className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/workspace" className="flex items-center gap-2.5">
              <Image
                src="/dottit-logo.png"
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-md object-contain"
                priority
              />
              <Typography variant="h1" component="span" color="primary" fontWeight="bold" className="font-fredoka">
                {title}
              </Typography>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Workspace">
              <Link
                href="/workspace"
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  planActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-current={planActive ? 'page' : undefined}
              >
                Plan
              </Link>
              <Link
                href="/workspace/assessments"
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  assessmentsActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-current={assessmentsActive ? 'page' : undefined}
              >
                Assessments
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="size-4" />
                  <Typography variant="body2" color="muted" component="span">
                    {user.name || user.email || 'User'}
                  </Typography>
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name || 'User'}</span>
                    {user.email && (
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={LIBRARY_OPENSCI_ED_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="size-4" />
                    Assessment Library
                  </Link>
                </DropdownMenuItem>
                {!isLoading && canAccessBackoffice && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/backoffice" className="flex items-center gap-2">
                        <Settings className="size-4" />
                        Backoffice
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    )
  },
)
AppHeader.displayName = 'AppHeader'

export { AppHeader }
export type { AppHeaderProps }
