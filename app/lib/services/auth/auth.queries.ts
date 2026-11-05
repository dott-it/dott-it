import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import { login } from './auth.service'
import { LoginParams, LoginSuccessResponse } from '@/app/types'

export const authQueries = router([...auth.getKey(), 'auth'], {
  login: router.mutation<LoginSuccessResponse, LoginParams>({
    mutationFn: (params) => successOrThrowAsync(login(params))
  })
})
