import { notFound } from 'next/navigation'
import {
  LibraryDetailActions,
  LibraryDetailBreadcrumb,
  LibraryDetailHeader,
  MaterialsSection,
  TeacherEditionGuidancePanel,
} from '@/app/lib/components/library/detail'
import { findIngestedAssessment, loadIngestedManifest } from '@/lib/library/ingest/load-manifest'
import {
  findOpportunityInUnit,
  libraryPageMetadata,
  loadUnitBrowseData,
  teFacilitationFromOpportunity,
} from '@/lib/library/browse'
import {
  materialContextFromIngested,
  shouldShowOpportunityMaterials,
} from '@/lib/library/materials'
import { opportunityDetailPath, slugToGrade } from '@/lib/library/browse/paths'

interface OpportunityDetailPageProps {
  params: Promise<{ grade: string; unit: string; slug: string }>
}

export async function generateMetadata({ params }: OpportunityDetailPageProps) {
  const { grade: gradeSlug, unit: unitCode, slug } = await params
  const grade = slugToGrade(gradeSlug)
  if (!grade) {
    return { title: 'Assessment opportunity not found' }
  }

  const unit = loadUnitBrowseData(unitCode, grade)
  const opportunity = unit ? findOpportunityInUnit(unit, slug) : undefined

  if (!opportunity) {
    return { title: 'Assessment opportunity not found' }
  }

  const path = opportunityDetailPath(grade, unitCode, slug)

  return libraryPageMetadata({
    title: opportunity.title,
    description: opportunity.purpose,
    path,
  })
}

export default async function OpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const { grade: gradeSlug, unit: unitCode, slug } = await params
  const grade = slugToGrade(gradeSlug)

  if (!grade) {
    notFound()
  }

  const unit = loadUnitBrowseData(unitCode, grade)
  if (!unit) {
    notFound()
  }

  const opportunity = findOpportunityInUnit(unit, slug)
  if (!opportunity) {
    notFound()
  }

  const facilitation = teFacilitationFromOpportunity(opportunity)
  const ingestedRow = findIngestedAssessment(unitCode, opportunity.id)
  const materialContext = ingestedRow ? materialContextFromIngested(ingestedRow) : null
  const manifest = loadIngestedManifest(unitCode)
  const showMaterials = materialContext && shouldShowOpportunityMaterials(materialContext)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <LibraryDetailBreadcrumb
        grade={grade}
        unitCode={unitCode}
        unitTitle={unit.title}
        itemTitle={opportunity.title}
      />

      <LibraryDetailHeader
        unitCode={unitCode}
        lessonNumber={opportunity.lessonNumber}
        peCode={opportunity.peCode}
        title={opportunity.title}
        standards={opportunity.standards}
        rowKind="Assessment opportunity"
        categoryLabel={opportunity.categoryLabel}
      />

      <TeacherEditionGuidancePanel {...facilitation} />

      {showMaterials && materialContext ? (
        <MaterialsSection
          context={materialContext}
          assessmentTitle={opportunity.title}
          unitCode={unitCode}
          ingestedAt={manifest?.ingestedAt}
        />
      ) : null}

      <LibraryDetailActions
        assessmentTitle={opportunity.title}
        unitCode={unitCode}
        lessonNumber={opportunity.lessonNumber}
        materialContext={showMaterials ? materialContext : null}
        showWorkspaceAction={false}
      />
    </div>
  )
}
