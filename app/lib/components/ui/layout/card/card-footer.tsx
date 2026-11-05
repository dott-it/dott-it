import * as React from 'react'
import { cn } from '@/app/lib/utils/utils'

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hasContent?: boolean
  align?: 'left' | 'center' | 'right' | 'between'
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, padding = 'md', hasContent = false, align = 'left', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center',
        {
          'p-2': padding === 'sm',
          'p-4': padding === 'md',
          'p-6': padding === 'lg',
          'pt-0': hasContent && padding === 'md',
          'pt-2': hasContent && padding === 'sm',
          'pt-4': hasContent && padding === 'lg',
          'justify-start': align === 'left',
          'justify-center': align === 'center',
          'justify-end': align === 'right',
          'justify-between': align === 'between',
        },
        className,
      )}
      {...props}
    />
  ),
)
CardFooter.displayName = 'CardFooter'

export { CardFooter }
