import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date to short string
 */
export function formatDateShort(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date to relative and friendly format (like moment.js)
 * Shows "Today", "Yesterday", "Tomorrow" for recent dates
 * Shows day of week for dates within the same week
 * Falls back to regular format for older dates
 */
export function formatRelativeDate(
  date: Date | string,
  options?: {
    includeTime?: boolean
  },
): string {
  const d = new Date(date)
  const now = new Date()
  const locale = 'en-US'

  // Reset time to compare only dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  // Calculate difference in days
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Get day of week names
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const relativeNames = {
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This',
    lastWeek: 'Last',
    nextWeek: 'Next',
  }

  const names = relativeNames
  const days = dayNames

  let result = ''

  // Handle relative dates
  switch (diffDays) {
    case 0: {
      result = names.today
      break
    }
    case -1: {
      result = names.yesterday
      break
    }
    case 1: {
      result = names.tomorrow
      break
    }
    default: {
      if (diffDays >= -6 && diffDays <= 6) {
        // Within same week or adjacent weeks
        const dayName = days[d.getDay()]
        if (diffDays >= -6 && diffDays <= -2) {
          // Past dates in current week (but not yesterday)
          result = dayName
        } else if (diffDays >= 2 && diffDays <= 6) {
          // Future dates in current week (but not tomorrow)
          result = dayName
        } else {
          // Adjacent weeks
          switch (diffDays) {
            case -7: {
              result = `${names.lastWeek} ${dayName}`
              break
            }
            case 7: {
              result = `${names.nextWeek} ${dayName}`
              break
            }
            default: {
              result = dayName
              break
            }
          }
        }
      } else {
        // Fall back to regular format for older dates
        result = d.toLocaleDateString(locale, {
          month: 'short',
          day: 'numeric',
          year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
        })
      }
      break
    }
  }

  // Add time if requested
  if (options?.includeTime) {
    const timeString = d.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    result += ` at ${timeString}`
  }

  return result
}

/**
 * Format date with weekday in a friendly format
 * Shows day of week for recent dates, falls back to regular format
 */
export function formatDateWithWeekday(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const targetLocale = 'en-US'

  // For dates within the last 7 days, show weekday
  const diffTime = now.getTime() - d.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 7 && diffDays >= 0) {
    return d.toLocaleDateString(targetLocale, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  // For older dates, show regular format
  return d.toLocaleDateString(targetLocale, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  })
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
