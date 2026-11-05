import { isResultError, Result, safeAsync, success } from './result'
import { ResponseError, ResponseTransformerError, UnknowError } from './error'
import { isPromiseLike } from './typeguards'

// Import types from the DOM library for TypeScript
type RequestInit = globalThis.RequestInit
type HeadersInit = globalThis.HeadersInit
type BodyInit = globalThis.BodyInit
type Response = globalThis.Response
type RequestInfo = globalThis.RequestInfo
type URL = globalThis.URL

export interface HTTPOtptions<T> {
  url: string
  data?: Record<string, unknown> | FormData
  requestOptions?: RequestInit
  fetchFn?: typeof fetch
  responseTransformer: (response: Response) => Promise<Result<NoInfer<T>>>

  responseErrorHandler?: (res: Response, data: NoInfer<T>) => Error | Promise<Error>

  onError?: (
    err: Error,
    requestInfo: RequestInfo | URL | string | Request,
    requestInit: RequestInit,
  ) => void

  requestIdGeneratorFn?: () => string
}

export interface RetryHTTPOptions<T> extends HTTPOtptions<T> {
  retries?: number
  canRetryFn?: (resp: Error) => boolean
}

export interface HTTPClientHTTPOptions<T> extends Omit<RetryHTTPOptions<T>, 'url'> {
  url?: string
  path?: string
}

export interface ResponseWithData<T> {
  response: Response
  data: T
}

export type ServiceResponsePromise<T, E extends Error = Error> = Promise<
  Result<ResponseWithData<T>, E>
>

export type ServiceResult<T, E extends Error = Error> = Result<ResponseWithData<T>, E>

async function requestRetry<T>({
  retries = 0,
  canRetryFn,
  onError,
  ...options
}: RetryHTTPOptions<T>): ServiceResponsePromise<T> {
  if (retries <= 1) return request({ ...options, onError })
  const resp = await request<T>(options)
  const canRetry = canRetryFn ?? canRetryRequest
  if (isResultError(resp) && canRetry(resp)) {
    return requestRetry({ ...options, canRetryFn, onError, retries: retries - 1 })
  }
  return resp
}
function canRetryRequest(e: Error): boolean {
  return e instanceof UnknowError || (e instanceof ResponseError && e.isServerResponseError())
}

async function request<T>(options: HTTPOtptions<T>): ServiceResponsePromise<T> {
  const fetchFn = options.fetchFn ?? fetch
  const responseErrorHandler = options.responseErrorHandler ?? defaultResponseErrorHandler

  const headers = headersInitToHeaders(options.requestOptions?.headers ?? {})

  if (options.requestIdGeneratorFn != null) {
    headers.set('request-id', options.requestIdGeneratorFn())
  }

  const requestInit = { ...options.requestOptions, headers }
  const response = await safeAsync(() => fetchFn(options.url, requestInit))

  if (isResultError(response)) {
    options.onError?.(response, options.url, requestInit)
    return response
  }

  const data = await options.responseTransformer(response)

  if (response.ok) {
    if (isResultError(data)) {
      const responseError = new ResponseTransformerError(response, data)
      options.onError?.(responseError, options.url, requestInit)
      return responseError
    }
    return { data, response }
  }
  const responseErrorOrPromise = responseErrorHandler(response, success(data))
  const responseError: Error = isPromiseLike(responseErrorOrPromise)
    ? await responseErrorOrPromise
    : responseErrorOrPromise
  options.onError?.(responseError, options.url, requestInit)
  return responseError
}

export async function jsonResponseTransformer<
  T extends object | unknown[] | string | number | boolean | null,
>(res: Response): Promise<Result<T>> {
  return safeAsync(() => res.json() as Promise<T>)
}
export async function blobResponseTransformer(res: Response): Promise<Result<Blob>> {
  return safeAsync(() => res.blob())
}

export function voiddResponseTransformer(_: Response): Promise<Result<void>> {
  return Promise.resolve()
}

export async function voidOrJsonReponseTransformer<T>(res: Response): Promise<Result<T>> {
  const stream = await res.clone().text()
  if (stream.length === 0) return undefined as T
  return jsonResponseTransformer(res) as Promise<Result<T>>
}
export function defaultResponseErrorHandler<T>(
  response: Response,
  data: T,
): Error | Promise<Error> {
  if (response.ok) return new UnknowError({ response, data })
  return new ResponseError(response, data)
}

async function getRequest<T>(options: RetryHTTPOptions<T>): ServiceResponsePromise<T> {
  return requestRetry({
    ...options,
    requestOptions: {
      method: 'GET',
      ...options.requestOptions,
    },
  })
}

async function deleteRequest<T>(options: RetryHTTPOptions<T>): ServiceResponsePromise<T> {
  return requestRetry({
    ...options,
    requestOptions: {
      method: 'DELETE',
      ...options.requestOptions,
    },
  })
}

async function postRequest<T>(options: RetryHTTPOptions<T>): ServiceResponsePromise<T> {
  return requestRetry({
    ...options,
    requestOptions: {
      method: 'POST',
      ...options.requestOptions,
    },
  })
}

async function putRequest<T>(options: RetryHTTPOptions<T>): ServiceResponsePromise<T> {
  return requestRetry({
    ...options,
    requestOptions: {
      method: 'PUT',
      ...options.requestOptions,
    },
  })
}
export async function patchRequest<T>(options: RetryHTTPOptions<T>): ServiceResponsePromise<T> {
  return requestRetry({
    ...options,
    requestOptions: {
      method: 'PATCH',
      ...options.requestOptions,
    },
  })
}
async function purgeRequest<T>(options: RetryHTTPOptions<T>): ServiceResponsePromise<T> {
  return requestRetry({
    ...options,
    requestOptions: {
      method: 'PURGE',
      ...options.requestOptions,
    },
  })
}

function getDatarequestOptions(
  requestOptions?: RequestInit,
  data?: Record<string, unknown> | FormData,
): { body: BodyInit | null | undefined; headers: HeadersInit } {
  let body = requestOptions?.body
  let headers = requestOptions?.headers ?? new Headers()
  if (data && data instanceof FormData) {
    body = data
  } else if (data && typeof data === 'object') {
    body = JSON.stringify(data)
    headers = extendHeaders(headers, {
      'Content-Type': 'application/json',
    })
  }
  return { body, headers }
}

export type HTPPClientConfig = Partial<Omit<RetryHTTPOptions<unknown>, 'responseTransformer'>>

export interface HTTPClient {
  readonly base: string | undefined
  get: <T>(options: HTTPClientHTTPOptions<T>) => ServiceResponsePromise<T>
  post: <T>(options: HTTPClientHTTPOptions<T>) => ServiceResponsePromise<T>
  put: <T>(options: HTTPClientHTTPOptions<T>) => ServiceResponsePromise<T>
  patch: <T>(options: HTTPClientHTTPOptions<T>) => ServiceResponsePromise<T>
  delete: <T>(options: HTTPClientHTTPOptions<T>) => ServiceResponsePromise<T>
  purge: <T>(options: HTTPClientHTTPOptions<T>) => ServiceResponsePromise<T>
}

class HTTPClientImpl implements HTTPClient {
  config: HTPPClientConfig

  constructor(config: HTPPClientConfig = {}) {
    this.config = config
  }

  get base(): string | undefined {
    return this.config.url
  }
  get<T>(options: HTTPClientHTTPOptions<T>): ServiceResponsePromise<T> {
    return getRequest({
      ...this.config,
      ...options,
      url: options.url ?? this.getUrl(options.path),
      responseTransformer: options.responseTransformer ?? jsonResponseTransformer,
      requestOptions: {
        ...this.config.requestOptions,
        ...options.requestOptions,
        method: 'GET',
        ...getDatarequestOptions(options.requestOptions, options.data),
      },
    })
  }

  delete<T>(options: HTTPClientHTTPOptions<T>): ServiceResponsePromise<T> {
    return deleteRequest({
      ...this.config,
      ...options,
      url: options.url ?? this.getUrl(options.path),
      responseTransformer: options.responseTransformer ?? jsonResponseTransformer,
      requestOptions: {
        ...this.config.requestOptions,
        ...options.requestOptions,
        method: 'DELETE',
        ...getDatarequestOptions(options.requestOptions, options.data),
      },
    })
  }
  post<T>(options: HTTPClientHTTPOptions<T>): ServiceResponsePromise<T> {
    return postRequest({
      ...this.config,
      ...options,
      url: options.url ?? this.getUrl(options.path),
      responseTransformer: options.responseTransformer ?? jsonResponseTransformer,
      requestOptions: {
        ...this.config.requestOptions,
        ...options.requestOptions,
        method: 'POST',
        ...getDatarequestOptions(options.requestOptions, options.data),
      },
    })
  }
  put<T>(options: HTTPClientHTTPOptions<T>): ServiceResponsePromise<T> {
    return putRequest({
      ...this.config,
      ...options,
      url: options.url ?? this.getUrl(options.path),
      responseTransformer: options.responseTransformer ?? jsonResponseTransformer,
      requestOptions: {
        ...this.config.requestOptions,
        ...options.requestOptions,
        method: 'PUT',
        ...getDatarequestOptions(options.requestOptions, options.data),
      },
    })
  }
  patch<T>(options: HTTPClientHTTPOptions<T>): ServiceResponsePromise<T> {
    return patchRequest({
      ...this.config,
      ...options,
      url: options.url ?? this.getUrl(options.path),
      responseTransformer: options.responseTransformer ?? jsonResponseTransformer,
      requestOptions: {
        ...this.config.requestOptions,
        ...options.requestOptions,
        method: 'PATCH',
        ...getDatarequestOptions(options.requestOptions, options.data),
      },
    })
  }
  purge<T>(options: HTTPClientHTTPOptions<T>): ServiceResponsePromise<T> {
    return purgeRequest({
      ...this.config,
      ...options,
      url: options.url ?? this.getUrl(options.path),
      responseTransformer: options.responseTransformer ?? jsonResponseTransformer,
      requestOptions: {
        ...this.config.requestOptions,
        ...options.requestOptions,
        method: 'PURGE',
        ...getDatarequestOptions(options.requestOptions, options.data),
      },
    })
  }
  getUrl(path?: string): string {
    const base = this.config.url ?? ''
    const actualPath = base.endsWith('/') && path?.startsWith('/') ? path.slice(1) : path
    return `${base}${actualPath}`
  }
}

function makeClient(config: HTPPClientConfig): HTTPClient {
  return new HTTPClientImpl(config)
}

export function errorWithDisplayMessage(
  error: Error,
  displayMessage?: string,
  displayMessageKey?: string,
): Error {
  if (error instanceof ResponseError) {
    error.displayMessage = displayMessage
    error.displayMessageKey = displayMessageKey
  }
  return error
}

export function extendHeaders(source: HeadersInit, headers: HeadersInit): HeadersInit {
  const newHeaders = new Headers()

  const sourceHeaders = headersInitToHeaders(source)
  for (const [key, value] of sourceHeaders.entries()) {
    newHeaders.set(key, value)
  }
  const headersH = headersInitToHeaders(headers)
  for (const [key, value] of headersH.entries()) {
    newHeaders.set(key, value)
  }
  return newHeaders
}

export function assignParams(target: URLSearchParams, params: object): URLSearchParams {
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      for (const v of value) {
        target.append(name, v.toString())
      }
    } else {
      target.append(name, value.toString())
    }
  }
  return target
}

export function headersInitToHeaders(headers: HeadersInit): Headers {
  if (headers instanceof Headers) return headers
  const newHeaders = new Headers()
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      newHeaders.append(key, value)
    }
  } else {
    for (const key in headers) {
      const value = headers[key]
      if (value) {
        newHeaders.append(key, value.toString())
      }
    }
  }
  return newHeaders
}

export const http = {
  get: getRequest,
  delete: deleteRequest,
  post: postRequest,
  put: putRequest,
  patch: patchRequest,
  purge: purgeRequest,
  requestRetry,
  request,
  makeClient,
}
