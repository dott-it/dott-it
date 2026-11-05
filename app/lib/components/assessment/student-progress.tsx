import { Card, CardContent, CardHeader, CardTitle } from '@/app/lib/components/ui/layout/card'
import { ProgressBar } from '@/app/lib/components/ui/feedback'
import { Users } from 'lucide-react'

interface StudentProgressProps {
  readyForReview: number
  inProgress: number
  shared: number
  total?: number
  onFilterChange?: (status: string) => void
}

export function StudentProgress({
  readyForReview,
  inProgress,
  shared,
  total,
  onFilterChange,
}: StudentProgressProps) {
  const calculatedTotal = total || readyForReview + inProgress + shared
  const getPercentage = (value: number) =>
    calculatedTotal > 0 ? Math.round((value / calculatedTotal) * 100) : 0

  const handleItemClick = (status: string) => {
    if (onFilterChange) {
      onFilterChange(status)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          Assessment Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <ProgressBar
          value={shared}
          max={calculatedTotal}
          variant="success"
          showLabel={true}
          label={`${getPercentage(shared)}% Complete`}
        />

        {/* Status Cards */}
        <div className="grid gap-3">
          <div
            role={onFilterChange ? 'button' : undefined}
            tabIndex={onFilterChange ? 0 : undefined}
            onKeyDown={onFilterChange ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick('ready_for_review') } } : undefined}
            aria-label={onFilterChange ? `Filter by Ready for Review (${readyForReview})` : undefined}
            className={`flex cursor-pointer items-center justify-between rounded-lg bg-blue-50 p-3 transition-all hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 ${
              onFilterChange ? 'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring' : ''
            }`}
            onClick={() => handleItemClick('ready_for_review')}
          >
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium">Ready for Review</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-black">{readyForReview}</div>
              <div className="text-xs text-black">{getPercentage(readyForReview)}%</div>
            </div>
          </div>

          <div
            role={onFilterChange ? 'button' : undefined}
            tabIndex={onFilterChange ? 0 : undefined}
            onKeyDown={onFilterChange ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick('in_progress') } } : undefined}
            aria-label={onFilterChange ? `Filter by In Progress (${inProgress})` : undefined}
            className={`flex cursor-pointer items-center justify-between rounded-lg bg-yellow-50 p-3 transition-all hover:bg-yellow-100 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/40 ${
              onFilterChange ? 'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring' : ''
            }`}
            onClick={() => handleItemClick('in_progress')}
          >
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-black ">{inProgress}</div>
              <div className="text-xs ">{getPercentage(inProgress)}%</div>
            </div>
          </div>
          

          <div
            role={onFilterChange ? 'button' : undefined}
            tabIndex={onFilterChange ? 0 : undefined}
            onKeyDown={onFilterChange ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick('shared') } } : undefined}
            aria-label={onFilterChange ? `Filter by Shared (${shared})` : undefined}
            className={`flex cursor-pointer items-center justify-between rounded-lg bg-green-50 p-3 transition-all hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 ${
              onFilterChange ? 'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring' : ''
            }`}
            onClick={() => handleItemClick('shared')}
          >
            <div className="flex items-center gap-3">
              <div className="size-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Shared</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-black">{shared}</div>
              <div className="text-xs text-black">{getPercentage(shared)}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
