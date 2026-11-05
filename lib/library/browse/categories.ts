import type { AssessmentCategory, TimelineMarkerKind, TimelineSegment } from './types'

const CATEGORY_MAP: Record<string, AssessmentCategory> = {
  'pre-assessment': 'Pre',
  pre: 'Pre',
  formative: 'Formative',
  summative: 'Summative',
  'performance task': 'Summative',
  peer: 'Peer',
  'peer feedback': 'Peer',
  'peer-feedback': 'Peer',
}

const CATEGORY_LABELS: Record<AssessmentCategory, string> = {
  Pre: 'Pre-assessment',
  Formative: 'Formative assessment',
  Summative: 'Summative assessment',
  Peer: 'Peer assessment',
}

const CATEGORY_SHORT_LABELS: Record<AssessmentCategory, string> = {
  Pre: 'Pre',
  Formative: 'Formative',
  Summative: 'Summative',
  Peer: 'Peer',
}

/** Filled markers aligned with opensci-assess-hub rhythm strip (dott-it palette). */
const FILLED_CATEGORY_MARKER: Record<AssessmentCategory, string> = {
  Pre: 'rounded-full border border-ose-accent bg-ose-accent/50',
  Formative: 'rounded-full bg-ose-accent',
  Summative: 'rounded-full bg-ose-green',
  Peer: 'rounded-[2px] bg-ose-navy/55',
}

export interface TimelineLegendEntry {
  id: string
  label: string
  className: string
}

export function normalizeAssessmentCategory(rawType: string): AssessmentCategory {
  const key = rawType.trim().toLowerCase()
  return CATEGORY_MAP[key] ?? 'Formative'
}

export function getCategoryLabel(category: AssessmentCategory): string {
  return CATEGORY_LABELS[category]
}

export function getCategoryShortLabel(category: AssessmentCategory): string {
  return CATEGORY_SHORT_LABELS[category]
}

/** Timeline markers use category colors for assessments and violet for TE opportunities. */
export function getTimelineMarkerClass(
  category: AssessmentCategory,
  kind: TimelineMarkerKind,
): string {
  if (kind === 'opportunity') {
    return getOpportunityMarkerClass()
  }
  return FILLED_CATEGORY_MARKER[category]
}

export function getCategorySwatchClass(category: AssessmentCategory): string {
  return FILLED_CATEGORY_MARKER[category]
}

/** Violet marker for opportunity rows in the lesson table (TE call-outs). */
export function getOpportunityMarkerClass(): string {
  return 'rounded-full bg-ose-violet'
}

export const TIMELINE_LEGEND: TimelineLegendEntry[] = [
  {
    id: 'opportunity',
    label: 'Assessment opportunity',
    className: getOpportunityMarkerClass(),
  },
  {
    id: 'Pre',
    label: 'Pre-assessment',
    className: FILLED_CATEGORY_MARKER.Pre,
  },
  {
    id: 'Formative',
    label: 'Formative assessment',
    className: FILLED_CATEGORY_MARKER.Formative,
  },
  {
    id: 'Summative',
    label: 'Summative assessment',
    className: FILLED_CATEGORY_MARKER.Summative,
  },
  {
    id: 'Peer',
    label: 'Peer assessment',
    className: FILLED_CATEGORY_MARKER.Peer,
  },
]

export function getActiveTimelineLegend(timeline: TimelineSegment[]): TimelineLegendEntry[] {
  const activeCategories = new Set<AssessmentCategory>()
  let hasOpportunities = false

  for (const segment of timeline) {
    for (const marker of segment.markers) {
      activeCategories.add(marker.category)
      if (marker.kind === 'opportunity') {
        hasOpportunities = true
      }
    }
  }

  return TIMELINE_LEGEND.filter((entry) => {
    if (entry.id === 'opportunity') {
      return hasOpportunities
    }
    return activeCategories.has(entry.id as AssessmentCategory)
  })
}
