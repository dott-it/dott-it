import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'
import { LoginParams, LoginSuccessResponse } from '@/app/types'

export class AuthService extends Service {
  async login(
    params: LoginParams,
    options?: ServiceOptions<LoginSuccessResponse>,
  ): Promise<Result<LoginSuccessResponse>> {
    const result = await login(this.httpClient, params, options)
    if (isResultError(result)) return result
    return result.data
  }
}

export async function login(
  httpClient: HTTPClient,
  params: LoginParams,
  options?: ServiceOptions<LoginSuccessResponse>,
): ServiceResponsePromise<LoginSuccessResponse> {
  return httpClient.post<LoginSuccessResponse>({
    path: '/api/auth/login',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
