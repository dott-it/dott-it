import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, padding = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5',
        {
          'p-2': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
        },
        className,
      )}
      {...props}
    />
  ),
)
CardHeader.displayName = 'CardHeader'

export { CardHeader }
