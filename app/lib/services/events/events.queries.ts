import { router } from 'react-query-kit'
import { auth } from '../queries'
import { successOrThrowAsync } from '@/utils/result'
import {
  getEvent,
  getEvents,
  getEventsByName,
  createEvent,
  updateEvent,
  deleteEvent,
} from './events.service'
import { 
  Event,
  GetEventParams,
  GetEventsByNameParams,
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams
} from '@/app/types/api/event.api'

export const eventsQueries = router([...auth.getKey(), 'events'], {
  getEvent: router.query<Event, GetEventParams>({
    fetcher: (params) => successOrThrowAsync(getEvent(params)),
  }),
  getEvents: router.query<Event[]>({
    fetcher: () => successOrThrowAsync(getEvents()),
  }),
  getEventsByName: router.query<Event[], GetEventsByNameParams>({
    fetcher: (params) => successOrThrowAsync(getEventsByName(params)),
  }),
  createEvent: router.mutation<Event, CreateEventParams>({
    mutationFn: (params) => successOrThrowAsync(createEvent(params)),
  }),
  updateEvent: router.mutation<Event, UpdateEventParams>({
    mutationFn: (params) => successOrThrowAsync(updateEvent(params)),
  }),
  deleteEvent: router.mutation<void, DeleteEventParams>({
    mutationFn: (params) => successOrThrowAsync(deleteEvent(params)),
  }),
})
