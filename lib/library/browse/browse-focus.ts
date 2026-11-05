import type { UnitBrowseModel } from './types'
import { unitBrowsePath } from './paths'

export interface BrowseFocus {
  kind: 'assessment' | 'opportunity'
  slug: string
}

export interface ResolvedBrowseFocus extends BrowseFocus {
  lessonNumber: number
}

export function parseBrowseFocusParam(value: string | null | undefined): BrowseFocus | null {
  if (!value) {
    return null
  }

  const match = /^(assessment|opportunity):(.+)$/.exec(value)
  if (!match) {
    return null
  }

  return {
    kind: match[1] as BrowseFocus['kind'],
    slug: decodeURIComponent(match[2]),
  }
}

export function buildBrowseFocusParam(focus: BrowseFocus): string {
  return `${focus.kind}:${encodeURIComponent(focus.slug)}`
}

export function unitBrowseFocusPath(
  grade: number,
  unitCode: string,
  kind: BrowseFocus['kind'],
  slug: string,
): string {
  return `${unitBrowsePath(grade, unitCode)}?focus=${buildBrowseFocusParam({ kind, slug })}`
}

export function browseActivityElementId(kind: BrowseFocus['kind'], slug: string): string {
  return `browse-activity-${kind}-${slug}`
}

export function findBrowseFocusInUnit(
  unit: UnitBrowseModel,
  focus: BrowseFocus | null,
): ResolvedBrowseFocus | null {
  if (!focus) {
    return null
  }

  for (const lesson of unit.lessons) {
    if (focus.kind === 'assessment') {
      const match = lesson.assessments.find((assessment) => assessment.slug === focus.slug)
      if (match) {
        return { ...focus, lessonNumber: lesson.lessonNumber }
      }
    } else {
      const match = lesson.opportunities.find((opportunity) => opportunity.slug === focus.slug)
      if (match) {
        return { ...focus, lessonNumber: lesson.lessonNumber }
      }
    }
  }

  return null
}
