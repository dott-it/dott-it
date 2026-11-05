import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import {
  getCourses,
  getCourse,
  getCoursesBySubject,
  getCoursesByGrade,
  createCourse,
  updateCourse,
  deleteCourse,
} from './courses.service'
import { Course, CreateCourseParams, DeleteCourseParams } from '@/app/types'

export const coursesQueries = router([...auth.getKey(), 'courses'], {
  getCourses: router.mutation({
    mutationFn: () => successOrThrowAsync(getCourses()),
  }),
  getCourse: router.mutation({
    mutationFn: (params: { id: string }) => successOrThrowAsync(getCourse(params)),
  }),
  getCoursesBySubject: router.mutation({
    mutationFn: (params: { subject: string }) => successOrThrowAsync(getCoursesBySubject(params)),
  }),
  getCoursesByGrade: router.mutation({
    mutationFn: (params: { grade: number }) => successOrThrowAsync(getCoursesByGrade(params)),
  }),
  createCourse: router.mutation({
    mutationFn: (params: CreateCourseParams) => successOrThrowAsync(createCourse(params)),
  }),
  updateCourse: router.mutation({
    mutationFn: (params: { id: string; data: Partial<Course> }) =>
      successOrThrowAsync(updateCourse(params)),
  }),
  deleteCourse: router.mutation({
    mutationFn: (params: DeleteCourseParams) => successOrThrowAsync(deleteCourse(params)),
  }),
})
