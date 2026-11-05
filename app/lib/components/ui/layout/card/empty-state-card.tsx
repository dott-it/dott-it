import * as React from 'react'
import { Card, CardContent } from './index'
import { Button } from '../../buttons/button-compounds'
import { Typography } from '../../typography'
import { LucideIcon } from 'lucide-react'

interface EmptyStateCardProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}

const EmptyStateCard = React.forwardRef<HTMLDivElement, EmptyStateCardProps>(
  ({ icon: Icon, title, description, actionLabel, onAction, actionHref, ...props }, ref) => (
    <Card ref={ref} variant="ghost" className="text-center" {...props}>
      <CardContent padding="lg" className="py-12">
        {Icon && <Icon className="mx-auto mb-4 size-12 text-muted-foreground" />}
        <Typography variant="h3" className="mb-2">
          {title}
        </Typography>
        <Typography variant="body1" color="muted" className="mx-auto mb-6 max-w-sm">
          {description}
        </Typography>
        {actionLabel && (onAction || actionHref) && (
          <Button onClick={onAction} href={actionHref}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  ),
)
EmptyStateCard.displayName = 'EmptyStateCard'

export { EmptyStateCard }
