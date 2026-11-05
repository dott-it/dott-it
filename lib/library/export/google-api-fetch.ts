type GoogleApiErrorBody = {
  error?: {
    message?: string
    code?: number
    status?: string
  }
}

export class GoogleApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'GoogleApiRequestError'
  }
}

export async function googleApiJson<T>(
  accessToken: string,
  url: string,
  init?: Parameters<typeof fetch>[1],
): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  // Avoid gzip decompression issues with Next.js/undici in route handlers.
  headers.set('Accept-Encoding', 'identity')

  const response = await fetch(url, { ...init, headers })
  const raw = await response.text()
  let data = {} as T & GoogleApiErrorBody
  if (raw.trim()) {
    try {
      data = JSON.parse(raw) as T & GoogleApiErrorBody
    } catch {
      if (!response.ok) {
        throw new GoogleApiRequestError(
          `Google API request failed (${response.status}): ${raw.slice(0, 200)}`,
          response.status,
        )
      }
      throw new GoogleApiRequestError(
        `Google API returned non-JSON body (${response.status})`,
        response.status,
      )
    }
  }

  if (!response.ok) {
    throw new GoogleApiRequestError(
      data.error?.message ?? `Google API request failed (${response.status})`,
      response.status,
    )
  }

  return data
}
