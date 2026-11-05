import guidesUnit81 from '@/data/assessment-guides/unit-8.1.json' with { type: 'json' }
import { pickLinkedTeOpportunityId } from '@/lib/library/ingest/link-te-opportunity'
import { findIngestedAssessment, loadIngestedManifest } from '@/lib/library/ingest/load-manifest'
import type { IngestedAssessment } from '@/lib/library/ingest/types'
import {
  cleanOseGuidanceText,
  parseOseGuidanceBlocks,
} from '@/lib/library/guidance/ose-guidance-text'
import type { AssessmentGuide } from './types'

const GUIDES_BY_UNIT: Record<string, Record<string, AssessmentGuide>> = {
  '8.1': guidesUnit81 as Record<string, AssessmentGuide>,
}

function bulletsFromLookListen(text: string): string[] {
  const blocks = parseOseGuidanceBlocks(text, 'lookListenFor')
  const items: string[] = []
  for (const block of blocks) {
    if (block.listItems?.length) {
      items.push(...block.listItems)
      continue
    }
    if (block.body.trim()) {
      items.push(block.body.trim())
    }
  }
  return items
}

function synthesizeGuideFromIngest(
  unitCode: string,
  assessmentId: string,
): AssessmentGuide | null {
  const row = findIngestedAssessment(unitCode, assessmentId)
  if (!row || row.source === 'te-opportunity') {
    return null
  }

  const manifest = loadIngestedManifest(unitCode)
  if (!manifest) {
    return null
  }

  const lessonTe = manifest.assessments.filter(
    (candidate) => candidate.source === 'te-opportunity' && candidate.lessonNum === row.lessonNum,
  )
  const linkedId =
    row.linkedTeOpportunityId?.trim() ||
    pickLinkedTeOpportunityId(row.title, lessonTe)
  const te: IngestedAssessment | undefined = linkedId
    ? manifest.assessments.find((candidate) => candidate.id === linkedId)
    : undefined
  if (!te) {
    return null
  }

  const target = te.buildingTowards
    ? cleanOseGuidanceText(te.buildingTowards, 'buildingTowards')
    : ''
  const strong = te.lookListenFor ? bulletsFromLookListen(te.lookListenFor) : []
  if (!target && strong.length === 0) {
    return null
  }

  return {
    assessmentId,
    status: 'draft',
    progression: {
      early: '',
      target,
    },
    alignment: {
      performanceExpectations: row.standards,
      lessonPe: te.peCode?.trim() || undefined,
      note: target || undefined,
    },
    understanding: {
      strong,
      emerging: [],
      gaps: [],
    },
    misconceptions: [],
    studentSamples: [],
  }
}

export function assessmentGuideFor(
  unitCode: string,
  assessmentId: string,
): AssessmentGuide | null {
  const curated = GUIDES_BY_UNIT[unitCode]?.[assessmentId]
  if (curated) {
    return curated
  }
  return synthesizeGuideFromIngest(unitCode, assessmentId)
}
