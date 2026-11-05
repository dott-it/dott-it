import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { GenericPageHeader } from '@/app/lib/components/ui/layout'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { Assessment } from '@/types'
import { Download, QrCode, Play } from 'lucide-react'

interface AssessmentHeaderProps {
  assessment: Assessment
  onBack: () => void
  onExport: () => void
  onLiveCollection: () => void
  onStatusChange?: (newStatus: Assessment['status']) => void
  isStatusUpdating?: boolean
  showHandoutInHeader?: boolean
  showExportInHeader?: boolean
}

export function AssessmentHeader({
  assessment,
  onExport,
  onLiveCollection,
  onStatusChange,
  isStatusUpdating = false,
  showHandoutInHeader = true,
  showExportInHeader = true,
}: AssessmentHeaderProps) {
  const breadcrumbItems = [
    { label: 'Workspace', href: '/workspace' },
    { label: 'Assessments', href: '/workspace/assessments' },
    { label: assessment?.title ?? 'Assessment', isLast: true },
  ]

  const unitLabel = assessment.unitName?.trim() ?? ''
  const gradeLabel = assessment.grade ? `Grade ${assessment.grade}` : ''
  const subtitle = [unitLabel, gradeLabel].filter(Boolean).join(' • ')

  const subtitleWithStatus = (
    <div className="flex items-center gap-2">
      <span>{subtitle}</span>
      {/* StatusBadge temporarily removed as requested in #225 */}
    </div>
  )

  const getStatusAction = () => {
    if (!onStatusChange) return null

    switch (assessment.status) {
      case 'draft': {
        return {
          label: 'Start Live',
          action: () => onStatusChange('live'),
          variant: 'default' as const,
          icon: <Play className="size-4" />,
        }
      }
      case 'live': {
        // Temporarily hide "Set Done" button as requested in #225
        return null
        // return {
        //   label: 'Set Done',
        //   action: () => onStatusChange('completed'),
        //   variant: 'outline' as const,
        //   icon: <CheckCircle className="size-4" />,
        // }
      }
      case 'completed': {
        return {
          label: 'Reopen',
          action: () => onStatusChange('live'),
          variant: 'outline' as const,
          icon: <Play className="size-4" />,
        }
      }
      default: {
        return null
      }
    }
  }

  const statusAction = getStatusAction()

  const hasAnyAction = statusAction || showExportInHeader || showHandoutInHeader

  const actions = hasAnyAction ? (
    <Card className="w-full self-start p-2 lg:w-auto">
      <CardContent className="p-0">
        <div className="space-y-2">
          {/* Top row: Status Action and optionally Export */}
          {(statusAction || showExportInHeader) && (
            <div className={statusAction && showExportInHeader ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 gap-2'}>
              {statusAction && (
                <Button
                  variant={statusAction.variant}
                  size="sm"
                  onClick={statusAction.action}
                  disabled={isStatusUpdating}
                >
                  {statusAction.icon}
                  <span className="ml-1">{statusAction.label}</span>
                </Button>
              )}
              {showExportInHeader && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="mr-2 size-4" />
                  Export
                </Button>
              )}
            </div>
          )}

          {/* Middle row: Live Collection - optional when handout is in secondary bar */}
          {showHandoutInHeader && (
            <div className="grid grid-cols-1 gap-2">
              <Button
                size="sm"
                onClick={onLiveCollection}
                disabled={assessment.status !== 'live'}
                className={`${assessment.status === 'live' ? '' : 'cursor-not-allowed opacity-50'}`}
              >
                <QrCode className="mr-2 size-4" />
                Assessment Handout
              </Button>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  ) : undefined

  return (
    <GenericPageHeader
      title={assessment.title}
      subtitle={subtitleWithStatus}
      breadcrumbItems={breadcrumbItems}
      actions={actions}
    />
  )
}
