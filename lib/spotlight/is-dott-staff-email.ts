/** Dott.it staff emails include the demo.dott.it domain (case-insensitive). */
export function isDottStaffEmail(email: string | null | undefined): boolean {
  const value = (email ?? '').toLowerCase()
  return value.includes('demo.dott.it') || value.includes('dott-it.vercel.app')
}
