import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  getTenantUsers,
  getTenantTeachers,
  addTeacherToTenant,
  removeTeacherFromTenant,
  TenantUsersResponse,
  TenantTeachersResponse,
  AddTeacherToTenantParams,
  AddTeacherToTenantResponse,
  RemoveTeacherFromTenantParams,
  RemoveTeacherFromTenantResponse,
} from './tenant.service'
import {
  Tenant,
  TenantWithUsers,
  CreateTenantRequest,
  UpdateTenantRequest,
} from '@/app/types/api/tenant'

export interface GetTenantParams {
  id: string
}

export interface UpdateTenantParams {
  id: string
  data: UpdateTenantRequest
}

export const tenantQueries = router([...auth.getKey(), 'tenants'], {
  list: router.query<Tenant[]>({
    fetcher: () => successOrThrowAsync(getTenants()),
  }),
  get: router.query<TenantWithUsers, GetTenantParams>({
    fetcher: (params) => successOrThrowAsync(getTenant(params)),
  }),
  create: router.mutation<Tenant, CreateTenantRequest>({
    mutationFn: (params) => successOrThrowAsync(createTenant(params)),
  }),
  update: router.mutation<TenantWithUsers, UpdateTenantParams>({
    mutationFn: (params) => successOrThrowAsync(updateTenant(params)),
  }),
})

// Query for tenant users - uses a separate endpoint
export const tenantUsersQueries = router([...auth.getKey(), 'tenant-users'], {
  list: router.query<TenantUsersResponse, { tenantId: string }>({
    fetcher: (params) => successOrThrowAsync(getTenantUsers(params)),
  }),
})

// Query for tenant teachers - uses a separate endpoint
export const tenantTeachersQueries = router([...auth.getKey(), 'tenant-teachers'], {
  list: router.query<TenantTeachersResponse, { tenantId: string }>({
    fetcher: (params) => successOrThrowAsync(getTenantTeachers(params)),
  }),
  add: router.mutation<AddTeacherToTenantResponse, AddTeacherToTenantParams>({
    mutationFn: (params) => successOrThrowAsync(addTeacherToTenant(params)),
  }),
  remove: router.mutation<RemoveTeacherFromTenantResponse, RemoveTeacherFromTenantParams>({
    mutationFn: (params) => successOrThrowAsync(removeTeacherFromTenant(params)),
  }),
})

