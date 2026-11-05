/** Eddo staff emails include the eddolearning.com domain (case-insensitive). */
export function isEddoStaffEmail(email: string | null | undefined): boolean {
  return (email ?? '').toLowerCase().includes('eddolearning.com')
}
