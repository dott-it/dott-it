import { notFound } from 'next/navigation'
import {
  AssessmentGuidePanel,
  FromTeacherEditionSection,
  LibraryDetailActions,
  LibraryDetailBreadcrumb,
  LibraryDetailHeader,
  MaterialsSection,
} from '@/app/lib/components/library/detail'
import { assessmentGuideFor } from '@/lib/library/assessment-guide/load-guide'
import { findIngestedAssessment, loadIngestedManifest } from '@/lib/library/ingest/load-manifest'
import {
  findAssessmentInUnit,
  libraryPageMetadata,
  loadUnitBrowseData,
  resolveLinkedTeOpportunity,
} from '@/lib/library/browse'
import { materialContextFromIngested } from '@/lib/library/materials'
import { assessmentDetailPath, slugToGrade } from '@/lib/library/browse/paths'

interface AssessmentDetailPageProps {
  params: Promise<{ grade: string; unit: string; slug: string }>
}

export async function generateMetadata({ params }: AssessmentDetailPageProps) {
  const { grade: gradeSlug, unit: unitCode, slug } = await params
  const grade = slugToGrade(gradeSlug)
  if (!grade) {
    return { title: 'Assessment not found' }
  }

  const unit = loadUnitBrowseData(unitCode, grade)
  const assessment = unit ? findAssessmentInUnit(unit, slug) : undefined

  if (!assessment) {
    return { title: 'Assessment not found' }
  }

  const path = assessmentDetailPath(grade, unitCode, slug)

  return libraryPageMetadata({
    title: assessment.title,
    description: assessment.description ?? `Assessment for unit ${unitCode}`,
    path,
  })
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { grade: gradeSlug, unit: unitCode, slug } = await params
  const grade = slugToGrade(gradeSlug)

  if (!grade) {
    notFound()
  }

  const unit = loadUnitBrowseData(unitCode, grade)
  if (!unit) {
    notFound()
  }

  const assessment = findAssessmentInUnit(unit, slug)
  if (!assessment) {
    notFound()
  }

  const linkedTeOpportunity = resolveLinkedTeOpportunity(unit, assessment)
  const guide = assessmentGuideFor(unitCode, assessment.id)
  const ingestedRow = findIngestedAssessment(unitCode, assessment.id)
  const materialContext = ingestedRow ? materialContextFromIngested(ingestedRow) : null
  const manifest = loadIngestedManifest(unitCode)
  const detailPath = assessmentDetailPath(grade, unitCode, slug)
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`${detailPath}?addToWorkspace=ready`)}`

  const peCode = guide?.alignment.lessonPe ?? linkedTeOpportunity?.peCode

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <LibraryDetailBreadcrumb
        grade={grade}
        unitCode={unitCode}
        unitTitle={unit.title}
        itemTitle={assessment.title}
      />

      <LibraryDetailHeader
        unitCode={unitCode}
        lessonNumber={assessment.lessonNumber}
        peCode={peCode}
        title={assessment.title}
        standards={assessment.standards}
        rowKind="Assessment"
        categoryLabel={assessment.categoryLabel}
      />

      {guide ? <AssessmentGuidePanel guide={guide} /> : null}

      {linkedTeOpportunity ? (
        <FromTeacherEditionSection
          opportunity={linkedTeOpportunity}
          grade={grade}
          unitCode={unitCode}
        />
      ) : null}

      {materialContext ? (
        <MaterialsSection
          context={materialContext}
          assessmentTitle={assessment.title}
          unitCode={unitCode}
          ingestedAt={manifest?.ingestedAt}
        />
      ) : null}

      {!guide && !linkedTeOpportunity && !materialContext && assessment.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{assessment.description}</p>
      ) : null}

      <LibraryDetailActions
        assessmentTitle={assessment.title}
        unitCode={unitCode}
        lessonNumber={assessment.lessonNumber}
        assessmentId={assessment.id}
        materialContext={materialContext}
        loginHref={loginHref}
        externalLink={assessment.externalLink}
      />
    </div>
  )
}
