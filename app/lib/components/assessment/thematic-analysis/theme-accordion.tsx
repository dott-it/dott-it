'use client'

import type { ThematicAnalysisItem } from '@/types'
import { ExpandableCitationItem } from './citation-item'

interface ThemeAccordionProps {
  items: ThematicAnalysisItem[]
  assessmentId: string
}

export function ThemeAccordion({
  items,
  assessmentId,
}: ThemeAccordionProps) {
  const needs = items.filter((item) => item.type === 'need')
  const strengths = items.filter((item) => item.type === 'strength')

  return (
    <div className="space-y-8">
      {needs.length > 0 && (
        <ThemeGroup
          label="COMMON NEEDS"
          variant="need"
          items={needs}
          assessmentId={assessmentId}
        />
      )}
      {strengths.length > 0 && (
        <ThemeGroup
          label="COMMON STRENGTHS"
          variant="strength"
          items={strengths}
          assessmentId={assessmentId}
        />
      )}
    </div>
  )
}

interface ThemeGroupProps {
  label: string
  variant: 'need' | 'strength'
  items: ThematicAnalysisItem[]
  assessmentId: string
}

function ThemeGroup({
  label,
  variant,
  items,
  assessmentId,
}: ThemeGroupProps) {
  const borderColor =
    variant === 'need' ? 'border-l-orange-500' : 'border-l-green-500'
  const textColor =
    variant === 'need' ? 'text-orange-600' : 'text-green-600'

  return (
    <div className={`border-l-4 pl-4 ${borderColor}`}>
      <h4 className={`mb-4 text-xs font-bold uppercase tracking-wider ${textColor}`}>
        {label}
      </h4>
      <div className="space-y-3">
        {items.map((item) => (
          <ExpandableCitationItem
            key={item.id}
            itemId={item.id}
            title={item.title}
            description={item.description}
            citations={item.citations}
            assessmentId={assessmentId}
          />
        ))}
      </div>
    </div>
  )
}
