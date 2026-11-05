import { decryptName } from '@/app/lib/utils'

export function learnerDisplayName(
  encryptedName: string | undefined,
  learnerId: string,
): string {
  const decrypted = decryptName(encryptedName || '').trim()
  if (decrypted) return decrypted
  return `Student ${learnerId.slice(0, 8)}`
}
