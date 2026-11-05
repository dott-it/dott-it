import { notFound } from 'next/navigation'
import {
  UnitBrowseShell,
} from '@/app/lib/components/library/browse'
import { libraryPageMetadata, loadUnitBrowseData } from '@/lib/library/browse'
import { buildLibraryActivitySearchIndex } from '@/lib/library/browse/build-library-activity-search-index'
import { slugToGrade, unitBrowsePath } from '@/lib/library/browse/paths'
import { summarizeUnitExport } from '@/lib/library/export/resolve-unit-export-targets'

interface UnitBrowsePageProps {
  params: Promise<{ grade: string; unit: string }>
  searchParams: Promise<{ focus?: string }>
}

export async function generateMetadata({ params }: UnitBrowsePageProps) {
  const { grade: gradeSlug, unit: unitCode } = await params
  const grade = slugToGrade(gradeSlug)
  if (!grade) {
    return { title: 'Unit not found' }
  }

  const data = loadUnitBrowseData(unitCode, grade)
  if (!data) {
    return { title: 'Unit not found' }
  }

  const path = unitBrowsePath(grade, unitCode)

  return libraryPageMetadata({
    title: `Unit ${data.unitCode}: ${data.title}`,
    description: data.drivingQuestion,
    path,
  })
}

export default async function UnitBrowsePage({ params, searchParams }: UnitBrowsePageProps) {
  const { grade: gradeSlug, unit: unitCode } = await params
  const { focus } = await searchParams
  const grade = slugToGrade(gradeSlug)

  if (!grade) {
    notFound()
  }

  const unit = loadUnitBrowseData(unitCode, grade)
  if (!unit) {
    notFound()
  }

  const exportSummary = summarizeUnitExport(unitCode)
  const searchIndex = buildLibraryActivitySearchIndex()

  return (
    <UnitBrowseShell
      unit={unit}
      grade={grade}
      unitCode={unitCode}
      focus={focus}
      exportSummary={exportSummary}
      searchIndex={searchIndex}
    />
  )
}
