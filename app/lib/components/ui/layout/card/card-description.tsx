import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: 'p' | 'span' | 'div'
  size?: 'sm' | 'md' | 'lg'
  color?: 'default' | 'muted' | 'subtle'
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, as: Component = 'p', size = 'md', color = 'muted', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'leading-relaxed',
        {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
          'text-base': size === 'lg',
          'text-muted-foreground': color === 'muted',
          'text-muted-foreground/70': color === 'subtle',
        },
        className,
      )}
      {...props}
    />
  ),
)
CardDescription.displayName = 'CardDescription'

export { CardDescription }
