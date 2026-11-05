import { decryptName } from './crypto-utils'
import { getSpiritAnimal } from './spirit-animal'

export const MYSTICAL_CREATURE_LABEL = 'Mystical Creature'

export function hasStudentNameSalt(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_STUDENT_NAME_SALT?.trim())
}

function isUnavailableDecryptedName(name: string): boolean {
  const trimmed = name.trim()
  return (
    trimmed === '' ||
    trimmed === 'Encryption Error' ||
    /^Student [a-z0-9]{8}$/i.test(trimmed)
  )
}

/**
 * Label shown when real names are hidden. Without name salt, always returns Mystical Creature
 * so spirit animals are not derived from ciphertext, error strings, or stored name snapshots.
 */
export function getAnonymizedStudentLabel(
  learnerId: string,
  learnerName?: string | null,
): string {
  if (!hasStudentNameSalt()) {
    return MYSTICAL_CREATURE_LABEL
  }

  const name = (learnerName ?? '').trim()
  if (!isUnavailableDecryptedName(name)) {
    return getSpiritAnimal(name)
  }

  return getSpiritAnimal(learnerId || '')
}

/**
 * Resolves a student label for UI that supports toggling real names (lists, headers, citations).
 */
export function getStudentDisplayName(options: {
  showRealNames: boolean
  learnerName?: string | null
  learnerId?: string | null
}): string {
  const { showRealNames, learnerName = '', learnerId = '' } = options
  const idSuffix = learnerId?.slice(0, 8) || 'Unknown'

  if (showRealNames) {
    if (!hasStudentNameSalt()) {
      return MYSTICAL_CREATURE_LABEL
    }
    const trimmed = (learnerName ?? '').trim()
    if (trimmed && !isUnavailableDecryptedName(trimmed)) {
      return trimmed
    }
    const decrypted = decryptName(learnerName || '').trim()
    if (decrypted && !isUnavailableDecryptedName(decrypted)) {
      return decrypted
    }
    return `Student ${idSuffix}`
  }

  return getAnonymizedStudentLabel(learnerId ?? '', learnerName)
}
