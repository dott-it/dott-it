import { Result, isResultError } from '@/utils/result'
import { ServiceOptions } from '@/app/shared/services/service'
import { httpClient } from '@/lib/service'
import {
  Tenant,
  TenantWithUsers,
  CreateTenantRequest,
  UpdateTenantRequest,
} from '@/app/types/api/tenant'
import { defaultResponseTransformer } from '@/app/shared/services/service'

export async function getTenants(
  options?: ServiceOptions<Tenant[]>,
): Promise<Result<Tenant[]>> {
  const result = await httpClient.get<Tenant[]>({
    path: '/api/tenants',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export async function getTenant(
  params: { id: string },
  options?: ServiceOptions<TenantWithUsers>,
): Promise<Result<TenantWithUsers>> {
  const result = await httpClient.get<TenantWithUsers>({
    path: `/api/tenants/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export async function createTenant(
  params: CreateTenantRequest,
  options?: ServiceOptions<Tenant>,
): Promise<Result<Tenant>> {
  const result = await httpClient.post<Tenant>({
    path: '/api/tenants',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export async function updateTenant(
  params: { id: string; data: UpdateTenantRequest },
  options?: ServiceOptions<TenantWithUsers>,
): Promise<Result<TenantWithUsers>> {
  const result = await httpClient.put<TenantWithUsers>({
    path: `/api/tenants/${params.id}`,
    data: params.data as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export interface TenantUsersResponse {
  tenant: {
    id: string
    name: string
    slug: string
  }
  users: Array<{
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
    image?: string | null
    emailVerified?: Date | null
    createdAt: Date
    updatedAt: Date
    active: boolean
    teacher?: {
      id: string
      firstName: string
      lastName: string
      teacherNickname?: string | null
    } | null
    learnerCount: number
  }>
  total: number
}

export async function getTenantUsers(
  params: { tenantId: string },
  options?: ServiceOptions<TenantUsersResponse>,
): Promise<Result<TenantUsersResponse>> {
  const result = await httpClient.get<TenantUsersResponse>({
    path: `/api/tenants/${params.tenantId}/users`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export interface TenantTeacher {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  teacherNickname?: string | null
  userId?: string | null
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
  learnerCount: number
  createdAt: string
  updatedAt: string
}

export interface TenantTeachersResponse {
  tenant: {
    id: string
    name: string
    slug: string
  }
  teachers: TenantTeacher[]
  total: number
}

export async function getTenantTeachers(
  params: { tenantId: string },
  options?: ServiceOptions<TenantTeachersResponse>,
): Promise<Result<TenantTeachersResponse>> {
  const result = await httpClient.get<TenantTeachersResponse>({
    path: `/api/tenants/${params.tenantId}/teachers`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export interface AddTeacherToTenantParams {
  tenantId: string
  teacherId?: string
  firstName?: string
  lastName?: string
  email?: string | null
  teacherNickname?: string | null
  userId?: string | null
}

export interface AddTeacherToTenantResponse {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  teacherNickname?: string | null
  userId?: string | null
  user?: {
    id: string
    name?: string | null
    email?: string | null
    role?: string | null
  } | null
  learnerCount: number
  createdAt: string
  updatedAt: string
}

export async function addTeacherToTenant(
  params: AddTeacherToTenantParams,
  options?: ServiceOptions<AddTeacherToTenantResponse>,
): Promise<Result<AddTeacherToTenantResponse>> {
  const { tenantId, ...body } = params
  const result = await httpClient.post<AddTeacherToTenantResponse>({
    path: `/api/tenants/${tenantId}/teachers`,
    data: body as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

export interface RemoveTeacherFromTenantParams {
  tenantId: string
  teacherId: string
}

export interface RemoveTeacherFromTenantResponse {
  success: boolean
  message: string
}

export async function removeTeacherFromTenant(
  params: RemoveTeacherFromTenantParams,
  options?: ServiceOptions<RemoveTeacherFromTenantResponse>,
): Promise<Result<RemoveTeacherFromTenantResponse>> {
  const result = await httpClient.delete<RemoveTeacherFromTenantResponse>({
    path: `/api/tenants/${params.tenantId}/teachers/${params.teacherId}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

