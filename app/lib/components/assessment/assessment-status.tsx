import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { StatusBadge } from '@/app/lib/components/ui/feedback'
import { Typography } from '@/app/lib/components/ui/typography'
import { Assessment, type AssessmentStatus } from '@/types'
import { Play, CheckCircle } from 'lucide-react'

interface AssessmentStatusProps {
  assessment: Assessment
  onStatusChange: (newStatus: Assessment['status']) => void
  isLoading?: boolean
}

export function AssessmentStatus({
  assessment,
  onStatusChange,
  isLoading = false,
}: AssessmentStatusProps) {
  const getAvailableActions = () => {
    switch (assessment.status) {
      case 'draft': {
        return [
          {
            label: 'Start Live',
            action: () => onStatusChange('live'),
            variant: 'default' as const,
            icon: <Play className="size-4" />,
          },
        ]
      }
      case 'live': {
        return [
          {
            label: 'Set Done',
            action: () => onStatusChange('completed'),
            variant: 'outline' as const,
            icon: <CheckCircle className="size-4" />,
          },
        ]
      }
      case 'completed': {
        return [
          {
            label: 'Reopen',
            action: () => onStatusChange('live'),
            variant: 'outline' as const,
            icon: <Play className="size-4" />,
          },
        ]
      }
      default: {
        return []
      }
    }
  }

  const availableActions = getAvailableActions()

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <Typography variant="body2" color="muted">
          Status:
        </Typography>
        <StatusBadge status={assessment.status as AssessmentStatus} />
      </div>

      {availableActions.length > 0 && (
        <div className="flex gap-2">
          {availableActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.action}
              disabled={isLoading}
            >
              {action.icon}
              <span className="ml-1">{action.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
