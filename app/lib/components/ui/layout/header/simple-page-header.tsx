import * as React from 'react'
import { Typography } from '../../typography'
import { cn } from '@/app/lib/utils/utils'
import { getButtonComponent } from './button-variant-map'

interface PageHeaderAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

interface SimplePageHeaderProps {
  title: string
  description?: string
  actions?: PageHeaderAction[]
  className?: string
}

const SimplePageHeader = React.forwardRef<HTMLDivElement, SimplePageHeaderProps>(
  ({ title, description, actions = [], className }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center justify-between', className)}>
        <div>
          <Typography variant="h1">{title}</Typography>
          {description && (
            <Typography variant="body1" color="muted">
              {description}
            </Typography>
          )}
        </div>

        {actions.length > 0 && (
          <div className="flex items-center gap-3">
            {actions.map((action, index) => {
              const ButtonComponent = getButtonComponent(action.variant || 'primary')

              return (
                <ButtonComponent key={index} href={action.href} onClick={action.onClick}>
                  {action.icon}
                  {action.label}
                </ButtonComponent>
              )
            })}
          </div>
        )}
      </div>
    )
  },
)
SimplePageHeader.displayName = 'SimplePageHeader'

export { SimplePageHeader }
export type { SimplePageHeaderProps, PageHeaderAction }
