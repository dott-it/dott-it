'use client'

import type { ReactNode } from 'react'
import { Typography } from '@/app/lib/components/ui/typography'

export interface RelationItemProps {
  label: string
  icon?: ReactNode
  value?: string | ReactNode
  secondaryValue?: ReactNode
  emptyMessage?: string
  isCodeFallback?: boolean
  className?: string
}

export function RelationItem({
  label,
  icon,
  value,
  secondaryValue,
  emptyMessage = 'No information available',
  isCodeFallback = false,
  className,
}: RelationItemProps) {
  return (
    <div className={className}>
      <Typography variant="caption" color="muted">
        {label}
      </Typography>
      {value ? (
        <div className="mt-1 flex items-center gap-2">
          {icon}
          <Typography
            variant="body1"
            className={isCodeFallback ? 'font-mono text-sm' : undefined}
          >
            {value}
          </Typography>
          {secondaryValue}
        </div>
      ) : (
        <Typography variant="body1" className="mt-1 text-muted-foreground">
          {emptyMessage}
        </Typography>
      )}
    </div>
  )
}

