import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  CreateUserRequest,
  UpdateUserRequest,
} from './user.service'
import {
  UserWithTenant,
  UsersResponse,
} from '@/app/types/api/user'

export interface GetUserParams {
  id: string
}

export interface UpdateUserParams {
  id: string
  data: UpdateUserRequest
}

export const userQueries = router([...auth.getKey(), 'users'], {
  list: router.query<UsersResponse>({
    fetcher: () => successOrThrowAsync(getUsers()),
  }),
  get: router.query<UserWithTenant, GetUserParams>({
    fetcher: (params) => successOrThrowAsync(getUser(params)),
  }),
  create: router.mutation<UserWithTenant, CreateUserRequest>({
    mutationFn: (params) => successOrThrowAsync(createUser(params)),
  }),
  update: router.mutation<UserWithTenant, UpdateUserParams>({
    mutationFn: (params) => successOrThrowAsync(updateUser(params)),
  }),
})

