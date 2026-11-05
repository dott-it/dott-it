import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hasHeader?: boolean
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = 'md', hasHeader = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        {
          'p-2': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
          'pt-0': hasHeader && padding === 'md',
          'pt-2': hasHeader && padding === 'sm',
          'pt-4': hasHeader && padding === 'lg',
        },
        className,
      )}
      {...props}
    />
  ),
)
CardContent.displayName = 'CardContent'

export { CardContent }
