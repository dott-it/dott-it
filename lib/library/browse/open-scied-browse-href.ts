/**
 * Map a course grade_level label to an OpenSciEd library browse path.
 * High School / Elementary are not browsable in the OpenSciEd library yet.
 */
export function openSciEdBrowseHrefForGradeLevel(gradeLevel: string): string {
  const middleSchoolGrades: Record<string, number> = {
    'Grade 6': 6,
    'Grade 7': 7,
    'Grade 8': 8,
    '6': 6,
    '7': 7,
    '8': 8,
  }
  const grade = middleSchoolGrades[gradeLevel.trim()]
  if (grade) {
    return `/library/openscied/middle-school/grade-${grade}`
  }
  return '/library/openscied'
}
