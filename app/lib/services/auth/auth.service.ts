import { Result } from '@/utils/result'
import { AuthService } from '../../../shared/services/auth.service'
import { ServiceOptions } from '../../../shared/services/service'

import { httpClient } from '@/lib/service'
import { LoginParams, LoginSuccessResponse } from '@/app/types'

export const authService = new AuthService(httpClient)

export function login(
  params: LoginParams,
  options?: ServiceOptions<LoginSuccessResponse>
): Promise<Result<LoginSuccessResponse>> {
  return authService.login(params, options)
}
