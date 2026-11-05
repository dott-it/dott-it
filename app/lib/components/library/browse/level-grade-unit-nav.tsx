'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { openSciEdGrades } from '@/lib/library-service'
import { MIDDLE_SCHOOL_GRADES, unitBrowsePath } from '@/lib/library/browse/paths'

interface LevelGradeUnitNavProps {
  grade?: number
  unitCode?: string
}

export function LevelGradeUnitNav({ grade, unitCode }: LevelGradeUnitNavProps) {
  const router = useRouter()
  const units = grade
    ? (openSciEdGrades.find((entry) => entry.grade === String(grade))?.units ?? [])
    : []

  function handleGradeChange(value: string) {
    router.push(`/library/openscied?grade=${value}`)
  }

  function handleUnitChange(value: string) {
    if (!grade) {
      return
    }

    router.push(unitBrowsePath(grade, value))
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-lg border p-1">
        <span className="cursor-not-allowed px-3 py-1.5 text-sm text-muted-foreground">
          Elementary
        </span>
        <Link
          href="/library/openscied"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Middle School
        </Link>
        <span className="cursor-not-allowed px-3 py-1.5 text-sm text-muted-foreground">
          High School
        </span>
      </div>

      <Select
        value={grade ? String(grade) : undefined}
        onValueChange={handleGradeChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Grade" />
        </SelectTrigger>
        <SelectContent>
          {MIDDLE_SCHOOL_GRADES.map((gradeOption) => (
            <SelectItem key={gradeOption} value={String(gradeOption)}>
              Grade {gradeOption}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {grade ? (
        <Select value={unitCode} onValueChange={handleUnitChange}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                Unit {unit.id} — {unit.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}
