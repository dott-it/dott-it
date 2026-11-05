import * as React from 'react'
import { Loading } from './loading'
import { cn } from '@/app/lib/utils/utils'

interface FullScreenLoadingProps {
  message?: string
  className?: string
}

const FullScreenLoading = React.forwardRef<HTMLDivElement, FullScreenLoadingProps>(
  ({ message = 'Loading...', className }, ref) => (
    <div ref={ref} className={cn('flex min-h-screen items-center justify-center', className)}>
      <Loading variant="spinner" size="lg" message={message} />
    </div>
  ),
)
FullScreenLoading.displayName = 'FullScreenLoading'

export { FullScreenLoading }
export type { FullScreenLoadingProps }
