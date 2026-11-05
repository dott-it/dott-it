/**
 * Common API Types
 * Shared types for all API endpoints
 */

/**
 * API Error Types
 */
export interface ApiError {
  error: string
  message: string
  details: string
  type:
    | 'DATABASE_CONNECTION_ERROR'
    | 'COUNT_ERROR'
    | 'QUERY_ERROR'
    | 'UNEXPECTED_ERROR'
    | 'PARSE_ERROR'
    | 'FIND_ERROR'
    | 'UPDATE_ERROR'
    | 'DELETE_ERROR'
    | 'NOT_FOUND_ERROR'
  retryable: boolean
}

/**
 * Pagination Types
 */
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Filter Types
 */
export interface Filter {
  field: string
  value: string | number | boolean
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in'
}

/**
 * Sort Types
 */
export interface Sort {
  field: string
  direction: 'asc' | 'desc'
}

/**
 * API Response Types
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  status: 'success' | 'error' | 'loading'
}

/**
 * Service Options for API calls
 */
export interface ServiceOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retries?: number
  timeout?: number
}

