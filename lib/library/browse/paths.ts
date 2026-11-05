export const MIDDLE_SCHOOL_GRADES = [6, 7, 8] as const

export type MiddleSchoolGrade = (typeof MIDDLE_SCHOOL_GRADES)[number]

export function gradeToSlug(grade: number): string {
  return `grade-${grade}`
}

export function slugToGrade(slug: string): number | null {
  const match = /^grade-(\d+)$/.exec(slug)
  if (!match) {
    return null
  }
  return Number.parseInt(match[1], 10)
}

export function unitBrowsePath(grade: number, unitCode: string): string {
  return `/library/openscied/middle-school/${gradeToSlug(grade)}/units/${unitCode}`
}

export function assessmentDetailPath(grade: number, unitCode: string, slug: string): string {
  return `${unitBrowsePath(grade, unitCode)}/assessments/${slug}`
}

export function opportunityDetailPath(grade: number, unitCode: string, slug: string): string {
  return `${unitBrowsePath(grade, unitCode)}/opportunities/${slug}`
}
