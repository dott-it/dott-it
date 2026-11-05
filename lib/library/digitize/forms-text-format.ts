/**
 * Forms API accepts only plain strings — no rich-text bold.
 * Titles already render with Forms' native heavier weight (like section headers
 * in the editor). Do NOT fake bold with Mathematical Bold Unicode glyphs; that
 * looks off compared to real Forms title styling.
 *
 * Markdown `**…**` markers from the LLM are stripped to plain text.
 */

/** Map A–Z / a–z / 0–9 to Mathematical Bold code points (legacy / tests only). */
export function toUnicodeBold(value: string): string {
  const boldCapitalA = 0x1_D4_00
  const boldSmallA = 0x1_D4_1A
  const boldDigitZero = 0x1_D7_CE
  let out = ''
  for (const char of value) {
    const code = char.codePointAt(0)
    if (code === undefined) {
      continue
    }
    if (code >= 65 && code <= 90) {
      out += String.fromCodePoint(boldCapitalA + (code - 65))
    } else if (code >= 97 && code <= 122) {
      out += String.fromCodePoint(boldSmallA + (code - 97))
    } else if (code >= 48 && code <= 57) {
      out += String.fromCodePoint(boldDigitZero + (code - 48))
    } else {
      out += char
    }
  }
  return out
}

/** @deprecated Prefer {@link stripMarkdownBoldMarkers} — Unicode bold looks unnatural in Forms. */
export function applyMarkdownBoldToUnicode(value: string): string {
  return stripMarkdownBoldMarkers(value)
}

/** Remove `**segment**` markers, keeping the inner text plain. */
export function stripMarkdownBoldMarkers(value: string): string {
  return value.replaceAll(/\*\*([^*]+)\*\*/g, '$1')
}

/**
 * Drop trivial leading-verb emphasis like `**Use** the diagrams…`.
 */
export function stripTrivialLeadingVerbBold(value: string): string {
  return value.replace(
    /^\*\*(Draw|Sketch|Use|Make|List|Explain|Describe|Predict|Record|Show|Determine|Design|Answer|Compare|Identify|How)\*\*(\s+)/i,
    '$1$2',
  )
}

/**
 * Remove markdown bold around question numbers (2. / 2a.) and choice letters (a. / b.).
 */
export function stripQuestionNumberAndOptionBold(value: string): string {
  return value
    .replaceAll(/\*\*(\d+[a-z]?[.)]?)\*\*/gi, '$1')
    .replaceAll(/\*\*([a-d][.)])\*\*/gi, '$1')
}

/**
 * Prepare a Form title as plain text.
 * Forms already styles titles with native weight — leave Bat/Pitcher/Name/etc. unstyled.
 */
export function prepareFormsTitle(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }

  const cleaned = stripMarkdownBoldMarkers(
    stripQuestionNumberAndOptionBold(stripTrivialLeadingVerbBold(trimmed)),
  )
  return cleaned.replaceAll(/\s+/g, ' ').trim()
}

/** Prepare description text as plain text (strip markdown emphasis markers). */
export function prepareFormsDescription(value: string): string {
  return stripMarkdownBoldMarkers(
    stripQuestionNumberAndOptionBold(stripTrivialLeadingVerbBold(value)),
  )
}

/** Choice option labels stay plain. */
export function prepareFormsOption(value: string): string {
  const cleaned = stripQuestionNumberAndOptionBold(value.trim())
  return stripMarkdownBoldMarkers(cleaned).replaceAll(/\s+/g, ' ').trim()
}

/**
 * @deprecated Prefer {@link prepareFormsTitle} / {@link prepareFormsDescription}.
 */
export function prepareFormsDisplayText(
  value: string,
  _options?: { emphasizeLeadingAction?: boolean },
): string {
  return prepareFormsDescription(value)
}

/**
 * @deprecated Leading-verb auto-bold looked odd in Forms; kept for export compatibility.
 */
export function emphasizeLeadingActionVerb(value: string): string {
  return value
}
