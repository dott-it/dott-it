import { guidanceDetailContentGap, guidanceDetailSectionLabel } from '@/app/lib/components/library/detail/guidance-panel-ui'

interface MaterialPreviewCardProps {
  excerpt: string
}

export function MaterialPreviewCard({ excerpt }: MaterialPreviewCardProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <p className={guidanceDetailSectionLabel}>Preview</p>
      <p className={`${guidanceDetailContentGap} text-sm leading-relaxed text-muted-foreground`}>
        {excerpt}
      </p>
    </div>
  )
}
