/**
 * Utility functions for generating and working with assessment slugs
 */

/**
 * Generate a unique slug from assessment ID
 * This creates a consistent, URL-friendly identifier for assessments
 */
export function generateAssessmentSlug(assessmentId: string): string {
  // Simple hash function to convert ID to a consistent number
  let hash = 0
  for (let i = 0; i < assessmentId.length; i++) {
    const char = assessmentId.codePointAt(i) || 0
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Convert to base36 and format as xxxx-xxxx
  const base36 = Math.abs(hash).toString(36).padStart(8, '0').slice(0, 8)
  return base36.slice(0, 4) + '-' + base36.slice(4, 8)
}

/**
 * Get the base URL for the current environment
 * Uses globalThis.window.location.origin when available (client-side), otherwise falls back to demo.dott.it
 */
function getBaseUrl(): string {
  if (globalThis.window !== undefined) {
    // Client-side: use current origin from globalThis.window.location
    return globalThis.window.location.origin
  }
  
  // Server-side: fallback to production domain
  return 'https://dott-it.vercel.app'
}

/**
 * Generate a form URL from assessment ID
 * This creates the public URL that students will use to access the assessment
 */
export function generateFormUrl(assessmentId: string): string {
  const slug = generateAssessmentSlug(assessmentId)
  const baseUrl = getBaseUrl()
  return `${baseUrl}/form/${slug}`
}
