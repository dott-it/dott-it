import { AssessmentRecordStatus } from '@/app/types'
import { Badge } from './badge'
import { Clock, FileText, Eye, Check } from 'lucide-react'

interface StudentStatusBadgeProps {
  status: AssessmentRecordStatus
  className?: string
}

export function StudentStatusBadge({ status, className }: StudentStatusBadgeProps) {
  const getStatusInfo = (status: AssessmentRecordStatus) => {
    switch (status) {
      case 'handed_in': {
        return {
          label: 'Handed In',
          variant: 'outline' as const,
          icon: <FileText className="size-3" />,
          className:
            'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800',
        }
      }
      case 'ready_for_review': {
        return {
          label: 'Ready for Review',
          variant: 'outline' as const,
          icon: <Eye className="size-3" />,
          className:
            'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800',
        }
      }
      case 'in_progress': {
        return {
          label: 'In Progress',
          variant: 'outline' as const,
          icon: <Clock className="size-3" />,
          className:
            'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800',
        }
      }
      case 'shared': {
        return {
          label: 'Shared',
          variant: 'outline' as const,
          icon: <Check className="size-3" />,
          className:
            'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800',
        }
      }
      default: {
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          icon: null,
          className:
            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/20 dark:text-gray-300 dark:border-gray-800',
        }
      }
    }
  }

  const statusInfo = getStatusInfo(status)

  return (
    <Badge variant={statusInfo.variant} className={`${statusInfo.className} ${className || ''}`}>
      {statusInfo.icon}
      {statusInfo.icon && <span className="ml-1" />}
      {statusInfo.label}
    </Badge>
  )
}
