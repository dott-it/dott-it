import { Suspense } from 'react'
import { LibraryLandingView } from '@/app/lib/components/library/browse/library-landing-view'
import { buildLibraryActivitySearchIndex } from '@/lib/library/browse/build-library-activity-search-index'
import { MIDDLE_SCHOOL_GRADES } from '@/lib/library/browse/paths'

export const metadata = {
  title: 'OpenSciEd Assessment Library',
  description: 'Browse OpenSciEd units, assessments, and assessment opportunities.',
}

interface OpenSciEdLibraryPageProps {
  searchParams: Promise<{ grade?: string }>
}

function parseGradeParam(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const grade = Number.parseInt(value, 10)
  if (!MIDDLE_SCHOOL_GRADES.includes(grade as (typeof MIDDLE_SCHOOL_GRADES)[number])) {
    return undefined
  }

  return grade
}

export default async function OpenSciEdLibraryPage({ searchParams }: OpenSciEdLibraryPageProps) {
  const { grade: gradeParam } = await searchParams
  const grade = parseGradeParam(gradeParam)
  const searchIndex = buildLibraryActivitySearchIndex()

  return (
    <Suspense>
      <LibraryLandingView grade={grade} searchIndex={searchIndex} />
    </Suspense>
  )
}
