import type { ReactNode } from 'react'
import type { TeFacilitationFields } from '@/lib/library/browse/te-facilitation'
import { hasTeFacilitationContent } from '@/lib/library/browse/te-facilitation'
import {
  parseOseGuidanceBlocks,
  type OseGuidanceBlock,
  type OseGuidanceSection,
} from '@/lib/library/guidance/ose-guidance-text'
import {
  guidanceBody,
  guidancePanelEyebrow,
  guidancePanelIntro,
  guidancePanelShell,
  guidanceSectionDivider,
  guidanceSectionTitle,
  guidanceSubheading,
} from '@/app/lib/components/library/detail/guidance-panel-ui'
import { cn } from '@/lib/utils'

const SECTIONS: {
  key: OseGuidanceSection
  field: keyof TeFacilitationFields
  title: string
}[] = [
  { key: 'buildingTowards', field: 'buildingTowards', title: 'Building towards' },
  { key: 'lookListenFor', field: 'whatToLookFor', title: 'What to look / listen for' },
  { key: 'whatToDo', field: 'whatToDo', title: 'What to do' },
]

function GuidanceBulletList({ items }: { items: string[] }) {
  return (
    <ul className={cn('mt-2 list-disc space-y-1.5 pl-4', guidanceBody)}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function GuidanceBlock({ block }: { block: OseGuidanceBlock }) {
  if (block.isTopicLine) {
    return <p className={guidanceSubheading}>{block.body}</p>
  }

  if (block.label) {
    return (
      <div className="space-y-1.5">
        <p className={guidanceSubheading}>{block.label}</p>
        {block.body ? <p className={guidanceBody}>{block.body}</p> : null}
        {block.listItems && block.listItems.length > 0 ? (
          <GuidanceBulletList items={block.listItems} />
        ) : null}
      </div>
    )
  }

  if (block.listItems && block.listItems.length > 0) {
    return <GuidanceBulletList items={block.listItems} />
  }

  if (!block.body) {
    return null
  }

  return <p className={guidanceBody}>{block.body}</p>
}

function GuidanceSection({
  title,
  sectionKey,
  text,
}: {
  title: string
  sectionKey: OseGuidanceSection
  text: string
}) {
  const blocks = parseOseGuidanceBlocks(text, sectionKey)
  if (blocks.length === 0) {
    return null
  }

  return (
    <section className={guidanceSectionDivider}>
      <h3 className={guidanceSectionTitle}>{title}</h3>
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <GuidanceBlock key={`${sectionKey}-${index}`} block={block} />
        ))}
      </div>
    </section>
  )
}

interface TeacherEditionGuidancePanelProps extends TeFacilitationFields {
  footer?: ReactNode
}

export function TeacherEditionGuidancePanel({
  buildingTowards,
  whatToLookFor,
  whatToDo,
  footer,
}: TeacherEditionGuidancePanelProps) {
  const fields = { buildingTowards, whatToLookFor, whatToDo }
  if (!hasTeFacilitationContent(fields)) {
    return null
  }

  const activeSections = SECTIONS.filter((section) => Boolean(fields[section.field]?.trim()))

  return (
    <section className={guidancePanelShell} aria-labelledby="from-te-heading">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="from-te-heading" className={guidancePanelEyebrow}>
            From Teacher Edition
          </h2>
          {footer}
        </div>
        <p className={guidancePanelIntro}>
          Facilitation guidance from the lesson plan — what to notice in student thinking and how to
          respond while teaching.
        </p>
      </div>

      <div className="space-y-1">
        {activeSections.map((section) => (
          <GuidanceSection
            key={section.key}
            title={section.title}
            sectionKey={section.key}
            text={fields[section.field]!.trim()}
          />
        ))}
      </div>
    </section>
  )
}
