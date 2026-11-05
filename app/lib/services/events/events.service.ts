import { Result } from '@/utils/result'
import { EventsService } from '../../../shared/services/events.service'
import { ServiceOptions } from '../../../shared/services/service'
import {
  Event,
  GetEventParams,
  GetEventsByNameParams,
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
} from '@/types'

import { httpClient } from '@/lib/service'

export const eventsService = new EventsService(httpClient)

export function getEvents(options?: ServiceOptions<Event[]>): Promise<Result<Event[]>> {
  return eventsService.getEvents(options)
}

export function getEvent(
  params: GetEventParams,
  options?: ServiceOptions<Event>,
): Promise<Result<Event>> {
  return eventsService.getEvent(params, options)
}

export function getEventsByName(
  params: GetEventsByNameParams,
  options?: ServiceOptions<Event[]>,
): Promise<Result<Event[]>> {
  return eventsService.getEventsByName(params, options)
}

export function createEvent(
  params: CreateEventParams,
  options?: ServiceOptions<Event>,
): Promise<Result<Event>> {
  return eventsService.createEvent(params, options)
}

export function updateEvent(
  params: UpdateEventParams,
  options?: ServiceOptions<Event>,
): Promise<Result<Event>> {
  return eventsService.updateEvent(params, options)
}

export function deleteEvent(
  params: DeleteEventParams,
  options?: ServiceOptions<void>,
): Promise<Result<void>> {
  return eventsService.deleteEvent(params, options)
}
