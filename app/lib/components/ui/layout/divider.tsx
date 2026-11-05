import * as React from 'react'
import { Typography } from '../typography'
import { cn } from '@/app/lib/utils/utils'

interface DividerProps {
  children?: React.ReactNode
  className?: string
  textClassName?: string
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ children, className, textClassName }, ref) => {
    if (!children) {
      // Simple divider without text
      return (
        <div ref={ref} className={cn('flex items-center', className)}>
          <span className="w-full border-t" />
        </div>
      )
    }

    // Divider with text
    return (
      <div ref={ref} className={cn('relative', className)}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <Typography
            variant="caption"
            color="muted"
            className={cn('bg-background px-2', textClassName)}
          >
            {children}
          </Typography>
        </div>
      </div>
    )
  },
)
Divider.displayName = 'Divider'

export { Divider }
export type { DividerProps }
