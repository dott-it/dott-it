import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

interface SimpleLoadingSkeletonProps {
  className?: string
}

const SimpleLoadingSkeleton = React.forwardRef<HTMLDivElement, SimpleLoadingSkeletonProps>(
  ({ className }, ref) => (
    <div ref={ref} className={cn('space-y-4', className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-muted"></div>
      ))}
    </div>
  ),
)
SimpleLoadingSkeleton.displayName = 'SimpleLoadingSkeleton'

export { SimpleLoadingSkeleton }
export type { SimpleLoadingSkeletonProps }
