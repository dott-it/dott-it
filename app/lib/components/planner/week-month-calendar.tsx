'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/app/lib/components/ui/buttons'
import { cn } from '@/lib/utils'
import {
  groupEventsByDay,
  listMonthGridDays,
  listWeekDays,
  toDayKey,
  type PlannerEvent,
  type PlannerPeriod,
} from '@/lib/planner/build-planner-home'

export interface WeekMonthCalendarProps {
  period: PlannerPeriod
  anchor: Date
  events: PlannerEvent[]
  onPeriodChange: (period: PlannerPeriod) => void
  onAnchorChange: (anchor: Date) => void
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatPeriodLabel(period: PlannerPeriod, anchor: Date): string {
  if (period === 'week') {
    const days = listWeekDays(anchor)
    const start = days[0]!
    const end = days[6]!
    const sameMonth = start.getMonth() === end.getMonth()
    const startLabel = start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    const endLabel = end.toLocaleDateString(undefined, {
      month: sameMonth ? undefined : 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${startLabel} – ${endLabel}`
  }

  return anchor.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

function shiftAnchor(period: PlannerPeriod, anchor: Date, direction: -1 | 1): Date {
  const next = new Date(anchor)
  if (period === 'week') {
    next.setDate(next.getDate() + direction * 7)
  } else {
    next.setMonth(next.getMonth() + direction)
  }
  return next
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function WeekMonthCalendar({
  period,
  anchor,
  events,
  onPeriodChange,
  onAnchorChange,
}: WeekMonthCalendarProps) {
  const byDay = groupEventsByDay(events)
  const today = new Date()
  const days = period === 'week' ? listWeekDays(anchor) : listMonthGridDays(anchor)
  const month = anchor.getMonth()

  return (
    <section className="space-y-4" aria-labelledby="planner-calendar-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 id="planner-calendar-heading" className="text-base font-semibold text-foreground">
            Plan
          </h2>
          <p className="text-sm text-muted-foreground">{formatPeriodLabel(period, anchor)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="Calendar period">
            <Button
              type="button"
              size="sm"
              variant={period === 'week' ? 'default' : 'ghost'}
              onClick={() => onPeriodChange('week')}
            >
              Week
            </Button>
            <Button
              type="button"
              size="sm"
              variant={period === 'month' ? 'default' : 'ghost'}
              onClick={() => onPeriodChange('month')}
            >
              Month
            </Button>
          </div>

          <div className="inline-flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={`Previous ${period}`}
              onClick={() => onAnchorChange(shiftAnchor(period, anchor, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => onAnchorChange(new Date())}>
              Today
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={`Next ${period}`}
              onClick={() => onAnchorChange(shiftAnchor(period, anchor, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className={cn(
            'grid grid-cols-7',
            period === 'week' ? 'auto-rows-[minmax(9rem,1fr)]' : 'auto-rows-[minmax(5.5rem,1fr)]',
          )}
        >
          {days.map((day) => {
            const key = toDayKey(day)
            const dayEvents = byDay.get(key) ?? []
            const outsideMonth = period === 'month' && day.getMonth() !== month
            const isToday = isSameLocalDay(day, today)

            return (
              <div
                key={key}
                className={cn(
                  'min-h-0 border-b border-r p-1.5 last:border-r-0',
                  outsideMonth && 'bg-muted/20 text-muted-foreground',
                )}
              >
                <div
                  className={cn(
                    'mb-1 flex size-6 items-center justify-center rounded-full text-xs font-medium',
                    isToday && 'bg-primary text-primary-foreground',
                  )}
                >
                  {day.getDate()}
                </div>
                <ul className="space-y-1">
                  {dayEvents.slice(0, period === 'week' ? 6 : 3).map((event) => (
                    <li key={event.id}>
                      <Link
                        href={event.href}
                        className="block truncate rounded-sm bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20"
                        title={event.title}
                      >
                        {event.title}
                      </Link>
                    </li>
                  ))}
                  {dayEvents.length > (period === 'week' ? 6 : 3) ? (
                    <li className="px-1 text-[10px] text-muted-foreground">
                      +{dayEvents.length - (period === 'week' ? 6 : 3)} more
                    </li>
                  ) : null}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
