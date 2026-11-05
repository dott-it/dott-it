
// Generated TypeScript interfaces for OpenSciEd Units

export interface NGSSStandard {
  code: string
  title: string
  description: string
  grade_level: string
  domain: string
  url: string
}

export interface OpenSciEdUnit {
  id: string
  unitCode: string
  title: string
  subject: string
  grade: number
  drivingQuestion: string
  description: string
  standards: string[]
  lessons: number
  duration: string
  status: "Released" | "Coming Soon"
  link: string
  assessmentTemplates: AssessmentTemplate[]
}

export interface AssessmentTemplate {
  id: string
  unitId: string
  title: string
  type: "Pre-Assessment" | "Formative" | "Summative" | "Performance Task"
  lesson?: number
  description: string
  pointValue: number
  estimatedDuration: string
  standards: string[]
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  tags: string[]
  rubric?: RubricCriteria[]
}

export interface RubricCriteria {
  criterion: string
  excellent: string
  proficient: string
  developing: string
  beginning: string
}
