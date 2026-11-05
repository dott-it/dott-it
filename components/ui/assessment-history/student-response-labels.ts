/**
 * A leading question label is:
 *   optional "Question", "Problem", "Part", or "Q"
 *   + digits (including a dotted lesson number like "1.1")
 *   + an optional short sub-id
 *   + a closer (. ) : - or the end of the title)
 *   or the same token wrapped in parentheses: "(1)", "(a)", "(1a)"
 *
 * Sub-ids:
 *   - one letter glued to the number ("1a", "2b") when a boundary follows
 *   - exactly one letter after "." or "-" ("Q1.a", "1-a"); "1.the" is not a sub-id
 *   - a 2–3 letter uppercase code glued to the number ("Q1OA") when a boundary follows
 *   - a letter alone, closed by punctuation ("a.", "a-", "a)", "a:")
 *   - "Part A." after the word Part, when punctuation closes the letter
 *
 * "1about" is not a label: the letters run into a word. A number or "Part A"
 * followed only by a space ("7 miles per hour", "Part A of the experiment")
 * is a sentence, not a question id. The badge then falls back to the row
 * position and the title stays intact.
 */
const LABEL_BOUNDARY = /[\s.:)\-\]]/
const LETTER_LABEL_SEPARATOR = /[.\-):]/

interface ParsedQuestionLabel {
  id: string
  rest: string
}

function isLabelBoundary(char: string | undefined): boolean {
  return char === undefined || LABEL_BOUNDARY.test(char)
}

/** Punctuation or end of title. A space before more words is a sentence, not a label. */
function isHardLabelCloser(char: string | undefined): boolean {
  return char === undefined || /[.:)-]/.test(char)
}

function isLetter(char: string | undefined): boolean {
  return char !== undefined && /[a-z]/i.test(char)
}

function readLetters(title: string, start: number, max: number): string {
  let end = start
  while (end < title.length && end - start < max && isLetter(title[end])) {
    end += 1
  }
  return title.slice(start, end)
}

/** Longest glued suffix that is a single letter or a short uppercase code. */
function gluedSuffixLength(title: string, start: number): number {
  const letters = readLetters(title, start, 3)
  if (!letters) return 0

  for (let length = letters.length; length >= 2; length -= 1) {
    const chunk = letters.slice(0, length)
    const isUpperCode = chunk === chunk.toUpperCase() && /[A-Z]/.test(chunk)
    if (isUpperCode && isHardLabelCloser(title[start + length])) {
      return length
    }
  }

  if (isHardLabelCloser(title[start + 1])) {
    return 1
  }
  return 0
}

function formatQuestionId(number: string, suffix: string): string {
  if (!suffix) return number
  if (suffix.length === 1 || suffix !== suffix.toUpperCase()) {
    return `${number}${suffix.toLowerCase()}`
  }
  return `${number}${suffix}`
}

/** "a. Explain", "b)", "c-", "d:" — a sub-part with no question number. */
function parseLetterOnlyQuestionLabel(title: string): ParsedQuestionLabel | null {
  let index = 0
  while (title[index] === ' ' || title[index] === '\t') index += 1

  if (!isLetter(title[index]) || isLetter(title[index + 1])) return null
  if (!LETTER_LABEL_SEPARATOR.test(title[index + 1] ?? '')) return null

  return {
    id: title[index].toLowerCase(),
    rest: title.slice(index + 2).trim(),
  }
}

function consumeTrailingPunctuation(title: string, index: number): number {
  if (LABEL_BOUNDARY.test(title[index] ?? '') && title[index] !== undefined && !/\s/.test(title[index])) {
    return index + 1
  }
  return index
}

/** "(a) Explain", "(1) How", "(1a) Draw" — the label sits inside parentheses. */
function parseParenthesizedQuestionLabel(title: string): ParsedQuestionLabel | null {
  let index = 0
  while (title[index] === ' ' || title[index] === '\t') index += 1
  if (title[index] !== '(') return null

  const close = title.indexOf(')', index + 1)
  if (close === -1) return null
  const inner = title.slice(index + 1, close).trim()
  if (!inner || inner.length > 6) return null

  let id: string | null = null
  if (/^[a-z]$/i.test(inner)) {
    id = inner.toLowerCase()
  } else {
    const parsed = parseNumberedQuestionLabel(inner)
    if (parsed && !parsed.rest) id = parsed.id
  }
  if (!id) return null

  const after = consumeTrailingPunctuation(title, close + 1)
  return { id, rest: title.slice(after).trim() }
}

function parseNumberedQuestionLabel(title: string): ParsedQuestionLabel | null {
  let index = 0
  while (title[index] === ' ' || title[index] === '\t') index += 1

  const wordPrefix = title.slice(index).match(/^(?:question|problem|part)(?=\s+\S)/i)
  const qPrefix = wordPrefix ? null : title.slice(index).match(/^q(?=\s*\d)/i)
  const prefix = wordPrefix ?? qPrefix
  if (prefix) {
    index += prefix[0].length
    while (title[index] === ' ' || title[index] === '\t') index += 1
  }

  const digits = title.slice(index).match(/^\d+/)
  if (!digits) {
    if (!wordPrefix || !isLetter(title[index])) return null
    const length = gluedSuffixLength(title, index)
    if (length === 0) return null
    const suffix = title.slice(index, index + length)
    const after = consumeTrailingPunctuation(title, index + length)
    return {
      id: formatQuestionId('', suffix),
      rest: title.slice(after).trim(),
    }
  }
  index += digits[0].length

  const dottedMinor = title.slice(index).match(/^\.(\d+)/)
  if (dottedMinor && isLabelBoundary(title[index + dottedMinor[0].length]) || (
    dottedMinor && isLetter(title[index + dottedMinor[0].length]) && isLabelBoundary(title[index + dottedMinor[0].length + 1])
  )) {
    let end = index + dottedMinor[0].length
    let extra = ''
    if (isLetter(title[end]) && isLabelBoundary(title[end + 1])) {
      extra = title[end]
      end += 1
    }
    end = consumeTrailingPunctuation(title, end)
    return {
      id: formatQuestionId(`${digits[0]}.${dottedMinor[1]}`, extra),
      rest: title.slice(end).trim(),
    }
  }

  let suffix = ''
  let closedBySubIdPunctuation = false
  const mark = title[index]
  // Separated sub-ids are a single letter ("Q1.a", "1-a"), not a word ("1.the").
  const markStartsSubId =
    (mark === '.' || mark === '-') &&
    isLetter(title[index + 1]) &&
    isLabelBoundary(title[index + 2])
  if (markStartsSubId) {
    suffix = title[index + 1]
    index += 2
    closedBySubIdPunctuation = true
  } else if (isLetter(mark)) {
    const length = gluedSuffixLength(title, index)
    if (length === 0) return null
    suffix = title.slice(index, index + length)
    index += length
  }

  const hasMoreTitle = title.slice(index).trim() !== ''
  if (!closedBySubIdPunctuation && !isHardLabelCloser(title[index]) && hasMoreTitle) {
    return null
  }

  index = consumeTrailingPunctuation(title, index)

  return {
    id: formatQuestionId(digits[0], suffix),
    rest: title.slice(index).trim(),
  }
}

export function parseLeadingQuestionLabel(title: string): ParsedQuestionLabel | null {
  return (
    parseParenthesizedQuestionLabel(title) ??
    parseNumberedQuestionLabel(title) ??
    parseLetterOnlyQuestionLabel(title)
  )
}

/**
 * Badge text for a response row.
 * Uses a leading question number when the title has one, otherwise "Question {index + 1}".
 */
export function getQuestionLabel(title: string, index: number): string {
  const parsed = parseLeadingQuestionLabel(title)
  if (parsed) {
    return `Question ${parsed.id}`
  }
  return `Question ${index + 1}`
}

/**
 * Returns the rest of the title after a leading question number so the badge is not repeated.
 * E.g. "Question 1a. The Company's Claim: ..." -> "The Company's Claim: ..."
 * E.g. "Q1. How would the forces..." -> "How would the forces..."
 */
export function getTitleSuffix(title: string): string {
  const parsed = parseLeadingQuestionLabel(title)
  if (!parsed?.rest) {
    return title
  }
  return parsed.rest
}
