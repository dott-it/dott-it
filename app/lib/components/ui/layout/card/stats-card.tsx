import * as React from 'react'
import { Card, CardContent } from './index'
import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  iconColor?: string
  valueColor?: string
  variant?: 'default' | 'outline' | 'ghost'
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  (
    {
      title,
      value,
      description,
      icon: Icon,
      iconColor = 'text-primary',
      valueColor = 'text-primary',
      variant = 'outline',
      ...props
    },
    ref,
  ) => (
    <Card ref={ref} variant={variant} {...props}>
      <CardContent padding="md">
        <div className="mb-3 flex items-center justify-between">
          <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
          {Icon && <Icon className={`size-6 ${iconColor}`} />}
        </div>
        <div className="space-y-1">
          <div className="text-sm font-medium">{title}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
      </CardContent>
    </Card>
  ),
)
StatsCard.displayName = 'StatsCard'

export { StatsCard }
