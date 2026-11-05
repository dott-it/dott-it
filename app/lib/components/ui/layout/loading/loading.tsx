import * as React from 'react'
// Typography import removed as it's not being used
import { cn } from '@/app/lib/utils/utils'

interface LoadingProps {
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse' | 'page' | 'assessment'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  message?: string
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ variant = 'spinner', size = 'md', className, message }, ref) => {
    const sizeClasses = {
      sm: 'size-4',
      md: 'size-6',
      lg: 'size-8',
      xl: 'size-12',
    }

    const renderSpinner = () => (
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size],
        )}
      />
    )

    const renderDots = () => (
      <div className="flex space-x-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'animate-bounce rounded-full bg-primary',
              (() => {
                if (size === 'sm') return 'size-1'
                if (size === 'md') return 'size-2'
                if (size === 'lg') return 'size-3'
                return 'size-4'
              })(),
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    )

    const renderPulse = () => (
      <div className={cn('animate-pulse rounded-full bg-primary', sizeClasses[size])} />
    )

    const renderPage = () => (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-muted"></div>
            <div className="h-4 w-64 animate-pulse rounded bg-muted"></div>
          </div>
          <div className="h-10 w-40 animate-pulse rounded bg-muted"></div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted"></div>
          ))}
        </div>

        {/* Search skeleton */}
        <div className="h-10 w-full animate-pulse rounded bg-muted"></div>

        {/* Content cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted"></div>
          ))}
        </div>
      </div>
    )

    const renderAssessment = () => (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-20 animate-pulse rounded bg-muted"></div>
              <div className="space-y-2">
                <div className="h-8 w-64 animate-pulse rounded bg-muted"></div>
                <div className="h-4 w-48 animate-pulse rounded bg-muted"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-20 animate-pulse rounded bg-muted"></div>
              <div className="h-10 w-24 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        </div>

        {/* Status banner skeleton */}
        <div className="h-16 w-full animate-pulse rounded-lg bg-muted"></div>

        {/* Metadata cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted"></div>
          ))}
        </div>

        {/* Main content grid skeleton */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main column skeleton */}
          <div className="space-y-6 lg:col-span-2">
            <div className="h-96 animate-pulse rounded-lg bg-muted"></div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="h-64 animate-pulse rounded-lg bg-muted"></div>
            <div className="h-80 animate-pulse rounded-lg bg-muted"></div>
          </div>
        </div>
      </div>
    )

    const renderContent = () => {
      switch (variant) {
        case 'spinner': {
          return renderSpinner()
        }
        case 'dots': {
          return renderDots()
        }
        case 'pulse': {
          return renderPulse()
        }
        case 'page': {
          return renderPage()
        }
        case 'assessment': {
          return renderAssessment()
        }
        default: {
          return renderSpinner()
        }
      }
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={message || 'Loading'}
        className={cn(
          variant === 'page' || variant === 'assessment'
            ? 'space-y-6'
            : 'flex flex-col items-center justify-center space-y-2',
          className,
        )}
      >
        {renderContent()}
        {message && variant !== 'page' && variant !== 'assessment' && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    )
  },
)
Loading.displayName = 'Loading'

export { Loading }
export type { LoadingProps }
