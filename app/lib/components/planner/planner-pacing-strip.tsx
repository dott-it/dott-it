'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UnitTimeline } from '@/app/lib/components/library/browse/unit-timeline'
import { unitBrowsePath } from '@/lib/library/browse/paths'
import type { UnitBrowseModel } from '@/lib/library/browse'

export interface PlannerPacingStripProps {
  unitCode: string | null
  grade: number | null
  highlightedLessonNumbers?: number[]
}

export function PlannerPacingStrip({
  unitCode,
  grade,
  highlightedLessonNumbers = [],
}: PlannerPacingStripProps) {
  const [model, setModel] = useState<UnitBrowseModel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!unitCode || grade == null) {
      setModel(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/library/units/${encodeURIComponent(unitCode)}/browse?grade=${grade}`)
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Unit pacing not available in the OpenSciEd catalog.')
          }
          throw new Error('Could not load unit pacing.')
        }
        return response.json() as Promise<UnitBrowseModel>
      })
      .then((data) => {
        if (!cancelled) setModel(data)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setModel(null)
          setError(err instanceof Error ? err.message : 'Could not load unit pacing.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [unitCode, grade])

  if (!unitCode || grade == null) {
    return null
  }

  return (
    <section className="space-y-3" aria-labelledby="planner-pacing-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="planner-pacing-heading" className="text-base font-semibold text-foreground">
            Unit pacing
          </h2>
          <p className="text-sm text-muted-foreground">
            Unit {unitCode}
            {highlightedLessonNumbers.length > 0
              ? ` · lessons with work this period: ${highlightedLessonNumbers.join(', ')}`
              : null}
          </p>
        </div>
        <Link
          href={unitBrowsePath(grade, unitCode)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open in library
        </Link>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading pacing…</p> : null}
      {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
      {model ? (
        <UnitTimeline timeline={model.timeline} assessmentShape={model.assessmentShape} />
      ) : null}
    </section>
  )
}
