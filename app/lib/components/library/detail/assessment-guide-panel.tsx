import type { ReactNode } from 'react'
import type { AssessmentGuide } from '@/lib/library/assessment-guide/types'
import {
  guidanceBlockStack,
  guidanceBody,
  guidancePanelEyebrow,
  guidancePanelIntro,
  guidancePanelShell,
  guidanceSectionDivider,
  guidanceSectionStack,
  guidanceSectionTitle,
  guidanceSubheading,
  libraryStandardPill,
} from '@/app/lib/components/library/detail/guidance-panel-ui'
import { cn } from '@/lib/utils'

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className={cn('list-disc space-y-1.5 pl-4', guidanceBody)}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

function GuideSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={guidanceSectionDivider}>
      <h3 className={guidanceSectionTitle}>{title}</h3>
      <div className={guidanceSectionStack}>{children}</div>
    </section>
  )
}

export function AssessmentGuidePanel({ guide }: { guide: AssessmentGuide }) {
  return (
    <section className={guidancePanelShell} aria-labelledby="assessment-guide-heading">
      <div className="space-y-1.5">
        <h2 id="assessment-guide-heading" className={guidancePanelEyebrow}>
          Assessment guide
        </h2>
        <p className={guidancePanelIntro}>
          How to read student work on this assessment — standards alignment, what strong
          understanding looks like, and common gaps.
        </p>
      </div>

      <div className={guidanceBlockStack}>
        {guide.progression.early.trim() || guide.progression.target.trim() ? (
          <GuideSection title="Learning progression">
            {guide.progression.early.trim() ? (
              <div>
                <p className={guidanceSubheading}>Early understanding</p>
                <p className={guidanceBody}>{guide.progression.early}</p>
              </div>
            ) : null}
            {guide.progression.target.trim() ? (
              <div>
                <p className={guidanceSubheading}>Target understanding</p>
                <p className={guidanceBody}>{guide.progression.target}</p>
              </div>
            ) : null}
          </GuideSection>
        ) : null}

        <GuideSection title="Standards alignment">
          <div className="flex flex-wrap gap-1">
            {guide.alignment.performanceExpectations.map((pe) => (
              <span key={pe} className={libraryStandardPill}>
                {pe}
              </span>
            ))}
            {guide.alignment.lessonPe ? (
              <span className={libraryStandardPill}>{guide.alignment.lessonPe}</span>
            ) : null}
          </div>
          {guide.alignment.note ? <p className={guidanceBody}>{guide.alignment.note}</p> : null}
        </GuideSection>

        {guide.understanding.strong.length > 0 ||
        guide.understanding.emerging.length > 0 ||
        guide.understanding.gaps.length > 0 ? (
          <GuideSection title="What understanding looks like">
            {guide.understanding.strong.length > 0 ? (
              <div>
                <p className={guidanceSubheading}>Strong</p>
                <BulletList items={guide.understanding.strong} />
              </div>
            ) : null}
            {guide.understanding.emerging.length > 0 ? (
              <div>
                <p className={guidanceSubheading}>Emerging</p>
                <BulletList items={guide.understanding.emerging} />
              </div>
            ) : null}
            {guide.understanding.gaps.length > 0 ? (
              <div>
                <p className={guidanceSubheading}>Gaps</p>
                <BulletList items={guide.understanding.gaps} />
              </div>
            ) : null}
          </GuideSection>
        ) : null}

        {guide.misconceptions.length > 0 ? (
          <GuideSection title="Common misconceptions">
            <BulletList items={guide.misconceptions} />
          </GuideSection>
        ) : null}

        {guide.studentSamples.length > 0 ? (
          <GuideSection title="Example student responses">
            {guide.studentSamples.map((sample) => (
              <div
                key={sample.label}
                className="space-y-1.5 rounded-md border border-border bg-card/80 p-3"
              >
                <p className={guidanceSubheading}>{sample.label}</p>
                <p className={cn(guidanceBody, 'italic')}>{sample.excerpt}</p>
              </div>
            ))}
          </GuideSection>
        ) : null}
      </div>
    </section>
  )
}
