'use client'

import { Typography } from '@/app/lib/components/ui/typography'
import { SmartDate } from '@/app/lib/components/ui/feedback'

export interface DateItemProps {
  label: string
  date?: string | Date | null
  variant?: 'full' | 'relative' | 'weekday'
  emptyMessage?: string
  className?: string
}

export function DateItem({
  label,
  date,
  variant = 'full',
  emptyMessage = 'N/A',
  className,
}: DateItemProps) {
  return (
    <div className={className}>
      <Typography variant="caption" color="muted">
        {label}
      </Typography>
      <Typography variant="body1" className="mt-1">
        {date ? (
          <SmartDate
            date={date instanceof Date ? date : new Date(date)}
            variant={variant}
          />
        ) : (
          emptyMessage
        )}
      </Typography>
    </div>
  )
}

