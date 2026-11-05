import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import { getTeachers, TeachersResponse } from './teacher.service'

export const teacherQueries = router([...auth.getKey(), 'teachers'], {
  list: router.query<TeachersResponse>({
    fetcher: () => successOrThrowAsync(getTeachers()),
  }),
})

