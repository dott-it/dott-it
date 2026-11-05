import { Badge } from './badge'
import { AssessmentStatus } from '@/types'
import { CheckCircle, Pause } from 'lucide-react'
import { cn } from '@/app/lib/utils/utils'

interface StatusBadgeProps {
  status: AssessmentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusInfo = (status: AssessmentStatus) => {
    switch (status) {
      case 'draft': {
        return {
          label: 'Draft',
          variant: 'secondary' as const,
          icon: null,
        }
      }
      case 'live': {
        return {
          label: 'Live',
          variant: 'default' as const,
          icon: null, // Temporarily hide Live icon as requested in #225
        }
      }
      case 'completed': {
        return {
          label: 'Completed',
          variant: 'success' as const,
          icon: <CheckCircle className="size-3" />,
        }
      }
      case 'expired': {
        return {
          label: 'Expired',
          variant: 'destructive' as const,
          icon: <Pause className="size-3" />,
        }
      }
      default: {
        return {
          label: 'Unknown',
          variant: 'secondary' as const,
          icon: null,
        }
      }
    }
  }

  const statusInfo = getStatusInfo(status)

  return (
    <Badge
      variant={statusInfo.variant}
      className={cn(
        className,
        status === 'completed' && 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
      )}
    >
      {statusInfo.icon}
      {statusInfo.icon && <span className="ml-1" />}
      {statusInfo.label}
    </Badge>
  )
}
