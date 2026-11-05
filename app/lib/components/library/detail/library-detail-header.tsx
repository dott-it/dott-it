import {
  libraryDetailHeaderEyebrow,
  libraryDetailTitle,
  libraryStandardPill,
} from '@/app/lib/components/library/detail/guidance-panel-ui'

interface LibraryDetailHeaderProps {
  unitCode: string
  lessonNumber?: number
  peCode?: string
  title: string
  standards: string[]
  rowKind: string
  categoryLabel: string
}

function formatLessonLabel(lessonNumber?: number): string | undefined {
  if (!lessonNumber) {
    return undefined
  }
  return `Lesson ${String(lessonNumber).padStart(2, '0')}`
}

export function LibraryDetailHeader({
  unitCode,
  lessonNumber,
  peCode,
  title,
  standards,
  rowKind,
  categoryLabel,
}: LibraryDetailHeaderProps) {
  const lessonLabel = formatLessonLabel(lessonNumber)
  const contextParts = [`OpenSciEd Unit ${unitCode}`]
  if (lessonLabel) {
    contextParts.push(lessonLabel)
  }
  if (peCode) {
    contextParts.push(peCode)
  }

  return (
    <header className="space-y-2 border-b border-border pb-6">
      <p className={libraryDetailHeaderEyebrow}>{contextParts.join(' · ')}</p>
      <h1 className={libraryDetailTitle}>{title}</h1>
      <div className="space-y-2 pt-1 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-1.5">
          {standards.map((standard) => (
            <span key={standard} className={libraryStandardPill}>
              {standard}
            </span>
          ))}
          <span className="text-xs">
            {rowKind} · {categoryLabel}
          </span>
        </div>
      </div>
    </header>
  )
}
