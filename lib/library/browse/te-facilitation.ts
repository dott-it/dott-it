import type { AssessmentBrowseItem, TeOpportunityBrowseItem, UnitBrowseModel } from './types'
import { pickLinkedTeOpportunityId } from '@/lib/library/ingest/link-te-opportunity'

export interface TeFacilitationFields {
  buildingTowards?: string
  whatToLookFor?: string
  whatToDo?: string
}

export function hasTeFacilitationContent(fields: TeFacilitationFields): boolean {
  return Boolean(
    fields.buildingTowards?.trim() ||
      fields.whatToLookFor?.trim() ||
      fields.whatToDo?.trim(),
  )
}

export function teFacilitationFromOpportunity(
  opportunity: TeOpportunityBrowseItem,
): TeFacilitationFields {
  return {
    buildingTowards: opportunity.buildingTowards,
    whatToLookFor: opportunity.whatToLookFor,
    whatToDo: opportunity.whatToDo,
  }
}

export function findOpportunityByIdInUnit(
  unit: UnitBrowseModel,
  opportunityId: string,
): TeOpportunityBrowseItem | undefined {
  for (const lesson of unit.lessons) {
    const match = lesson.opportunities.find((opportunity) => opportunity.id === opportunityId)
    if (match) {
      return match
    }
  }
  return undefined
}

function opportunityIfFacilitation(
  opportunity: TeOpportunityBrowseItem | undefined,
): TeOpportunityBrowseItem | undefined {
  if (!opportunity) {
    return undefined
  }
  return hasTeFacilitationContent(teFacilitationFromOpportunity(opportunity))
    ? opportunity
    : undefined
}

export function resolveLinkedTeOpportunity(
  unit: UnitBrowseModel,
  assessment: AssessmentBrowseItem,
): TeOpportunityBrowseItem | undefined {
  if (assessment.linkedTeOpportunityId) {
    const explicit = opportunityIfFacilitation(
      findOpportunityByIdInUnit(unit, assessment.linkedTeOpportunityId),
    )
    if (explicit) {
      return explicit
    }
  }

  const lesson = unit.lessons.find((row) => row.lessonNumber === assessment.lessonNumber)
  if (!lesson) {
    return undefined
  }

  const usedIds = new Set(
    lesson.assessments
      .filter((row) => row.id !== assessment.id && row.linkedTeOpportunityId)
      .map((row) => row.linkedTeOpportunityId as string),
  )
  const linkedId = pickLinkedTeOpportunityId(assessment.title, lesson.opportunities, usedIds)
  return linkedId ? opportunityIfFacilitation(findOpportunityByIdInUnit(unit, linkedId)) : undefined
}
