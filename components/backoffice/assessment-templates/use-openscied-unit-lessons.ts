'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormSelectOption } from '@/components/backoffice/common/form-field'
import type { UnitBrowseModel } from '@/lib/library/browse/types'
import { gradeLevelForUnitCode, normalizeGradeLevelKey } from '@/lib/openscied-unit-options'

export function gradeNumberForUnit(unitCode: string): number | null {
  const fromCode = Number.parseInt(/^(\d+)\./.exec(unitCode)?.[1] ?? '', 10)
  if (!Number.isNaN(fromCode)) {
    return fromCode
  }
  const fromMetadata = Number.parseInt(
    normalizeGradeLevelKey(gradeLevelForUnitCode(unitCode) ?? '') || '',
    10,
  )
  return Number.isNaN(fromMetadata) ? null : fromMetadata
}

export const UNIT_LESSONS_BROWSE_ERROR =
  'Could not load lessons for this unit. Try again, or pick another unit.'

export const UNIT_LESSONS_EMPTY_ERROR = 'This unit has no lessons in the library catalog.'

/** User-facing browse failure when a unit does not return a lesson list. */
export function unitLessonsLoadError(input: {
  requestFailed: boolean
  lessonCount: number
}): string | null {
  if (input.requestFailed) {
    return UNIT_LESSONS_BROWSE_ERROR
  }
  if (input.lessonCount === 0) {
    return UNIT_LESSONS_EMPTY_ERROR
  }
  return null
}

export function lessonSelectOptions(unit: UnitBrowseModel | null): FormSelectOption[] {
  if (!unit) {
    return []
  }
  return unit.lessons.map((lesson) => ({
    value: String(lesson.lessonNumber),
    label: `Lesson ${lesson.lessonNumber} — ${lesson.topic}`,
  }))
}

/** Load the real lesson list for an OpenSciEd unit from the library browse API. */
export function useOpenSciEdUnitLessons(unitCode: string) {
  const [unitBrowse, setUnitBrowse] = useState<UnitBrowseModel | null>(null)
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [catalogReady, setCatalogReady] = useState(false)
  const [lessonsError, setLessonsError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = unitCode.trim()
    if (!trimmed) {
      setUnitBrowse(null)
      setLessonsLoading(false)
      setCatalogReady(false)
      setLessonsError(null)
      return
    }

    const grade = gradeNumberForUnit(trimmed)
    if (grade === null) {
      setUnitBrowse(null)
      setLessonsLoading(false)
      setCatalogReady(false)
      setLessonsError(unitLessonsLoadError({ requestFailed: true, lessonCount: 0 }))
      return
    }

    const controller = new AbortController()
    setUnitBrowse(null)
    setLessonsLoading(true)
    setCatalogReady(false)
    setLessonsError(null)

    void fetch(`/api/library/units/${encodeURIComponent(trimmed)}/browse?grade=${grade}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load unit lessons')
        }
        return (await response.json()) as UnitBrowseModel
      })
      .then((data) => {
        if (controller.signal.aborted) {
          return
        }
        const lessons = data.lessons ?? []
        setUnitBrowse({ ...data, lessons })
        setCatalogReady(true)
        setLessonsError(unitLessonsLoadError({ requestFailed: false, lessonCount: lessons.length }))
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return
        }
        setUnitBrowse(null)
        setCatalogReady(false)
        setLessonsError(unitLessonsLoadError({ requestFailed: true, lessonCount: 0 }))
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLessonsLoading(false)
        }
      })

    return () => controller.abort()
  }, [unitCode])

  const lessonOptions = useMemo(() => lessonSelectOptions(unitBrowse), [unitBrowse])

  return {
    lessonOptions,
    lessonsLoading,
    catalogReady,
    lessonsError,
  }
}
