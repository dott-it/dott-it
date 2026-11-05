/**
 * Utility functions for formatting assessment scores
 */

/**
 * Converts a percentage score to "x/x" format
 * @param score - The score as a percentage (0-100)
 * @param totalPoints - The total possible points for the assessment
 * @returns Formatted score string like "8/10" or "85/100"
 */
export function formatScoreAsFraction(
  score: number | null | undefined,
  totalPoints: number = 10,
): string {
  if (score === null || score === undefined) {
    return '—'
  }

  // Convert percentage to actual points earned
  const pointsEarned = Math.round((score / 100) * totalPoints)

  return `${pointsEarned}/${totalPoints}`
}

/**
 * Gets the total points for an assessment based on its template
 * @param assessmentTemplate - The assessment template
 * @returns Total points for the assessment
 */
export function getAssessmentTotalPoints(assessmentTemplate?: { pointValue?: number }): number {
  return assessmentTemplate?.pointValue || 10
}

/**
 * Formats a score for display, converting from percentage to fraction format
 * @param score - The score as a percentage
 * @param assessmentTemplate - The assessment template to get total points
 * @param maxScore - The maximum score for the assessment (overrides template)
 * @returns Formatted score string
 */
export function formatScoreForDisplay(
  score: number | null | undefined,
  assessmentTemplate?: { pointValue?: number },
  maxScore?: number,
): string {
  const totalPoints = maxScore || getAssessmentTotalPoints(assessmentTemplate)
  return formatScoreAsFraction(score, totalPoints)
}
