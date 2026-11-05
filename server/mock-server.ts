import { extendHeaders } from '@/utils/https'
import { generatePermutationsWithRemoveCombinations } from '@/utils/permutation'
import { error, isResultError, Result } from '@/utils/result'
import z from 'zod'

type ResponseInit = globalThis.ResponseInit
type RequestInit = globalThis.RequestInit

export interface MockContext {
  params: MockParams
}

export interface MockParams {
  path: string | string[]
}

const DEFAULT_RESPONSE_INIT: ResponseInit = {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
}

export interface MockServerOptions {
  enabled?: boolean
  proxyUrl?: string
  mockApiPath?: string
  mockVariantHeader?: string
  notFound?: (() => never) | (() => Response)
  getMockFile: (method: string, path: string, request?: Request) => Promise<Result<object>>
  mockProxyIntercept?: (path: string, request: Request) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logger?: (message?: any, ...optionalParams: any[]) => void
  fetchFn?: typeof fetch
}

export class MockServer {
  private enabled: boolean
  private proxyUrl?: string
  private mockApiPath?: string
  private notFound: (() => never) | (() => Response)
  private mockVariantHeader?: string
  private getMockFile: (method: string, path: string, request?: Request) => Promise<Result<object>>
  private mockProxyIntercept?: (path: string, request: Request) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logger?: (message?: any, ...optionalParams: any[]) => void
  private fetchFn: typeof fetch

  constructor(options: MockServerOptions) {
    this.enabled = options.enabled ?? true
    this.proxyUrl = options.proxyUrl
    this.mockApiPath = options.mockApiPath
    this.notFound = options.notFound ?? defaultNotFound
    this.mockVariantHeader = options.mockVariantHeader
    this.getMockFile = options.getMockFile
    this.mockProxyIntercept = options.mockProxyIntercept
    this.logger = options.logger
    this.fetchFn = options.fetchFn ?? fetch
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(message?: any, ...optionalParams: any[]): void {
    const logFn = this.logger ?? console.log
    logFn(message, ...optionalParams)
  }

  getHandler(): (request: Request, ctx: MockContext) => Promise<Response> {
    return this.handler.bind(this)
  }

  private async handler(request: Request, ctx: MockContext): Promise<Response> {
    if (!this.enabled) return this.notFound()
    const { path } = await ctx.params
  console.log(request.headers)
    const hasMockVariantHeaders =
      this.mockVariantHeader != null && request.headers.has(this.mockVariantHeader)
    console.log('this.proxyUrl', this.proxyUrl, hasMockVariantHeaders)
    console.log(this.proxyUrl)
    if (this.proxyUrl != null && !hasMockVariantHeaders) {
      console.log('aqui')
      const response = await this.handleMockProxy(path, request)
      if (!isResultError(response)) return response
    }
    const fileResponse = await this.handleMockFile(path, request)
    if (isResultError(fileResponse)) return this.notFound()
    return fileResponse
  }

  private async handleMockProxy(
    path: string | string[],
    request: Request,
    isTrailingSlash = false,
  ): Promise<Result<Response>> {
    if (this.proxyUrl == null) return error(new Error('Missing proxy url'))

    const requestClone = request.clone()
    const reqPath = Array.isArray(path) ? path.join('/') : path
    this.mockProxyIntercept?.(reqPath, request)

    try {
      const mockURL = new URL(request.url)
      this.log('Mock proxy:', request.method, reqPath, mockURL.search)
      const actualUrl = new URL(`${this.proxyUrl}/${reqPath}`)
      actualUrl.search = mockURL.search

      const requestInit: RequestInit = {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual',
      }

      const res = await this.fetchFn(actualUrl, requestInit)
      const headers = mapHeadersSetCookie(res.headers)
      if (res.status === 404) {
        if (reqPath.at(-1) !== '/') {
          return this.handleMockProxy(`${reqPath}/`, requestClone, true)
        }
        throw new Error('404- Not found')
      } else if (res.status >= 300 && res.status < 400 && !isTrailingSlash) {
        const locationHeader = headers.get('Location')
        if (locationHeader) {
          if (locationHeader.includes('http')) {
            const locationOrigin = new URL(locationHeader).origin
            const url = locationHeader
              .replace(locationOrigin, this.mockApiPath ?? '')
              .replaceAll('//', '/')
            headers.set('Location', urlWithoutOrigin(url))
          } else {
            const url = new URL(`${this.mockApiPath ?? ''}${locationHeader}`.replaceAll('//', '/'))
            headers.set('Location', urlWithoutOrigin(url))
          }
        }
      }

      return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
    } catch (e) {
      this.log(
        'Mock proxy failed:',
        path,
        request.method,
        e instanceof Error ? e.message : String(e),
      )
      return error(e)
    }
  }

  private async handleMockFile(
    path: string | string[],
    request: Request,
  ): Promise<Result<Response>> {
    const reqPath = Array.isArray(path) ? path.join('-') : path
    const mockVariants = this.getMockVariantFromHeaders(request.headers)
    this.log('Mock from file:', { reqPath, mockVariants })
    const fileResponse = await this.getMockFiles(
      request.method.toLowerCase(),
      reqPath,
      mockVariants,
      request,
    )
    if (isResultError(fileResponse)) {
      this.log('Mock from file failed:', request.method, reqPath, mockVariants)
      return fileResponse
    }
    if (typeof fileResponse === 'object' && fileResponse != null && 'mock' in fileResponse) {
      const parsedFile = mockSchema.safeParse(fileResponse.mock)
      if (!parsedFile.success) return error(parsedFile.error)
      const data = parsedFile.data.data == null ? undefined : JSON.stringify(parsedFile.data.data)
      const body = parsedFile.data.body ?? data
      const init = parsedFile.data.response ?? DEFAULT_RESPONSE_INIT
      if (data != null) {
        init.headers = extendHeaders(init.headers ?? {}, { 'Content-Type': 'application/json' })
      }
      return new Response(body, init)
    }
    return new Response(JSON.stringify(fileResponse), DEFAULT_RESPONSE_INIT)
  }

  private getMockVariantFromHeaders(headers: Headers): string[] {
    if (this.mockVariantHeader == null) return []
    const mockVariants: string[] = []
    const variantsHeader = headers.get(this.mockVariantHeader)
    if (variantsHeader == null) return mockVariants
    const variants = variantsHeader.split(';')
    for (const variant of variants) {
      const variantHeader = headers.get(variant)
      if (variantHeader != null) {
        mockVariants.push(`${variant.toLocaleUpperCase()}=${variantHeader}`)
      }
    }
    return mockVariants
  }

  private async getMockFiles(
    method: string,
    path: string,
    variants: string[],
    request?: Request,
  ): Promise<Result<unknown>> {
    if (variants.length === 0) return this.getMockFile(method, path, request)
    const variantPaths = generatePermutationsWithRemoveCombinations(variants, '_')
    let fileRes
    for (const variantPath of variantPaths) {
      fileRes = await this.getMockFile(method, `${path}_${variantPath}`, request)
      if (!isResultError(fileRes)) return fileRes
    }
    return fileRes ?? error(new Error('no variants found'))
  }
}
function defaultNotFound(): Response {
  return new Response(undefined, { status: 404, statusText: 'Not found' })
}

export function mapHeadersSetCookie(headers: Headers): Headers {
  const newHeaders = new Headers()

  // eslint-disable-next-line unicorn/prefer-set-has
  const removeHeaders = ['cookie', 'content-encoding', 'vary', 'connection', 'content-length']
  for (const [key, val] of headers.entries()) {
    if (removeHeaders.includes(key)) continue
    if (key.toLowerCase() === 'set-cookie') {
      newHeaders.append('Set-Cookie', removeCookieDomain(val))
    } else {
      newHeaders.set(key, val)
    }
  }
  const setCookies = headers.getSetCookie()
  for (const cookie of setCookies) {
    newHeaders.append('Set-Cookie', removeCookieDomain(cookie))
  }
  const cookies = headers.get('cookie')
  if (cookies) {
    newHeaders.set('cookie', removeCookieDomain(cookies))
  }

  return newHeaders
}

function removeCookieDomain(cookie: string): string {
  return cookie
    .split(';')
    .filter((it) => !it.toLocaleLowerCase().includes('domain'))
    .join(';')
}

const mockSchema = z.object({
  body: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
  response: z
    .object({
      status: z.number().optional(),
      statusText: z.string().optional(),
      headers: z.record(z.string()).optional(),
    })
    .optional(),
})

function urlWithoutOrigin(input: string | URL): string {
  const url = typeof input === 'string' ? new URL(input) : input
  return url.href.replace(url.origin, '')
}
