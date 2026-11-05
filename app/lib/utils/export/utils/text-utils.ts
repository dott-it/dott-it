/**
 * Text utility functions for export operations
 */

/**
 * Get the display label for feedback type
 */
export const getFeedbackTypeLabel = (type: string): string => {
  switch (type) {
    case 'strength': {
      return 'Strength'
    }
    case 'suggestion': {
      return 'Suggestion'
    }
    case 'improvement': {
      return 'Suggestion'
    }
    case 'comment': {
      return 'Comment'
    }
    default: {
      return type
    }
  }
}

/**
 * Format student score display
 */
export const formatStudentScore = (score: number | undefined, maxScore?: number): string => {
  if (score === undefined) return 'N/A'
  return `${score}/${maxScore || 100}`
}

/**
 * Format date for display
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString()
}

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Clean and normalize text for export
 */
export const cleanTextForExport = (text: string): string => {
  return text
    .trim()
    .replaceAll(/ +/g, ' ') // Replace multiple spaces with single space
    .replaceAll(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
    .replaceAll(/\n[ ]+/g, '\n') // Remove spaces after newlines
    .replaceAll(/[ ]+\n/g, '\n') // Remove spaces before newlines
}
