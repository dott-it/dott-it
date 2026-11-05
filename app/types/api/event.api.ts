import { ApiError } from './common.api'

/**
 * Event API Types
 */
export interface Event {
  id: string
  name: string
  payload?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

/**
 * Event API Request Parameters
 */
export interface GetEventParams {
  id: string
}

export interface GetEventsByNameParams {
  name: string
}

export interface CreateEventParams {
  name: string
  payload?: Record<string, unknown> | null
}

export interface UpdateEventParams {
  id: string
  data: Partial<Event>
}

export interface DeleteEventParams {
  id: string
}

/**
 * Event API Response Types
 */
export type EventResponse = Event | ApiError
export type EventsResponse = Event[] | ApiError

