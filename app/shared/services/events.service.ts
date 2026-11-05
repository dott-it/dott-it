import {
  Event,
  GetEventParams,
  GetEventsByNameParams,
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
} from '@/types'
import { HTTPClient, ServiceResponsePromise } from '@/utils/https'
import {
  Service,
  ServiceOptions,
  defaultResponseTransformer,
} from '@/app/shared/services/service'
import { isResultError, Result } from '@/utils/result'

export class EventsService extends Service {
  async getEvents(options?: ServiceOptions<Event[]>): Promise<Result<Event[]>> {
    const result = await getEvents(this.httpClient, options)
    if (isResultError(result)) return result

    return result.data
  }
  async getEvent(params: GetEventParams, options?: ServiceOptions<Event>): Promise<Result<Event>> {
    const result = await getEvent(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async getEventsByName(
    params: GetEventsByNameParams,
    options?: ServiceOptions<Event[]>,
  ): Promise<Result<Event[]>> {
    const result = await getEventsByName(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async createEvent(
    params: CreateEventParams,
    options?: ServiceOptions<Event>,
  ): Promise<Result<Event>> {
    const result = await createEvent(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async updateEvent(
    params: UpdateEventParams,
    options?: ServiceOptions<Event>,
  ): Promise<Result<Event>> {
    const result = await updateEvent(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
  async deleteEvent(
    params: DeleteEventParams,
    options?: ServiceOptions<void>,
  ): Promise<Result<void>> {
    const result = await deleteEvent(this.httpClient, params, options)
    if (isResultError(result)) return result

    return result.data
  }
}

/**
 * Get all events
 */
export async function getEvents(
  httpClient: HTTPClient,
  options?: ServiceOptions<Event[]>,
): ServiceResponsePromise<Event[]> {
  return httpClient.get<Event[]>({
    path: '/api/events',
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  httpClient: HTTPClient,
  params: GetEventParams,
  options?: ServiceOptions<Event>,
): ServiceResponsePromise<Event> {
  return httpClient.get<Event>({
    path: `/api/events/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Get events by name
 */
export async function getEventsByName(
  httpClient: HTTPClient,
  params: GetEventsByNameParams,
  options?: ServiceOptions<Event[]>,
): ServiceResponsePromise<Event[]> {
  return httpClient.get<Event[]>({
    path: `/api/events?name=${encodeURIComponent(params.name)}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Create a new event
 */
export async function createEvent(
  httpClient: HTTPClient,
  params: CreateEventParams,
  options?: ServiceOptions<Event>,
): ServiceResponsePromise<Event> {
  return httpClient.post<Event>({
    path: '/api/events',
    data: params as unknown as Record<string, unknown>,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Update an event
 */
export async function updateEvent(
  httpClient: HTTPClient,
  params: UpdateEventParams,
  options?: ServiceOptions<Event>,
): ServiceResponsePromise<Event> {
  return httpClient.patch<Event>({
    path: `/api/events/${params.id}`,
    data: params.data,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}

/**
 * Delete an event
 */
export async function deleteEvent(
  httpClient: HTTPClient,
  params: DeleteEventParams,
  options?: ServiceOptions<void>,
): ServiceResponsePromise<void> {
  return httpClient.delete<void>({
    path: `/api/events/${params.id}`,
    responseTransformer: defaultResponseTransformer,
    ...options,
  })
}
