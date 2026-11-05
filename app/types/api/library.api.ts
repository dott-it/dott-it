import { ApiError } from "./common.api"

/**
 * Library API Types
 */
export interface LibraryItem {
  id: string
  title: string
  type: 'unit' | 'lesson' | 'resource'
  subject: string
  grade: number | null
  gradeName: string | null
  description: string
  tags: string[]
  url: string | null
  createdAt: string
  updatedAt: string
}

export interface LibraryStats {
  totalUnits: number
  totalLessons: number
  totalResources: number
  subjectCounts: Record<string, number>
  gradeCounts: Record<string, number>
}

/**
 * Library API Request Parameters
 */
export interface GetLibraryItemParams {
  id: string
}

export interface GetLibraryItemsByTypeParams {
  type: 'unit' | 'lesson' | 'resource'
}

export interface GetLibraryItemsBySubjectParams {
  subject: string
}

export interface GetLibraryItemsByGradeParams {
  grade: number
}

export interface SearchLibraryItemsParams {
  query: string
}

export interface CreateLibraryItemParams {
  title: string
  type: 'unit' | 'lesson' | 'resource'
  subject: string
  grade?: number
  gradeName?: string
  description: string
  tags?: string[]
  url?: string
}

export interface UpdateLibraryItemParams {
  id: string
  data: Partial<LibraryItem>
}

export interface DeleteLibraryItemParams {
  id: string
}

/**
 * Library API Response Types
 */
export type LibraryItemResponse = LibraryItem | ApiError
export type LibraryItemsResponse = LibraryItem[] | ApiError
export type LibraryStatsResponse = LibraryStats | ApiError

// Legacy aliases for backward compatibility
export type GetLibraryResponse = LibraryItemsResponse
export type GetLibraryStatsResponse = LibraryStatsResponse
