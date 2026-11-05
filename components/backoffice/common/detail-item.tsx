'use client'

import type { ReactNode } from 'react'
import { Typography } from '@/app/lib/components/ui/typography'

export interface DetailItemProps {
  label: string
  value: string | ReactNode
  className?: string
}

export function DetailItem({ label, value, className }: DetailItemProps) {
  return (
    <div className={className}>
      <Typography variant="caption" color="muted">
        {label}
      </Typography>
      <Typography variant="body1" className="mt-1">
        {value}
      </Typography>
    </div>
  )
}

