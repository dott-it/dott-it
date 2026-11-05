import { ApiError } from './common.api'

/**
 * Course API Types
 */
export interface Course {
  id: string
  title: string
  description: string
  subject: string
  grade: number | null
  gradeName: string | null
  unitCount: number
  assessmentCount: number
  enrolledCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Course API Request Parameters
 */
export interface GetCourseParams {
  id: string
}

export interface GetCoursesBySubjectParams {
  subject: string
}

export interface GetCoursesByGradeParams {
  grade: number
}

export interface CreateCourseParams {
  title: string
  description: string
  subject: string
  grade?: number
  gradeName?: string
}

export interface UpdateCourseParams {
  id: string
  data: Partial<Course>
}

export interface DeleteCourseParams {
  id: string
}

/**
 * Course API Response Types
 */
export type CourseResponse = Course | ApiError
export type CoursesResponse = Course[] | ApiError

// Legacy aliases for backward compatibility
export type GetCoursesResponse = CoursesResponse

