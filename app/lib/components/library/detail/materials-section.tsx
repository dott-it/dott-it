import {
  guidanceDetailCaptionGap,
  guidanceDetailContentGap,
  guidanceDetailSectionLabel,
} from '@/app/lib/components/library/detail/guidance-panel-ui'
import { MaterialPreviewCard } from '@/app/lib/components/library/detail/material-preview-card'
import { PackageItemRow } from '@/app/lib/components/library/detail/package-item-row'
import type { MaterialAssessmentContext } from '@/lib/library/materials'
import { getDisplayPackageItems } from '@/lib/library/materials'
import { cn } from '@/lib/utils'

interface MaterialsSectionProps {
  context: MaterialAssessmentContext
  assessmentTitle: string
  unitCode: string
  ingestedAt?: string
  className?: string
}

function formatOpenSciEdUpdatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`
}

export function MaterialsSection({
  context,
  assessmentTitle,
  unitCode,
  ingestedAt,
  className,
}: MaterialsSectionProps) {
  const items = getDisplayPackageItems(context)
  if (items.length === 0) {
    return null
  }

  return (
    <section className={cn('space-y-3', className)}>
      <div>
        <h2 className={guidanceDetailSectionLabel}>Materials</h2>
        {ingestedAt ? (
          <p className={cn(guidanceDetailCaptionGap, 'text-xs italic text-muted-foreground')}>
            Last updated from official OpenSciEd on {formatOpenSciEdUpdatedAt(ingestedAt)}
          </p>
        ) : null}
      </div>

      {context.previewExcerpt?.trim() ? (
        <MaterialPreviewCard excerpt={context.previewExcerpt.trim()} />
      ) : null}

      <div className={cn('space-y-2', ingestedAt ? guidanceDetailContentGap : 'mt-2')}>
        {items.map((item) => (
          <PackageItemRow
            key={item.kind}
            item={item}
            assessmentTitle={assessmentTitle}
            unitCode={unitCode}
            assessmentId={context.id}
            previewExcerpt={context.previewExcerpt}
          />
        ))}
      </div>
    </section>
  )
}
