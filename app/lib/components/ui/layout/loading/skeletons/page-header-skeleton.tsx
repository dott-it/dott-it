import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

interface PageHeaderSkeletonProps {
  showActions?: boolean
  showDescription?: boolean
  className?: string
}

const PageHeaderSkeleton = React.forwardRef<HTMLDivElement, PageHeaderSkeletonProps>(
  ({ showActions = true, showDescription = true, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)}>
        {/* Breadcrumbs Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-4 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-4 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
        </div>

        {/* Header Content */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-muted"></div>
            {showDescription && (
              <div className="h-4 w-64 animate-pulse rounded bg-muted"></div>
            )}
          </div>
          {showActions && (
            <div className="flex gap-2">
              <div className="h-10 w-32 animate-pulse rounded bg-muted"></div>
              <div className="h-10 w-40 animate-pulse rounded bg-muted"></div>
            </div>
          )}
        </div>
      </div>
    )
  },
)
PageHeaderSkeleton.displayName = 'PageHeaderSkeleton'

export { PageHeaderSkeleton }
export type { PageHeaderSkeletonProps }
