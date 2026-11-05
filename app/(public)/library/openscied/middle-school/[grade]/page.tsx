import { redirect } from 'next/navigation'
import { slugToGrade } from '@/lib/library/browse/paths'

interface GradePageProps {
  params: Promise<{ grade: string }>
}

export default async function MiddleSchoolGradeRedirectPage({ params }: GradePageProps) {
  const { grade: gradeSlug } = await params
  const grade = slugToGrade(gradeSlug)

  if (!grade) {
    redirect('/library/openscied')
  }

  redirect(`/library/openscied?grade=${grade}`)
}
