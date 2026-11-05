import * as React from 'react'
import { Button } from './button'
import { GoogleIcon } from '@/app/lib/components/ui/icons'
import { cn } from '@/app/lib/utils/utils'

interface GoogleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
}

const GoogleButton = React.forwardRef<HTMLButtonElement, GoogleButtonProps>(
  ({ className, isLoading = false, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          'w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400',
          'flex items-center justify-center gap-3',
          className,
        )}
        disabled={isLoading}
        {...props}
      >
        {!isLoading && <GoogleIcon />}
        {isLoading ? 'Signing in...' : children || 'Continue with Google'}
      </Button>
    )
  },
)

GoogleButton.displayName = 'GoogleButton'

export { GoogleButton }
