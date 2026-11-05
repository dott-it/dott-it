export type AssessmentCategory = 'Pre' | 'Formative' | 'Summative' | 'Peer'

export type BrowseViewMode = 'all' | 'assessments-only'

export interface AssessmentBrowseItem {
  id: string
  slug: string
  title: string
  category: AssessmentCategory
  categoryLabel: string
  standards: string[]
  lessonNumber?: number
  description?: string
  externalLink?: string
  /** Ingest manifest id of the linked TE opportunity row, when present. */
  linkedTeOpportunityId?: string
}

export interface TeOpportunityBrowseItem {
  id: string
  slug: string
  title: string
  category: AssessmentCategory
  categoryLabel: string
  lessonNumber: number
  peCode?: string
  standards: string[]
  purpose: string
  keyFocus: string
  buildingTowards?: string
  whatToLookFor?: string
  whatToDo?: string
}

export interface LessonBrowseRow {
  lessonNumber: number
  topic: string
  drivingQuestion?: string
  pacingDays?: number
  assessments: AssessmentBrowseItem[]
  opportunities: TeOpportunityBrowseItem[]
}

export type TimelineMarkerKind = 'assessment' | 'opportunity'

export interface TimelineMarker {
  lessonNumber: number
  category: AssessmentCategory
  kind: TimelineMarkerKind
}

export interface TimelineSegment {
  lessonNumber: number
  label: string
  widthFraction: number
  markers: TimelineMarker[]
}

export interface UnitAssessmentShape {
  lessonCount: number
  opportunityCount: number
  assessmentCount: number
  totalPacingDays: number
}

export interface UnitBrowseModel {
  unitCode: string
  title: string
  subject: string
  description?: string
  drivingQuestion: string
  grade: number
  lessonCount: number
  duration?: string
  externalLink?: string
  assessmentShape: UnitAssessmentShape
  lessons: LessonBrowseRow[]
  timeline: TimelineSegment[]
}

export interface OpenSciEdSeedUnit {
  id: string
  unitCode: string
  title: string
  subject: string
  grade: number
  drivingQuestion: string
  description?: string
  standards: string[]
  lessons: number
  duration?: string
  status?: string
  link?: string
  assessmentTemplates: OpenSciEdSeedAssessmentTemplate[]
}

export interface OpenSciEdSeedAssessmentTemplate {
  id: string
  unitId: string
  title: string
  type: string
  lesson?: number
  description?: string
  standards?: string[]
}
