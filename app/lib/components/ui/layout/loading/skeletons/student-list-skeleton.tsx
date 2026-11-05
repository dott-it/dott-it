import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

interface StudentListSkeletonProps {
  count?: number
  className?: string
}

const StudentListSkeleton = React.forwardRef<HTMLDivElement, StudentListSkeletonProps>(
  ({ count = 8, className }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-6', className)}>
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-64 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-pulse rounded bg-muted"></div>
            <div className="h-10 w-32 animate-pulse rounded bg-muted"></div>
          </div>
        </div>

        {/* Progress Summary Skeleton */}
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-full animate-pulse rounded-full bg-muted"></div>
            <div className="flex justify-between text-sm">
              <div className="h-3 w-16 animate-pulse rounded bg-muted"></div>
              <div className="h-3 w-12 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted"></div>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {Array.from({ length: count }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 animate-pulse rounded-full bg-muted"></div>
                        <div className="space-y-1">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                          <div className="h-3 w-24 animate-pulse rounded bg-muted"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-6 w-20 animate-pulse rounded bg-muted"></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
          <div className="flex gap-2">
            <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
            <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
            <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
            <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
          </div>
        </div>
      </div>
    )
  },
)
StudentListSkeleton.displayName = 'StudentListSkeleton'

export { StudentListSkeleton }
export type { StudentListSkeletonProps }
