import React from 'react'
import { formatRelativeDate, formatDateWithWeekday } from '@/app/lib/utils/utils'
import { cn } from '@/app/lib/utils/utils'

interface SmartDateProps {
  date: Date | string
  variant?: 'relative' | 'weekday' | 'full'
  includeTime?: boolean
  className?: string
  showTooltip?: boolean
}

/**
 * SmartDate component that displays dates in a contextual and friendly format
 *
 * @param date - The date to format
 * @param variant - 'relative' for "Today", "Yesterday", etc. | 'weekday' for "Monday, Jan 15" | 'full' for complete date
 * @param includeTime - Whether to include time in the display
 * @param locale - Locale for formatting (default: 'en-US')
 * @param className - Additional CSS classes
 * @param showTooltip - Whether to show full date in tooltip
 */
export function SmartDate({
  date,
  variant = 'relative',
  includeTime = false,
  className,
  showTooltip = true,
}: SmartDateProps) {
  const getFormattedDate = () => {
    switch (variant) {
      case 'relative': {
        return formatRelativeDate(date, { includeTime })
      }
      case 'weekday': {
        return formatDateWithWeekday(date)
      }
      case 'full': {
        return new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          ...(includeTime && {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        })
      }
      default: {
        return formatRelativeDate(date, { includeTime })
      }
    }
  }

  const formattedDate = getFormattedDate()
  const fullDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  })

  const isRelative =
    variant === 'relative' &&
    (formattedDate.includes('Today') ||
      formattedDate.includes('Yesterday') ||
      formattedDate.includes('Tomorrow'))

  return (
    <span
      className={cn('inline-block', isRelative && 'font-medium', className)}
      title={showTooltip && formattedDate !== fullDate ? fullDate : undefined}
    >
      {formattedDate}
    </span>
  )
}

/**
 * SmartDateBadge component for displaying dates in badge format
 */
interface SmartDateBadgeProps extends Omit<SmartDateProps, 'variant'> {
  variant?: 'default' | 'secondary' | 'outline'
  size?: 'sm' | 'md'
}

export function SmartDateBadge({
  date,
  variant = 'default',
  size = 'sm',
  className,
  ...props
}: SmartDateBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      title={props.showTooltip ? new Date(date).toLocaleDateString('en-US') : undefined}
    >
      <SmartDate date={date} {...props} />
    </span>
  )
}
