export interface AssessmentGuideProgression {
  early: string
  target: string
}

export interface AssessmentGuideAlignment {
  performanceExpectations: string[]
  lessonPe?: string
  note?: string
}

export interface AssessmentGuideUnderstanding {
  strong: string[]
  emerging: string[]
  gaps: string[]
}

export interface AssessmentGuideSample {
  label: string
  excerpt: string
  note?: string
}

export interface AssessmentGuide {
  assessmentId: string
  status: 'draft' | 'published'
  progression: AssessmentGuideProgression
  alignment: AssessmentGuideAlignment
  understanding: AssessmentGuideUnderstanding
  misconceptions: string[]
  studentSamples: AssessmentGuideSample[]
}
