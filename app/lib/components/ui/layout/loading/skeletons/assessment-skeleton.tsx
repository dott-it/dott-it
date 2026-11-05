import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

interface AssessmentSkeletonProps {
  count?: number
  className?: string
}

const AssessmentSkeleton = React.forwardRef<HTMLDivElement, AssessmentSkeletonProps>(
  ({ count = 6, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-6', className)}>
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-64 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded bg-muted"></div>
            <div className="h-10 w-40 animate-pulse rounded bg-muted"></div>
          </div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="h-10 w-full max-w-md animate-pulse rounded bg-muted"></div>

        {/* Assessment Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                {/* Assessment Title */}
                <div className="space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-muted"></div>
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted"></div>
                </div>

                {/* Assessment Metadata */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                    <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 animate-pulse rounded bg-muted"></div>
                    <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="h-3 w-16 animate-pulse rounded bg-muted"></div>
                    <div className="h-3 w-12 animate-pulse rounded bg-muted"></div>
                  </div>
                  <div className="h-2 w-full animate-pulse rounded-full bg-muted"></div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <div className="h-8 flex-1 animate-pulse rounded bg-muted"></div>
                  <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
)
AssessmentSkeleton.displayName = 'AssessmentSkeleton'

export { AssessmentSkeleton }
export type { AssessmentSkeletonProps }
