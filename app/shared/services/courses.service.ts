import {
  Course,
  CoursesResponse,
  CourseResponse,
  CreateCourseParams,
  DeleteCourseParams,
} from '@/types'
import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'

export class CoursesService extends Service {
  getCourses(options?: ServiceOptions<CoursesResponse>): ServiceResponsePromise<CoursesResponse> {
    return getCourses(this.httpClient, options)
  }
  getCourse(
    params: { id: string },
    options?: ServiceOptions<CourseResponse>,
  ): ServiceResponsePromise<CourseResponse> {
    return getCourse(this.httpClient, params, options)
  }
  getCoursesBySubject(
    params: { subject: string },
    options?: ServiceOptions<CoursesResponse>,
  ): ServiceResponsePromise<CoursesResponse> {
    return getCoursesBySubject(this.httpClient, params, options)
  }
  getCoursesByGrade(
    params: { grade: number },
    options?: ServiceOptions<CoursesResponse>,
  ): ServiceResponsePromise<CoursesResponse> {
    return getCoursesByGrade(this.httpClient, params, options)
  }
  createCourse(
    params: CreateCourseParams,
    options?: ServiceOptions<CourseResponse>,
  ): ServiceResponsePromise<CourseResponse> {
    return createCourse(this.httpClient, params, options)
  }
  updateCourse(
    params: { id: string; data: Partial<Course> },
    options?: ServiceOptions<CourseResponse>,
  ): ServiceResponsePromise<CourseResponse> {
    return updateCourse(this.httpClient, params, options)
  }
  deleteCourse(
    params: DeleteCourseParams,
    options?: ServiceOptions<void>,
  ): ServiceResponsePromise<void> {
    return deleteCourse(this.httpClient, params, options)
  }
}

/**
 * Get all courses
 */
export async function getCourses(
  httpClient: HTTPClient,
  options?: ServiceOptions<CoursesResponse>,
): ServiceResponsePromise<CoursesResponse> {
  return httpClient.get<CoursesResponse>({
    path: '/api/courses',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Get a single course by ID
 */
export async function getCourse(
  httpClient: HTTPClient,
  params: { id: string },
  options?: ServiceOptions<CourseResponse>,
): ServiceResponsePromise<CourseResponse> {
  return httpClient.get<CourseResponse>({
    path: `/api/courses/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Get courses by subject
 */
export async function getCoursesBySubject(
  httpClient: HTTPClient,
  params: { subject: string },
  options?: ServiceOptions<CoursesResponse>,
): ServiceResponsePromise<CoursesResponse> {
  return httpClient.get<CoursesResponse>({
    path: `/api/courses?subject=${encodeURIComponent(params.subject)}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Get courses by grade
 */
export async function getCoursesByGrade(
  httpClient: HTTPClient,
  params: { grade: number },
  options?: ServiceOptions<CoursesResponse>,
): ServiceResponsePromise<CoursesResponse> {
  return httpClient.get<CoursesResponse>({
    path: `/api/courses?grade=${params.grade}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Create a new course
 */
export async function createCourse(
  httpClient: HTTPClient,
  params: CreateCourseParams,
  options?: ServiceOptions<CourseResponse>,
): ServiceResponsePromise<CourseResponse> {
  return httpClient.post<CourseResponse>({
    path: '/api/courses',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Update a course
 */
export async function updateCourse(
  httpClient: HTTPClient,
  params: { id: string; data: Partial<Course> },
  options?: ServiceOptions<CourseResponse>,
): ServiceResponsePromise<CourseResponse> {
  return httpClient.patch<CourseResponse>({
    path: `/api/courses/${params.id}`,
    data: params.data as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Delete a course
 */
export async function deleteCourse(
  httpClient: HTTPClient,
  params: DeleteCourseParams,
  options?: ServiceOptions<void>,
): ServiceResponsePromise<void> {
  return httpClient.delete<void>({
    path: `/api/courses/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
