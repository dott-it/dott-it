import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

interface WorkspaceSkeletonProps {
  className?: string
}

const WorkspaceSkeleton = React.forwardRef<HTMLDivElement, WorkspaceSkeletonProps>(
  ({ className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-6', className)}>
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-32 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-64 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded bg-muted"></div>
            <div className="h-10 w-40 animate-pulse rounded bg-muted"></div>
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-12 w-full max-w-md animate-pulse rounded bg-muted"></div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
                <div className="h-3 w-32 animate-pulse rounded bg-muted"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Assessment Collections */}
        <div className="space-y-6">
          {/* Live Assessments Section */}
          <div className="space-y-4">
            <div className="h-6 w-40 animate-pulse rounded bg-muted"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4">
                  <div className="space-y-3">
                    <div className="h-5 w-3/4 animate-pulse rounded bg-muted"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                    </div>
                    <div className="h-2 w-full animate-pulse rounded-full bg-muted"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Assessments Section */}
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded bg-muted"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4">
                  <div className="space-y-3">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-12 animate-pulse rounded bg-muted"></div>
                      <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                    </div>
                    <div className="h-2 w-full animate-pulse rounded-full bg-muted"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  },
)
WorkspaceSkeleton.displayName = 'WorkspaceSkeleton'

export { WorkspaceSkeleton }
export type { WorkspaceSkeletonProps }
