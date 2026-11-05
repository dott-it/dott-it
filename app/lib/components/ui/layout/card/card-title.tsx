import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', size = 'lg', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn(
        'font-semibold leading-none tracking-tight',
        {
          'text-sm': size === 'sm',
          'text-base': size === 'md',
          'text-lg': size === 'lg',
          'text-xl': size === 'xl',
          'text-2xl': size === '2xl',
        },
        className,
      )}
      {...props}
    />
  ),
)
CardTitle.displayName = 'CardTitle'

export { CardTitle }
