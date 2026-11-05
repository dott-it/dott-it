'use client'

export function ThematicAnalysisSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-9 w-36 animate-pulse rounded bg-muted" />
      </div>

      {/* Accordion items skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-12 animate-pulse rounded bg-muted" />
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="size-5 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
