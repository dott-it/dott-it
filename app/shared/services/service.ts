import { HTTPClient, RetryHTTPOptions } from '@/utils/https'
import { type Result, safeAsync } from '@/utils/result'

export class Service {
httpClient:HTTPClient;
    constructor(httpClient:HTTPClient){
        this.httpClient = httpClient;
    }
}

export type ServiceOptions<T>= Partial<RetryHTTPOptions<T>>;

/**
 * Default response transformer for service functions.
 * Handles 204 No Content and other empty bodies (e.g. DELETE) without calling `json()` on empty input.
 * Return type matches `HTTPClient` expectations: `Promise<Result<T>>`.
 */
export async function defaultResponseTransformer<T>(res: Response): Promise<Result<T>> {
  // Do not short-circuit on !res.ok — parse the body so responseErrorHandler
  // can surface API `message` / `error` fields (e.g. rate_limited, unauthorized).
  if (res.status === 204 || res.status === 205) {
    return undefined as unknown as Result<T>
  }
  const text = await res.text()
  if (!text.trim()) {
    if (!res.ok) {
      return new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    return undefined as unknown as Result<T>
  }
  return safeAsync(() => Promise.resolve(JSON.parse(text) as T))
}