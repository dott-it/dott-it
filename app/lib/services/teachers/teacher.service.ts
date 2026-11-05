import { Result, isResultError } from '@/utils/result'
import { ServiceOptions } from '@/app/shared/services/service'
import { httpClient } from '@/lib/service'
import { defaultResponseTransformer } from '@/app/shared/services/service'

export interface Teacher {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  teacherNickname?: string | null
  userId?: string | null
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface TeachersResponse {
  teachers: Teacher[]
  total: number
}

export async function getTeachers(
  options?: ServiceOptions<TeachersResponse>,
): Promise<Result<TeachersResponse>> {
  const result = await httpClient.get<TeachersResponse>({
    path: '/api/teachers',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
  if (isResultError(result)) return result
  return result.data
}

