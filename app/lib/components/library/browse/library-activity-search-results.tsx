import Link from 'next/link'
import type { LibraryActivitySearchResult } from '@/lib/library/browse/library-activity-search-result'

interface LibraryActivitySearchResultsProps {
  results: LibraryActivitySearchResult[]
  query: string
}

export function LibraryActivitySearchResults({
  results,
  query,
}: LibraryActivitySearchResultsProps) {
  if (!query.trim()) {
    return null
  }

  if (results.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No assessments or opportunities match your search.
      </p>
    )
  }

  return (
    <ul className="divide-y rounded-lg border bg-background shadow-sm">
      {results.map((result) => (
        <li key={`${result.href}-${result.kind}-${result.title}`}>
          <Link
            href={result.href}
            className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">{result.title}</p>
              <p className="text-sm text-muted-foreground">
                Grade {result.grade} · Unit {result.unitCode}: {result.unitTitle} · Lesson{' '}
                {result.lessonNumber}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.kind === 'assessment' ? 'Assessment' : 'Assessment opportunity'} ·{' '}
              {result.categoryLabel}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
