import React from 'react'
import { Loading } from './loading'
import { LoadingSkeleton } from './generic-loading-skeleton'
import { SimpleLoadingSkeleton } from './skeletons/simple-loading-skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '../card'

export function LoadingDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Loading Components</h2>
        <p className="mb-6 text-muted-foreground">
          A comprehensive loading system with multiple variants for different use cases.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="mb-4 text-xl font-semibold">Loading Variants</h3>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle size="sm">Spinner (Default)</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loading variant="spinner" size="md" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Dots</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loading variant="dots" size="md" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Pulse</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loading variant="pulse" size="md" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">With Message</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loading variant="spinner" size="md" message="Loading..." />
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Loading Sizes</h3>
          
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle size="sm">Small</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loading variant="spinner" size="sm" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Medium</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loading variant="spinner" size="md" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Large</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loading variant="spinner" size="lg" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="sm">Extra Large</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Loading variant="spinner" size="xl" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Loading Skeleton Variants</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-lg font-medium">Header Skeleton</h4>
              <Card>
                <CardContent>
                  <LoadingSkeleton variant="header" />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">Cards Skeleton</h4>
              <Card>
                <CardContent>
                  <LoadingSkeleton variant="cards" count={4} />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">List Skeleton</h4>
              <Card>
                <CardContent>
                  <LoadingSkeleton variant="list" count={3} />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">Stats Skeleton</h4>
              <Card>
                <CardContent>
                  <LoadingSkeleton variant="stats" />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">Search Skeleton</h4>
              <Card>
                <CardContent>
                  <LoadingSkeleton variant="search" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Page Loading</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-lg font-medium">Page Loading Variant</h4>
              <Card>
                <CardContent>
                  <Loading variant="page" />
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">Simple Loading Skeleton</h4>
              <Card>
                <CardContent>
                  <SimpleLoadingSkeleton />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Real-world Examples</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-lg font-medium">Full Page Loading</h4>
              <Card>
                <CardContent>
                  <div className="flex min-h-[400px] items-center justify-center">
                    <Loading 
                      variant="spinner" 
                      size="lg" 
                      message="Loading your dashboard..." 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">Button Loading State</h4>
              <Card>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground">
                      <Loading variant="dots" size="sm" />
                      <span>Saving...</span>
                    </button>
                    
                    <button className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-secondary-foreground">
                      <Loading variant="spinner" size="sm" />
                      <span>Processing...</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-medium">Content Loading</h4>
              <Card>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Loading variant="pulse" size="sm" />
                      <span className="text-sm text-muted-foreground">Loading content...</span>
                    </div>
                    
                    <div className="rounded-lg border p-4">
                      <LoadingSkeleton variant="list" count={2} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Props Reference</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>LoadingProps</CardTitle>
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
                    <code className="text-xs text-muted-foreground">{'\'spinner\' | \'dots\' | \'pulse\''}</code>
                    <span>Loading animation style</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">size</code>
                    <code className="text-xs text-muted-foreground">{'\'sm\' | \'md\' | \'lg\' | \'xl\''}</code>
                    <span>Size of the loading indicator</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">message</code>
                    <code className="text-xs text-muted-foreground">string</code>
                    <span>Optional loading message</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">className</code>
                    <code className="text-xs text-muted-foreground">string</code>
                    <span>Additional CSS classes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>LoadingSkeletonProps</CardTitle>
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
                    <code className="text-xs text-muted-foreground">{'\'header\' | \'cards\' | \'list\' | \'stats\' | \'search\' | \'custom\''}</code>
                    <span>Skeleton layout pattern</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">count</code>
                    <code className="text-xs text-muted-foreground">number</code>
                    <span>Number of skeleton items</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-2">
                    <code className="rounded bg-gray-100 px-2 py-1 text-xs">children</code>
                    <code className="text-xs text-muted-foreground">React.ReactNode</code>
                    <span>Custom content for &apos;custom&apos; variant</span>
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
          <h3 className="mb-4 text-xl font-semibold">Usage Examples</h3>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle size="md">Basic Loading</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
{`<Loading />`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="md">Loading with Message</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
{`<Loading 
  variant="spinner" 
  size="lg" 
  message="Loading your data..." 
/>`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="md">Page Skeleton</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
{`<PageLoadingSkeleton />`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle size="md">Custom Skeleton</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
{`<LoadingSkeleton 
  variant="custom"
>
  <LoadingSkeleton variant="header" />
  <LoadingSkeleton variant="cards" count={3} />
</LoadingSkeleton>`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
