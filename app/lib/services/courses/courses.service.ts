import { Course, CourseResponse, CoursesResponse, CreateCourseParams, DeleteCourseParams } from '@/app/types'
import { CoursesService } from '../../../shared/services/courses.service'
import { ServiceOptions } from '../../../shared/services/service'


import { httpClient } from '@/lib/service'

export const coursesService = new CoursesService(httpClient)

export function getCourses(options?: ServiceOptions<CoursesResponse>) {
  return coursesService.getCourses(options)
}

export function getCourse(params: { id: string }, options?: ServiceOptions<CourseResponse>) {
  return coursesService.getCourse(params, options)
}

export function getCoursesBySubject(
  params: { subject: string },
  options?: ServiceOptions<CoursesResponse>,
) {
  return coursesService.getCoursesBySubject(params, options)
}

export function getCoursesByGrade(
  params: { grade: number },
  options?: ServiceOptions<CoursesResponse>,
) {
  return coursesService.getCoursesByGrade(params, options)
}

export function createCourse(params: CreateCourseParams, options?: ServiceOptions<CourseResponse>) {
  return coursesService.createCourse(params, options)
}

export function updateCourse(
  params: { id: string; data: Partial<Course> },
  options?: ServiceOptions<CourseResponse>,
) {
  return coursesService.updateCourse(params, options)
}

export function deleteCourse(params: DeleteCourseParams, options?: ServiceOptions<void>) {
  return coursesService.deleteCourse(params, options)
}
