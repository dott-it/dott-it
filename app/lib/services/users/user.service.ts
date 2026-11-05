import { Result, isResultError } from '@/utils/result'
import { ServiceOptions } from '@/app/shared/services/service'
import { httpClient } from '@/lib/service'
import {
  UserWithTenant,
  UsersResponse,
} from '@/app/types/api/user'
import { defaultResponseTransformer } from '@/app/shared/services/service'

export interface CreateUserRequest {
  name?: string | null
  email: string
  password?: string | null
  tenantId?: string | null
  role?: string | null
  active?: boolean
}

export interface UpdateUserRequest {
  tenantId?: string | null
  role?: string | null
  active?: boolean
}

export async function getUsers(
  options?: ServiceOptions<UsersResponse>,
): Promise<Result<UsersResponse>> {
  const result = await httpClient.get<UsersResponse>({
    path: '/api/users',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export async function getUser(
  params: { id: string },
  options?: ServiceOptions<UserWithTenant>,
): Promise<Result<UserWithTenant>> {
  const result = await httpClient.get<UserWithTenant>({
    path: `/api/users/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export async function createUser(
  params: CreateUserRequest,
  options?: ServiceOptions<UserWithTenant>,
): Promise<Result<UserWithTenant>> {
  const result = await httpClient.post<UserWithTenant>({
    path: '/api/users',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export async function updateUser(
  params: { id: string; data: UpdateUserRequest },
  options?: ServiceOptions<UserWithTenant>,
): Promise<Result<UserWithTenant>> {
  const result = await httpClient.patch<UserWithTenant>({
    path: `/api/users/${params.id}`,
    data: params.data as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

