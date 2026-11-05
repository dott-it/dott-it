import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './index'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/app/lib/utils/utils'

interface AlertCardProps {
  variant?: 'success' | 'warning' | 'error' | 'info'
  title: string
  description?: string
  icon?: LucideIcon
  children?: React.ReactNode
}

const AlertCard = React.forwardRef<HTMLDivElement, AlertCardProps>(
  ({ variant = 'info', title, description, icon: Icon, children, ...props }, ref) => {
    const variantStyles = {
      success: {
        card: 'border-green-200 bg-green-50',
        icon: 'text-green-600',
        title: 'text-green-800',
        description: 'text-green-700',
      },
      warning: {
        card: 'border-yellow-200 bg-yellow-50',
        icon: 'text-yellow-600',
        title: 'text-yellow-800',
        description: 'text-yellow-700',
      },
      error: {
        card: 'border-red-200 bg-red-50',
        icon: 'text-red-600',
        title: 'text-red-800',
        description: 'text-red-700',
      },
      info: {
        card: 'border-blue-200 bg-blue-50',
        icon: 'text-blue-600',
        title: 'text-blue-800',
        description: 'text-blue-700',
      },
    }

    const styles = variantStyles[variant]

    return (
      <Card ref={ref} variant="outline" className={cn('w-full', styles.card)} {...props}>
        <CardHeader padding="sm">
          <div className="flex items-center gap-2">
            {Icon && <Icon className={cn('h-5 w-5', styles.icon)} />}
            <CardTitle size="md" className={styles.title}>
              {title}
            </CardTitle>
          </div>
          {description && (
            <CardDescription color="subtle" className={styles.description}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
        {children && (
          <CardContent padding="sm" hasHeader>
            {children}
          </CardContent>
        )}
      </Card>
    )
  },
)
AlertCard.displayName = 'AlertCard'

export { AlertCard }
