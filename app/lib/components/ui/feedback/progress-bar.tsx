import React from 'react'
import { cn } from '@/app/lib/utils/utils'

export interface ProgressBarProps {
  value: number // Percentage value (0-100)
  max?: number // Maximum value (default: 100)
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  showLabel?: boolean
  label?: string
  animated?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  className,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = false,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  }

  const containerClasses = cn(
    'bg-muted rounded-full overflow-hidden',
    sizeClasses[size],
    className
  )

  const progressClasses = cn(
    'transition-all duration-500 ease-out',
    variantClasses[variant],
    sizeClasses[size],
    animated && 'animate-pulse'
  )

  const displayLabel = label || `${Math.round(percentage)}%`

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{displayLabel}</span>
        </div>
      )}
      <div className={containerClasses}>
        <div
          className={progressClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${percentage}%`}
        />
      </div>
    </div>
  )
}
