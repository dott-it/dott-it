'use client'

import Link from 'next/link'
import { MessageSquareText } from 'lucide-react'
import type { FeedbackQueueItem } from '@/lib/planner/build-planner-home'

export interface FeedbackWorkQueueProps {
  items: FeedbackQueueItem[]
}

function formatDue(date: Date | null): string {
  if (!date) return 'No due date'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function FeedbackWorkQueue({ items }: FeedbackWorkQueueProps) {
  return (
    <section className="space-y-3" aria-labelledby="feedback-queue-heading">
      <div className="flex items-center gap-2">
        <MessageSquareText className="size-4 text-primary" aria-hidden />
        <h2 id="feedback-queue-heading" className="text-base font-semibold text-foreground">
          Prepare feedback
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing waiting for review. When students submit, work shows up here.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border bg-card">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start justify-between gap-3 px-3 py-3 transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.classKeys[0] ?? 'All classes'}
                    {item.unitCode ? ` · Unit ${item.unitCode}` : ''}
                    {' · '}
                    {formatDue(item.dueAt)}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {item.pendingCount} pending
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
