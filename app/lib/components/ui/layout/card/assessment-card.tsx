import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './index'
import { Button } from '../../buttons/button-compounds'

interface AssessmentCardProps {
  title: string
  description?: string
  totalRecords?: number
  pendingRecords?: number
  dueDate?: string
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  href?: string
}

const AssessmentCard = React.forwardRef<HTMLDivElement, AssessmentCardProps>(
  (
    {
      title,
      description,
      totalRecords = 0,
      pendingRecords = 0,
      dueDate,
      onView,
      onEdit,
      onDelete,
      href,
      ...props
    },
    ref,
  ) => (
    <Card ref={ref} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent hasHeader>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total records:</span>
            <span className="font-medium">{totalRecords}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Pending:</span>
            <span className="font-medium text-orange-600">{pendingRecords}</span>
          </div>
          {dueDate && (
            <div className="flex justify-between text-sm">
              <span>Due date:</span>
              <span className="font-medium">{dueDate}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter hasContent align="between">
        <div className="flex gap-2">
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
        {(onView || href) && (
          <Button size="sm" onClick={onView} href={href}>
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  ),
)
AssessmentCard.displayName = 'AssessmentCard'

export { AssessmentCard }
