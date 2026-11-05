/**
 * Status utility functions for export operations
 */

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'handed_in': {
      return 'Handed In'
    }
    case 'ready_for_review': {
      return 'Ready for Review'
    }
    case 'in_progress': {
      return 'In Progress'
    }
    case 'shared': {
      return 'Shared'
    }
    default: {
      return status
    }
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'handed_in': {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
    }
    case 'ready_for_review': {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    }
    case 'in_progress': {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    }
    case 'shared': {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    default: {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }
}
