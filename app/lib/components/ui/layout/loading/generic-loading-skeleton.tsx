import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

interface LoadingSkeletonProps {
  variant?: 'header' | 'cards' | 'list' | 'stats' | 'search' | 'custom'
  count?: number
  className?: string
  children?: React.ReactNode
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ variant = 'cards', count = 6, className, children }, ref) => {
    const renderHeader = () => (
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted"></div>
          <div className="h-4 w-64 animate-pulse rounded bg-muted"></div>
        </div>
        <div className="h-10 w-40 animate-pulse rounded bg-muted"></div>
      </div>
    )

    const renderCards = () => (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted"></div>
        ))}
      </div>
    )

    const renderList = () => (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="size-12 animate-pulse rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted"></div>
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted"></div>
            </div>
            <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
          </div>
        ))}
      </div>
    )

    const renderStats = () => (
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted"></div>
        ))}
      </div>
    )

    const renderSearch = () => <div className="h-10 w-full animate-pulse rounded bg-muted"></div>

    const renderContent = () => {
      switch (variant) {
        case 'header': {
          return renderHeader()
        }
        case 'cards': {
          return renderCards()
        }
        case 'list': {
          return renderList()
        }
        case 'stats': {
          return renderStats()
        }
        case 'search': {
          return renderSearch()
        }
        case 'custom': {
          return children
        }
        default: {
          return renderCards()
        }
      }
    }

    return (
      <div ref={ref} className={cn('space-y-6', className)}>
        {renderContent()}
      </div>
    )
  },
)
LoadingSkeleton.displayName = 'LoadingSkeleton'

const SimpleLoadingSkeleton = React.forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => (
    <div ref={ref} className={cn('space-y-4', className)}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-muted"></div>
      ))}
    </div>
  ),
)
SimpleLoadingSkeleton.displayName = 'SimpleLoadingSkeleton'

export { LoadingSkeleton, SimpleLoadingSkeleton }
export type { LoadingSkeletonProps }
