import type { Answers } from '@/types'

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim()
}

/** True for standalone First Name fields, not "Last Name, First Name" format prompts. */
export function isFirstNameFieldTitle(title: string): boolean {
  const t = normalizeTitle(title)
  return t.includes('first name') && !t.includes('last name')
}

/** True for standalone Last Name fields, not "Last Name, First Name" format prompts. */
export function isLastNameFieldTitle(title: string): boolean {
  const t = normalizeTitle(title)
  return t.includes('last name') && !t.includes('first name')
}

/**
 * Dedicated full-name prompts — matches generic titles with "name"
 * (e.g. "What is your name?", "Full Name") while excluding First/Last/Teacher.
 */
export function isFullStudentNameFieldTitle(title: string): boolean {
  const t = normalizeTitle(title)
  if (t.includes('teacher')) {
    return false
  }
  if (t.includes('please write your name in this format: last name, first name')) {
    return true
  }
  if (t.includes('first name') || t.includes('last name')) {
    return false
  }
  return t.includes('name')
}

/**
 * True for any form field that stores a learner's own name (not Teacher Name).
 * Used when encrypting answer values and when recovering display names.
 */
export function isStudentNameFieldTitle(title: string): boolean {
  return (
    isFirstNameFieldTitle(title) ||
    isLastNameFieldTitle(title) ||
    isFullStudentNameFieldTitle(title)
  )
}

/**
 * CryptoJS OpenSSL salted ciphertext base64 prefix ("Salted__").
 */
export function looksLikeAesCiphertext(value: string): boolean {
  return value.trim().startsWith('U2FsdGVkX1')
}

/**
 * Resolve a single name-field value to plaintext.
 * Prefers decrypt; if decrypt fails and the value is not ciphertext, keeps plaintext
 * (Soccer digitize stores title "Name"; some sync paths leave it unencrypted).
 * Never returns ciphertext or the sync placeholder "Encryption Error".
 */
export function toPlaintextNameFieldValue(
  value: string,
  decrypt: (value: string) => string,
): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'Encryption Error') {
    return ''
  }
  const decrypted = decrypt(trimmed).trim()
  if (decrypted) {
    return decrypted
  }
  if (looksLikeAesCiphertext(trimmed)) {
    return ''
  }
  return trimmed
}

/**
 * Decrypt name-field answers for display-name resolution.
 * Only touches student-name titles so plaintext fields (Hour, etc.) do not
 * trigger decrypt warnings.
 */
export function toPlaintextNameAnswers(
  answers: Pick<Answers, 'title' | 'value'>[],
  decrypt: (value: string) => string,
): Pick<Answers, 'title' | 'value'>[] {
  return answers.map((q) => ({
    title: q.title,
    value: isStudentNameFieldTitle(q.title)
      ? toPlaintextNameFieldValue(q.value, decrypt)
      : '',
  }))
}

/**
 * Resolve plaintext learner display name from form answers.
 * Prefers First + Last when both are present; otherwise a dedicated full-name field;
 * falls back to first or last alone when that is all the form captured.
 */
export function resolveLearnerDisplayName(
  answers: Pick<Answers, 'title' | 'value'>[],
): string {
  const first = answers.find((a) => isFirstNameFieldTitle(a.title))?.value?.trim()
  const last = answers.find((a) => isLastNameFieldTitle(a.title))?.value?.trim()
  if (first && last) {
    return `${first} ${last}`
  }

  const full = answers
    .find((a) => isFullStudentNameFieldTitle(a.title))
    ?.value?.trim()
  if (full) {
    return full
  }

  return first || last || ''
}

function parseAnswerRows(rawAnswer: unknown): Pick<Answers, 'title' | 'value'>[] | null {
  let parsed: unknown = rawAnswer
  if (typeof rawAnswer === 'string') {
    try {
      parsed = JSON.parse(rawAnswer)
    } catch {
      return null
    }
  }

  // Spotlight / legacy map shape: { "Name": "Jane", "Hour": "1" }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const rows: Pick<Answers, 'title' | 'value'>[] = []
    for (const [title, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string') {
        rows.push({ title, value })
      } else if (value != null && (typeof value === 'number' || typeof value === 'boolean')) {
        rows.push({ title, value: String(value) })
      }
    }
    return rows.length > 0 ? rows : null
  }

  if (!Array.isArray(parsed)) {
    return null
  }
  const rows: Pick<Answers, 'title' | 'value'>[] = []
  for (const item of parsed) {
    if (typeof item !== 'object' || item === null || !('title' in item) || !('value' in item)) {
      continue
    }
    const title = (item as { title: unknown }).title
    const value = (item as { value: unknown }).value
    if (typeof title !== 'string') {
      continue
    }
    if (typeof value === 'string') {
      rows.push({ title, value })
    } else if (value != null && (typeof value === 'number' || typeof value === 'boolean')) {
      rows.push({ title, value: String(value) })
    }
  }
  return rows.length > 0 ? rows : null
}

/**
 * Recover a plaintext learner display name from assessment answer JSON
 * when Learner.name is missing or failed to decrypt.
 */
export function resolveLearnerNameFromRawAnswer(
  rawAnswer: unknown,
  decrypt: (value: string) => string,
): string {
  const answers = parseAnswerRows(rawAnswer)
  if (!answers) {
    return ''
  }
  return resolveLearnerDisplayName(toPlaintextNameAnswers(answers, decrypt))
}

/**
 * Try multiple answer payloads (rawAnswer, studentAnswers[].answers, …).
 */
export function resolveLearnerNameFromAnswerSources(
  sources: unknown[],
  decrypt: (value: string) => string,
): string {
  for (const source of sources) {
    const name = resolveLearnerNameFromRawAnswer(source, decrypt)
    if (name) {
      return name
    }
  }
  return ''
}

/**
 * Last-resort label from a real student email local-part (not UUID placeholders).
 * Display-only — never persist this as Learner.name (blocks real First/Last recovery).
 */
export function displayNameFromLearnerEmail(email: string | null | undefined): string {
  if (!email || !email.includes('@')) {
    return ''
  }
  const local = email.slice(0, email.indexOf('@')).trim()
  if (!local) {
    return ''
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(local)) {
    return ''
  }
  return local
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

/**
 * True when a stored/decrypted display name is just the email local-part fallback
 * (e.g. "31jenneell" from 31jenneell@school.edu) rather than a real form name.
 */
export function isEmailLocalPartDisplayName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): boolean {
  const name = (displayName ?? '').trim()
  if (!name || !email?.includes('@')) {
    return false
  }
  const fromEmail = displayNameFromLearnerEmail(email)
  if (!fromEmail) {
    return false
  }
  return name.localeCompare(fromEmail, undefined, { sensitivity: 'accent' }) === 0
}

/**
 * Prisma `update` payload for learner.name — omit the field when empty so
 * sync never wipes an existing stored name.
 */
export function learnerNameUpdateData(
  encryptedName: string,
): { name: string } | Record<string, never> {
  return encryptedName ? { name: encryptedName } : {}
}
