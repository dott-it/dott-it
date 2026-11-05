import React from 'react'
import { AppHeader } from '../header/app-header'
import { LoadingSkeleton } from '../loading/generic-loading-skeleton'
import { SimpleLoadingSkeleton } from '../loading/skeletons/simple-loading-skeleton'
import { Loading } from '../loading/loading'
import { FullScreenLoading } from '../loading/full-screen-loading'
import { Card, CardContent, CardHeader, CardTitle } from '../card'
import { Typography } from '../../typography'

export function DashboardDemo() {
  const mockUser = {
    name: 'John Doe',
    email: 'john.doe@example.com',
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <Typography variant="h2">Dashboard Components</Typography>
        <Typography variant="body1" color="muted">
          Reusable components for dashboard layouts and loading states.
        </Typography>
      </div>

      <div className="space-y-8">
        <div>
          <Typography variant="h3">Header</Typography>
          <Typography variant="body1" color="muted">
            A reusable header component for authenticated pages with user info and logout
            functionality.
          </Typography>
          <Card>
            <CardContent className="p-0">
              <AppHeader
                user={mockUser}
                title="Demo Dashboard"
                onLogout={() => alert('Logout clicked!')}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Typography variant="h3">Loading Skeletons</Typography>
          <Typography variant="body1" color="muted">
            Various loading skeleton patterns for different UI layouts.
          </Typography>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <Typography variant="h4">Loading (Page Variant)</Typography>
              <Typography variant="body1" color="muted">
                Complete page loading state with header, stats, and content cards.
              </Typography>
              <Card>
                <CardContent>
                  <Loading variant="page" />
                </CardContent>
              </Card>
            </div>

            <div>
              <Typography variant="h4">SimpleLoadingSkeleton</Typography>
              <Typography variant="body1" color="muted">
                Simple loading lines for basic content.
              </Typography>
              <Card>
                <CardContent>
                  <SimpleLoadingSkeleton />
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <Typography variant="h4">FullScreenLoading</Typography>
            <Typography variant="body1" color="muted">
              Full-screen loading for authentication and app initialization.
            </Typography>
            <Card>
              <CardContent className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 origin-top-left scale-50">
                  <FullScreenLoading message="Checking authentication..." />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Typography variant="h3">LoadingSkeleton Variants</Typography>
          <Typography variant="body1" color="muted">
            Configurable loading skeleton with different patterns.
          </Typography>

          <div className="grid gap-6">
            <div>
              <Typography variant="h4">Header Variant</Typography>
              <Card>
                <CardContent>
                  <LoadingSkeleton variant="header" />
                </CardContent>
              </Card>
            </div>

            <div>
              <Typography variant="h4">Cards Variant (3 items)</Typography>
              <Card>
                <CardContent>
                  <LoadingSkeleton variant="cards" count={3} />
                </CardContent>
              </Card>
            </div>

            <div>
              <Typography variant="h4">List Variant</Typography>
              <Card>
                <CardContent>
                  <LoadingSkeleton variant="list" count={4} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div>
          <Typography variant="h3">Usage Examples</Typography>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle size="md">Header Props</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-4 border-b py-2">
                    <div className="font-medium">Prop</div>
                    <div className="font-medium">Type</div>
                    <div className="font-medium">Description</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">user</code>
                    <code className="text-xs text-muted-foreground">{`{ name: string; email: string }`}</code>
                    <span>User information to display</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">title</code>
                    <code className="text-xs text-muted-foreground">string</code>
                    <span>Header title (default: &quot;Eddo Workspace v2&quot;)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">onLogout</code>
                    <code className="text-xs text-muted-foreground">{'() => void'}</code>
                    <span>Custom logout handler (optional)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="md">LoadingSkeleton Props</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-4 border-b py-2">
                    <div className="font-medium">Prop</div>
                    <div className="font-medium">Type</div>
                    <div className="font-medium">Description</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">variant</code>
                    <code className="text-xs text-muted-foreground">
                      {"'header' | 'cards' | 'list' | 'custom'"}
                    </code>
                    <span>Loading pattern variant (default: &apos;cards&apos;)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">count</code>
                    <code className="text-xs text-muted-foreground">number</code>
                    <span>Number of skeleton items (default: 6)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">className</code>
                    <code className="text-xs text-muted-foreground">string</code>
                    <span>Additional CSS classes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Typography variant="h3">Code Examples</Typography>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle size="md">Basic Dashboard Layout</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
                  {`// In your dashboard layout
                    <div className="min-h-screen bg-background">
                      <Header user={user} />
                      <main className="container mx-auto px-4 py-6">
                        {children}
                      </main>
                    </div>`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="md">Loading States</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
                  {`// For dashboard pages
                    if (loading) {
                      return <LoadingSkeleton variant="header" />
                    }

                   // For simple content
                    if (loading) {
                      return <SimpleLoadingSkeleton />
                    }

                    // For custom loading
                    if (loading) {
                      return <LoadingSkeleton variant="list" count={8} />
                    }
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
