import { env } from '@/app/env/client.mjs'
import { http, jsonResponseTransformer, HTTPClientHTTPOptions } from '@/utils/https'

// Helper function to safely merge headers
function mergeHeaders(
  existingHeaders: globalThis.HeadersInit | undefined,
  newHeaders: Record<string, string>,
): Record<string, string> {
  if (!existingHeaders) return newHeaders

  // If it's already a plain object, merge directly
  if (
    typeof existingHeaders === 'object' &&
    !Array.isArray(existingHeaders) &&
    !(existingHeaders instanceof Headers)
  ) {
    return { ...existingHeaders, ...newHeaders }
  }

  // For other types (Headers, arrays), convert to plain object first
  const plainHeaders: Record<string, string> = {}
  if (existingHeaders instanceof Headers) {
    for (const [key, value] of existingHeaders) {
      plainHeaders[key] = value
    }
  } else if (Array.isArray(existingHeaders)) {
    for (const [key, value] of existingHeaders) {
      plainHeaders[key] = value
    }
  }

  return { ...plainHeaders, ...newHeaders }
}

// Helper function to create properly typed response transformer
function createJsonResponseTransformer<T>() {
  return jsonResponseTransformer as (
    response: Response,
  ) => Promise<import('@/utils/result').Result<T>>
}

const JSON_REQUEST_INIT: globalThis.RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
}
let clientUrl: string | undefined = ''
if (globalThis.window) {
  // Use base URL without /api/ prefix to avoid duplication
  clientUrl = env.NEXT_PUBLIC_BASE_URL?.replace('/api/', '') || '/'
}

const url = (globalThis.window === undefined ? env.API_URL : clientUrl) ?? ''

// Base HTTP client
const baseHttpClient = http.makeClient({
  url,
  requestOptions: JSON_REQUEST_INIT,
  requestIdGeneratorFn: generateRequestId,
  responseErrorHandler: webResponseErrorHandler,
})

// Function to create HTTP client with auth token
export function createHttpClientWithAuth(authToken: string | null) {
  console.log('🔧 createHttpClientWithAuth called:', {
    hasAuthToken: !!authToken,
    authToken: authToken ? '***' + authToken.slice(-10) : null,
  })

  return {
    ...baseHttpClient,
    async get<T>(options: HTTPClientHTTPOptions<T>) {
      const headers = authToken
        ? mergeHeaders(options.requestOptions?.headers, { Authorization: `Bearer ${authToken}` })
        : options.requestOptions?.headers || {}
      console.log('🔧 GET request headers:', { hasAuth: 'Authorization' in headers, headers })
      return baseHttpClient.get<T>({
        ...options,
        requestOptions: { ...options.requestOptions, headers },
        responseTransformer: createJsonResponseTransformer<T>(),
      })
    },
    async post<T>(options: HTTPClientHTTPOptions<T>) {
      const headers = authToken
        ? mergeHeaders(options.requestOptions?.headers, { Authorization: `Bearer ${authToken}` })
        : options.requestOptions?.headers || {}
      console.log('🔧 POST request headers:', { hasAuth: 'Authorization' in headers, headers })
      console.log('🔧 POST options before call:', {
        path: options.path,
        data: options.data,
        headers,
      })
      console.log('🔧 POST options after spread:', {
        ...options,
        requestOptions: { ...options.requestOptions, headers },
      })
      return baseHttpClient.post<T>({
        ...options,
        requestOptions: { ...options.requestOptions, headers },
        responseTransformer: createJsonResponseTransformer<T>(),
      })
    },
    async patch<T>(options: HTTPClientHTTPOptions<T>) {
      const headers = authToken
        ? mergeHeaders(options.requestOptions?.headers, { Authorization: `Bearer ${authToken}` })
        : options.requestOptions?.headers || {}
      return baseHttpClient.patch<T>({
        ...options,
        requestOptions: { ...options.requestOptions, headers },
        responseTransformer: createJsonResponseTransformer<T>(),
      })
    },
    async delete<T>(options: HTTPClientHTTPOptions<T>) {
      const headers = authToken
        ? mergeHeaders(options.requestOptions?.headers, { Authorization: `Bearer ${authToken}` })
        : options.requestOptions?.headers || {}
      return baseHttpClient.delete<T>({
        ...options,
        requestOptions: { ...options.requestOptions, headers },
        responseTransformer: createJsonResponseTransformer<T>(),
      })
    },
    async put<T>(options: HTTPClientHTTPOptions<T>) {
      const headers = authToken
        ? mergeHeaders(options.requestOptions?.headers, { Authorization: `Bearer ${authToken}` })
        : options.requestOptions?.headers || {}
      return baseHttpClient.put<T>({
        ...options,
        requestOptions: { ...options.requestOptions, headers },
        responseTransformer: createJsonResponseTransformer<T>(),
      })
    },
    async purge<T>(options: HTTPClientHTTPOptions<T>) {
      const headers = authToken
        ? mergeHeaders(options.requestOptions?.headers, { Authorization: `Bearer ${authToken}` })
        : options.requestOptions?.headers || {}
      return baseHttpClient.purge<T>({
        ...options,
        requestOptions: { ...options.requestOptions, headers },
        responseTransformer: createJsonResponseTransformer<T>(),
      })
    },
  }
}

// Default HTTP client (without auth)
export const httpClient = baseHttpClient

function generateRequestId(): string {
  return crypto.randomUUID()
}

function webResponseErrorHandler<T>(response: Response, data: T): Error {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    if (typeof record.message === 'string' && record.message.trim()) {
      return new Error(record.message)
    }
    if (typeof record.error === 'string' && record.error.trim()) {
      return new Error(record.error)
    }
  }
  if (typeof data === 'string' && data.trim()) {
    return new Error(data)
  }
  if (data instanceof Error && data.message.trim()) {
    return data
  }
  return new Error(`Request failed (${response.status})`)
}
