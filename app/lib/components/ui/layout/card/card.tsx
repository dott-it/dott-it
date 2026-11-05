import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'ghost'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding: _padding = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-md hover:shadow-lg transition-shadow duration-200',
        {
          'border-border': variant === 'default',
          'border-border/50 shadow-sm hover:shadow-md': variant === 'outline',
          'border-transparent shadow-none hover:shadow-sm': variant === 'ghost',
        },
        className,
      )}
      {...props}
    />
  ),
)
Card.displayName = 'Card'

export { Card }
