/**
 * Generic API Hook Types
 */

/**
 * API Hook State
 */
export interface ApiState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  isSuccess: boolean
  isError: boolean
}

/**
 * API Hook Return Type
 */
export interface UseApiReturn<T> extends ApiState<T> {
  refetch: () => Promise<void>
  reset: () => void
}

/**
 * API Hook Options
 */
export interface UseApiOptions<T> {
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retries?: number
  retryDelay?: number
  staleTime?: number
  cacheTime?: number
}

/**
 * Mutation Hook Return Type
 */
export interface UseMutationReturn<TData, TVariables = unknown> {
  mutate: (variables: TVariables) => Promise<TData>
  mutateAsync: (variables: TVariables) => Promise<TData>
  data: TData | null
  isLoading: boolean
  error: string | null
  isSuccess: boolean
  isError: boolean
  reset: () => void
}

/**
 * Mutation Hook Options
 */
export interface UseMutationOptions<TData, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void
  retries?: number
  retryDelay?: number
}

