import Link from 'next/link'
import { TeacherEditionGuidancePanel } from '@/app/lib/components/library/detail/teacher-edition-guidance-panel'
import type { TeOpportunityBrowseItem } from '@/lib/library/browse'
import { teFacilitationFromOpportunity } from '@/lib/library/browse'
import { opportunityDetailPath } from '@/lib/library/browse/paths'

interface FromTeacherEditionSectionProps {
  opportunity: TeOpportunityBrowseItem
  grade: number
  unitCode: string
}

export function FromTeacherEditionSection({
  opportunity,
  grade,
  unitCode,
}: FromTeacherEditionSectionProps) {
  const facilitation = teFacilitationFromOpportunity(opportunity)

  return (
    <TeacherEditionGuidancePanel
      {...facilitation}
      footer={
        <Link
          href={opportunityDetailPath(grade, unitCode, opportunity.slug)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          View assessment opportunity →
        </Link>
      }
    />
  )
}
