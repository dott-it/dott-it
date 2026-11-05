import type { DigitizeFormBlock, DigitizeQuestionBlock, DigitizeTextBlock } from './types'

export const DEFAULT_INVESTIGATION_MATERIAL_LABELS = ['Bat', 'Pitcher', 'Ball', 'Wind'] as const

const HOLLOW_STEM_MIN_CHARS = 40

export interface QualityPostProcessOptions {
  documentText?: string
  /** Canonical assessment title from ingest metadata (not handout artifact IDs). */
  assessmentTitle?: string
}

function normalizeDescriptionText(value: string): string {
  return value
    .replaceAll('\r\n', '\n')
    .replaceAll(/[ \t]+\n/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim()
}

/** Title is only a bare question number like "1", "1.", "2)". */
export function isHollowQuestionNumberTitle(title: string): boolean {
  return /^\d+[.)]?$/.test(title.trim())
}

export function isHollowStemTextBlock(block: DigitizeTextBlock): boolean {
  if (!isHollowQuestionNumberTitle(block.title)) {
    return false
  }
  const description = (block.description ?? '').trim()
  return description.length < HOLLOW_STEM_MIN_CHARS
}

/**
 * Pull the handout stem for question N from plain document text.
 */
export function findHandoutStemForQuestionNumber(
  documentText: string,
  questionNumber: number,
): string | undefined {
  if (!documentText.trim() || !Number.isInteger(questionNumber) || questionNumber < 1) {
    return undefined
  }

  const next = questionNumber + 1
  const startRe = new RegExp(
    `(?:^|\\n)\\s*(?:Question\\s+)?${questionNumber}[).:\\s]\\s*`,
    'i',
  )
  const startMatch = startRe.exec(documentText)
  if (!startMatch || startMatch.index === undefined) {
    return undefined
  }

  const from = startMatch.index + startMatch[0].length
  const rest = documentText.slice(from)
  const endRe = new RegExp(
    `(?:^|\\n)\\s*(?:Question\\s+)?${next}[).:\\s]|\\n\\s*Name\\s*[:.]|\\n\\s*\\[IMAGE:`,
    'i',
  )
  const endMatch = endRe.exec(rest)
  let stem = (endMatch ? rest.slice(0, endMatch.index) : rest).trim()

  // Drop trailing sub-prompt labels like "1a." left in the chunk.
  stem = stem.replace(new RegExp(`\\n\\s*${questionNumber}[a-z][.)].*$`, 'is'), '').trim()
  stem = stem.replaceAll(/\s+/g, ' ').trim()
  if (stem.length < HOLLOW_STEM_MIN_CHARS) {
    return undefined
  }
  return stem.slice(0, 1200)
}

/**
 * Fill empty/tiny Layer A descriptions from the handout text.
 */
export function backfillHollowStems(
  blocks: DigitizeFormBlock[],
  documentText: string | undefined,
): DigitizeFormBlock[] {
  if (!documentText?.trim()) {
    return blocks
  }

  return blocks.map((block) => {
    if (block.kind !== 'text' || !isHollowStemTextBlock(block)) {
      return block
    }
    const numberMatch = block.title.trim().match(/^(\d+)/)
    if (!numberMatch) {
      return block
    }
    const stem = findHandoutStemForQuestionNumber(documentText, Number(numberMatch[1]))
    if (!stem) {
      return block
    }
    const title = block.title.trim()
    return {
      ...block,
      title: /[.)]$/.test(title) ? title : `${title}.`,
      description: normalizeDescriptionText(stem),
    }
  })
}

export function looksLikeInvestigationMaterialsStem(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /\b(design an investigation|list the items|materials we have used|items and objects)\b/.test(
      t,
    ) ||
    (/\binvestigation\b/.test(t) && /\b(materials|items|objects)\b/.test(t))
  )
}

export function looksLikeGenericInvestigationAnswerTitle(title: string): boolean {
  const t = title.trim().toLowerCase()
  if (/^\d+[a-z][.)]?$/i.test(title.trim())) {
    return true
  }
  return (
    /\bitems and objects i will use\b/.test(t) ||
    /\bother items needed\b/.test(t) ||
    /\bmy plan for setting up\b/.test(t) ||
    /\bwhy i have chosen those items\b/.test(t)
  )
}

/**
 * Detect Bat / Pitcher / Ball / Wind fill-in labels only when they are printed
 * as their own lines in THIS handout. Never invent baseball materials for other units.
 */
export function extractInvestigationMaterialLabels(documentText: string | undefined): string[] {
  if (!documentText?.trim()) {
    return []
  }

  const found: string[] = []
  for (const label of DEFAULT_INVESTIGATION_MATERIAL_LABELS) {
    const lineLabel = new RegExp(`(?:^|\\n)\\s*${label}\\s*(?::|_|\\n|$)`, 'im')
    if (lineLabel.test(documentText)) {
      found.push(label)
    }
  }

  return found
}

function alreadyHasMaterialBlanks(blocks: DigitizeFormBlock[], labels: string[]): boolean {
  const titles = new Set(
    blocks
      .filter((block): block is DigitizeQuestionBlock => block.kind === 'question')
      .map((block) => block.title.trim().toLowerCase()),
  )
  const hits = labels.filter((label) => titles.has(label.toLowerCase()))
  // Prefer keeping LLM/handout blanks when most material labels are already present.
  return hits.length >= Math.min(3, labels.length)
}

/**
 * Rewrite fused investigation paragraphs into Assessment-1-style material blanks.
 */
export function ensureInvestigationMaterialBlanks(
  blocks: DigitizeFormBlock[],
  documentText: string | undefined,
): DigitizeFormBlock[] {
  const labels = extractInvestigationMaterialLabels(documentText)
  if (labels.length === 0 || alreadyHasMaterialBlanks(blocks, labels)) {
    return blocks
  }

  const result: DigitizeFormBlock[] = []
  let index = 0

  while (index < blocks.length) {
    const block = blocks[index]
    const stemBlob =
      block.kind === 'text'
        ? `${block.title}\n${block.description ?? ''}`
        : (block.kind === 'question'
          ? `${block.title}\n${block.description ?? ''}`
          : '')

    if (!looksLikeInvestigationMaterialsStem(stemBlob)) {
      result.push(block)
      index += 1
      continue
    }

    // Keep the stem text block (or promote a question stem to text).
    if (block.kind === 'text') {
      result.push(block)
    } else if (block.kind === 'question') {
      result.push({
        kind: 'text',
        title: block.title,
        ...(block.description ? { description: block.description } : {}),
        ...(block.imageIndexes?.length ? { imageIndexes: block.imageIndexes } : {}),
      })
    }

    // Consume following generic investigation answers.
    let cursor = index + 1
    const consumed: DigitizeQuestionBlock[] = []
    while (cursor < blocks.length) {
      const next = blocks[cursor]
      if (next.kind !== 'question') {
        break
      }
      if (
        looksLikeGenericInvestigationAnswerTitle(next.title) ||
        ((next.type === 'paragraph' || next.type === 'text') &&
          /^\d+[a-z]/i.test(next.title.trim()) &&
          consumed.length < 6)
      ) {
        consumed.push(next)
        cursor += 1
        continue
      }
      break
    }

    if (consumed.length === 0 && block.kind === 'text' && // Stem kept but no generic answers — still emit blanks when investigation cue is strong.
      !/\blist the items|materials we have used|items and objects\b/i.test(stemBlob)) {
        index += 1
        continue
      }

    for (const label of labels) {
      result.push({
        kind: 'question',
        title: label,
        type: 'text',
        required: true,
      })
    }
    result.push({
      kind: 'question',
      title: 'Other items needed to collect measurements and data:',
      type: 'paragraph',
      required: true,
    }, {
      kind: 'question',
      title: 'My plan for setting up and carrying out my investigation:',
      type: 'paragraph',
      required: true,
    })

    index = Math.max(cursor, index + 1)
  }

  return result
}

/**
 * Ensure Name + Hour + Teacher are the first Form items (before the intro card).
 * Replaces handout Date blanks — Forms already records submission timestamp.
 */
export function ensureNameTeacherQuestions(
  blocks: DigitizeFormBlock[],
  documentText = '',
): DigitizeFormBlock[] {
  if (!documentText.trim()) {
    return blocks
  }

  const shouldAdd =
    (/\bname\b/i.test(documentText) && /\b(date|teacher|hour)\b/i.test(documentText)) ||
    (/_{3,}/.test(documentText) && /\bname\b/i.test(documentText)) ||
    // OpenSciEd student handouts almost always expect identity fields even when
    // those labels live only in a rendered header table without plain "Name" text.
    /\bassessment\b/i.test(documentText)

  if (!shouldAdd) {
    return blocks
  }

  const withoutIdentity = blocks.filter(
    (block) =>
      !(
        block.kind === 'question' &&
        /^(name|hour|date|teacher)\.?$/i.test(block.title.trim())
      ),
  )

  const identity: DigitizeFormBlock[] = [
    { kind: 'question', title: 'Name', type: 'text', required: true },
    { kind: 'question', title: 'Hour', type: 'text', required: true },
    { kind: 'question', title: 'Teacher', type: 'text', required: true },
  ]

  // Always first — before the assessment intro text card.
  return [...identity, ...withoutIdentity]
}

/**
 * @deprecated Use {@link ensureNameTeacherQuestions}.
 */
export function ensureNameDateQuestions(
  blocks: DigitizeFormBlock[],
  documentText: string | undefined,
): DigitizeFormBlock[] {
  return ensureNameTeacherQuestions(blocks, documentText)
}

/**
 * Stem text from a Layer A card: either hollow "10." + description, or
 * "10. Does the warning…" already in the title.
 */
export function extractStemTextFromLayerA(block: DigitizeTextBlock): {
  numberLabel: string
  stem: string
} | null {
  const trimmedTitle = block.title.trim()
  if (isHollowQuestionNumberTitle(trimmedTitle)) {
    const stem = normalizeDescriptionText(block.description ?? '').replaceAll(/\s+/g, ' ').trim()
    if (stem.length < HOLLOW_STEM_MIN_CHARS) {
      return null
    }
    return { numberLabel: normalizeQuestionNumberLabel(trimmedTitle), stem }
  }

  const titled = trimmedTitle.match(/^(\d+[a-z]?)[.)]?\s+([\s\S]+)$/i)
  if (!titled) {
    return null
  }
  const numberLabel = normalizeQuestionNumberLabel(titled[1])
  const fromTitle = titled[2].replaceAll(/\s+/g, ' ').trim()
  const fromDescription = normalizeDescriptionText(block.description ?? '')
    .replaceAll(/\s+/g, ' ')
    .trim()
  const stem = fromDescription
    ? `${fromTitle} ${fromDescription}`.replaceAll(/\s+/g, ' ').trim()
    : fromTitle
  if (stem.length < 20) {
    return null
  }
  return { numberLabel, stem }
}

function isCollapsibleLoneAnswerFollowUp(
  stemTitle: string,
  answer: DigitizeQuestionBlock,
): boolean {
  if (!titlesShareQuestionNumber(stemTitle, answer.title)) {
    return false
  }
  const duplicateLetteredStem =
    /^\d+[a-z][.)]?\s+\S/i.test(stemTitle.trim()) &&
    /^\d+[a-z][.)]?\s+\S/i.test(answer.title.trim())
  if (!isCollapsibleFileFollowUp(stemTitle, answer.title) && !duplicateLetteredStem) {
    return false
  }
  if (answer.type === 'file') {
    return !(answer.description?.trim())
  }
  if (answer.type === 'radio' || answer.type === 'checkbox') {
    return (answer.options?.length ?? 0) >= 2
  }
  if (answer.type === 'paragraph' || answer.type === 'text') {
    return duplicateLetteredStem || titlesShareQuestionNumber(stemTitle, answer.title)
  }
  return false
}

/**
 * When Layer A is a numbered stem and Layer B is a lone "2a."/"10a." answer
 * (file upload or single choice), merge into one question whose title carries
 * the full stem (one Form item).
 */
export function collapseStemAndLoneFileAnswer(blocks: DigitizeFormBlock[]): DigitizeFormBlock[] {
  const result: DigitizeFormBlock[] = []

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    const next = blocks[index + 1]

    if (block.kind === 'text' && next?.kind === 'question') {
      const extracted = extractStemTextFromLayerA(block)
      const sameLetteredItem =
        /^\d+[a-z]/i.test(block.title.trim()) &&
        parseLetteredLabel(block.title) !== null &&
        parseLetteredLabel(block.title) === parseLetteredLabel(next.title)
      if (
        extracted &&
        isCollapsibleLoneAnswerFollowUp(block.title, next) &&
        (sameLetteredItem ||
          !hasSiblingSubQuestionAfter(blocks, index + 1, parseParentNumber(block.title)))
      ) {
        const imageIndexes = uniqueIndexes([
          ...(block.imageIndexes ?? []),
          ...(next.imageIndexes ?? []),
        ])
        const merged: DigitizeQuestionBlock = {
          kind: 'question',
          title: `${extracted.numberLabel} ${extracted.stem}`.trim(),
          type: next.type,
          required: next.required,
          ...(imageIndexes.length > 0 ? { imageIndexes } : {}),
          ...(next.sourceNumber === undefined
            ? { sourceNumber: Number.parseInt(extracted.numberLabel, 10) }
            : { sourceNumber: next.sourceNumber }),
        }
        if (next.type === 'radio' || next.type === 'checkbox') {
          merged.options = next.options
        }
        if (next.description?.trim() && next.type !== 'file') {
          merged.description = next.description
        }
        result.push(merged)
        index += 1
        continue
      }
    }

    result.push(block)
  }

  return result
}

function parseParentNumber(title: string): number | null {
  const match = title.trim().match(/^(\d+)/)
  if (!match) {
    return null
  }
  const value = Number(match[1])
  return Number.isFinite(value) ? value : null
}

function parseLetteredLabel(title: string): string | null {
  const match = title.trim().match(/^(\d+[a-z])\b/i)
  return match?.[1]?.toLowerCase() ?? null
}

function normalizeQuestionNumberLabel(title: string): string {
  const trimmed = title.trim()
  const lettered = trimmed.match(/^(\d+[a-z])[.)]?$/i)
  if (lettered) {
    return `${lettered[1]}.`
  }
  const match = trimmed.match(/^(\d+)[.)]?$/)
  return match ? `${match[1]}.` : trimmed
}

/** "2a." / "2a" / "1b." — lettered sub-question with no stem text in the title. */
export function isBareLetterSubQuestionTitle(title: string): boolean {
  return /^\d+[a-z][.)]?$/i.test(title.trim())
}

/** Empty follow-up file titled "2a." or a duplicate bare "2." after the stem card. */
export function isCollapsibleFileFollowUp(stemTitle: string, fileTitle: string): boolean {
  if (isBareLetterSubQuestionTitle(fileTitle)) {
    return true
  }
  return isHollowQuestionNumberTitle(fileTitle) && titlesShareQuestionNumber(stemTitle, fileTitle)
}

function titlesShareQuestionNumber(stemTitle: string, subTitle: string): boolean {
  const parent = parseParentNumber(stemTitle)
  const child = parseParentNumber(subTitle)
  return parent !== null && child !== null && parent === child
}

function hasSiblingSubQuestionAfter(
  blocks: DigitizeFormBlock[],
  fileIndex: number,
  parentNumber: number | null,
): boolean {
  if (parentNumber === null) {
    return false
  }
  for (let index = fileIndex + 1; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (block.kind === 'text') {
      return false
    }
    const number = parseParentNumber(block.title)
    if (number === parentNumber && /^\d+[a-z]/i.test(block.title.trim())) {
      return true
    }
    return false
  }
  return false
}

function uniqueIndexes(indexes: number[]): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const index of indexes) {
    if (!seen.has(index)) {
      seen.add(index)
      out.push(index)
    }
  }
  return out
}

/**
 * Strip OpenSciEd / DOCX artifact IDs glued onto titles
 * (e.g. "Baseball Assessment 21905019050" → "Baseball Assessment",
 * "Soccer Assessment1905019050" → "Soccer Assessment").
 * Keeps short meaningful numbers like "Assessment 2".
 */
export function stripHandoutArtifactId(title: string): string {
  return title
    .replaceAll(/\s+\d{6,}(?:\s+\d{6,})*\s*$/g, '')
    .replaceAll(/(?<=[A-Za-z])\d{8,}\s*$/g, '')
    .replaceAll(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Force the assessment intro card title to the canonical assessment name,
 * and strip handout document IDs from any assessment-like text titles.
 */
export function ensureAssessmentHeaderTitle(
  blocks: DigitizeFormBlock[],
  assessmentTitle: string | undefined,
): DigitizeFormBlock[] {
  const preferred = assessmentTitle?.trim()
  let replacedHeader = false

  return blocks.map((block) => {
    if (block.kind !== 'text') {
      return block
    }

    const cleaned = stripHandoutArtifactId(block.title)
    const looksLikeAssessmentHeader = /\bassessment\b/i.test(cleaned) || /\bassessment\b/i.test(block.title)

    if (!looksLikeAssessmentHeader) {
      return cleaned === block.title ? block : { ...block, title: cleaned }
    }

    if (replacedHeader) {
      return cleaned === block.title ? block : { ...block, title: cleaned }
    }

    replacedHeader = true
    return {
      ...block,
      title: preferred || cleaned,
    }
  })
}

/**
 * Insert blank lines before instructional / discourse beats so Form descriptions
 * read as spaced paragraphs (title stays "N. first beat"; body gets the rest).
 */
export function ensureInstructionalParagraphBreaks(text: string): string {
  const normalized = text.replaceAll(/\r\n|\r/g, '\n').trim()
  if (!normalized) {
    return normalized
  }

  // Em dashes in OSE stems often mark a new instructional beat (not a parenthetical).
  let withBreaks = normalized.replaceAll(/\s+[—–]\s+/g, '\n\n')

  withBreaks = withBreaks
    .replaceAll(
      /\s+(List the items|Then describe|Draw arrows|Draw and label|Draw three|Make sure to|Record your|Show any calculations|Explain this|Why or why not\?)/gi,
      '\n\n$1',
    )
    .replaceAll(/\s+(After graphing your data,)/gi, '\n\n$1')
    // Narrative / scenario / task shifts common in OpenSciEd stems.
    .replaceAll(
      /\s+(Assume that|How would you|Why would you|What would you|At this higher|In that case|For example,|In your model|For each|When a person|When any|During practice|Another member|Include the following|Do you agree|Support or refute|Describe how|If you made|Here are three|These headgear)\b/gi,
      '\n\n$1',
    )

  // Long single-paragraph stems: break into readable chunks by sentence.
  if (!/\n\s*\n/.test(withBreaks) && withBreaks.length > 280) {
    withBreaks = breakLongProseIntoParagraphs(withBreaks)
  } else if (!/\n\s*\n/.test(withBreaks) && withBreaks.length > 180) {
    withBreaks = withBreaks.replaceAll(/\s+(How would you|Why would you|What would you)\b/gi, '\n\n$1')
  }

  // Even after keyword splits (or existing blank lines), refine oversized chunks.
  withBreaks = withBreaks
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph.length > 220 ? breakLongProseIntoParagraphs(paragraph) : paragraph,
    )
    .join('\n\n')

  return normalizeDescriptionTextLocal(withBreaks)
}

/** Split long prose into ~1–2 sentence paragraphs for Forms descriptions. */
export function breakLongProseIntoParagraphs(text: string): string {
  const sentences =
    text.match(/[^.?!]+[.?!]+(?:["')\]]+)?(?=\s|$)|[^.?!]+$/g)?.map((part) => part.trim()).filter(Boolean) ??
    [text]
  if (sentences.length < 2) {
    return text
  }

  const paragraphs: string[] = []
  let buffer = ''
  for (const sentence of sentences) {
    const startsNewBeat =
      /^(Assume|How|Why|What|When|Where|During|Another|In your|For each|At this|Compare|Explain|Describe|Draw|Include|Do you|Support|Therefore|However|For example|Make sure|If you)\b/i.test(
        sentence,
      )
    if (buffer && (startsNewBeat || buffer.length >= 160)) {
      paragraphs.push(buffer)
      buffer = sentence
      continue
    }
    buffer = buffer ? `${buffer} ${sentence}` : sentence
  }
  if (buffer) {
    paragraphs.push(buffer)
  }
  return paragraphs.join('\n\n')
}

function normalizeDescriptionTextLocal(value: string): string {
  return value
    .replaceAll(/[ \t]+\n/g, '\n')
    .replaceAll(/\n[ \t]+/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .replaceAll(/[ \t]{2,}/g, ' ')
    .trim()
}

/**
 * Split a stem so the Form title is "N. first paragraph" and later paragraphs
 * live in description (Forms titles cannot contain newlines).
 */
export function splitStemAcrossTitleAndDescription(
  numberLabel: string,
  stem: string,
): { title: string; description?: string } {
  const label = /^\d+[.)]?$/.test(numberLabel.trim())
    ? normalizeQuestionNumberLabel(numberLabel)
    : numberLabel.trim().replace(/\s+$/, '')
  const withBreaks = ensureInstructionalParagraphBreaks(stem)
  const paragraphs = withBreaks
    .split(/\n\s*\n/)
    .map((part) => part.replaceAll(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return { title: label }
  }
  if (paragraphs.length === 1) {
    return { title: `${label} ${paragraphs[0]}`.trim() }
  }
  return {
    title: `${label} ${paragraphs[0]}`.trim(),
    description: paragraphs.slice(1).join('\n\n'),
  }
}

/**
 * Never leave a bare "3." title with the stem only in description — matches
 * the "N. texto" pattern used by other questions, while keeping paragraph breaks
 * in description when the stem has multiple instructional beats.
 */
export function formatNumberedStemCards(blocks: DigitizeFormBlock[]): DigitizeFormBlock[] {
  return blocks.map((block) => {
    if (block.kind === 'text' && isHollowQuestionNumberTitle(block.title)) {
      const stem = (block.description ?? '').trim()
      if (!stem) {
        return block
      }
      const split = splitStemAcrossTitleAndDescription(block.title, stem)
      return {
        ...block,
        title: split.title,
        ...(split.description ? { description: split.description } : { description: undefined }),
      }
    }

    if (block.kind !== 'question' && block.kind !== 'text') {
      return block
    }

    // Section / intro cards: keep the header; space the body like Baseball stems.
    if (block.kind === 'text' && !/^\d+[a-z]?[.)]/i.test(block.title.trim())) {
      const body = (block.description ?? '').trim()
      if (body.length < 160) {
        return block
      }
      const spaced = ensureInstructionalParagraphBreaks(body)
      return spaced === body ? block : { ...block, description: spaced }
    }

    const match = block.title.trim().match(/^(\d+[a-z]?[.)]?)(\s+)(.+)$/i)
    if (!match) {
      return block
    }

    const numberPart = match[1]
    const stemPart = match[3]
    // Only split long multi-beat stems; leave short titles alone.
    if (stemPart.length < 80 && !(block.description?.trim())) {
      return block
    }

    const numberLabel = /^\d+[a-z]/i.test(numberPart)
      ? (numberPart.endsWith('.') || numberPart.endsWith(')')
        ? numberPart.replace(/\)$/, '.')
        : `${numberPart}.`)
      : normalizeQuestionNumberLabel(numberPart)

    const combinedStem = block.description?.trim()
      ? `${stemPart}\n\n${block.description.trim()}`
      : stemPart
    const split = splitStemAcrossTitleAndDescription(numberLabel, combinedStem)

    return {
      ...block,
      title: split.title,
      ...(split.description ? { description: split.description } : { description: undefined }),
    }
  })
}

/**
 * When a section text card swallows numbered student prompts (1. / 2.),
 * emit those as real answer items. Example: "Considerations for design"
 * followed by "1. What is the purpose… 2. Pick one stakeholder…".
 */
export function expandFusedNumberedPromptsInTextCards(
  blocks: DigitizeFormBlock[],
): DigitizeFormBlock[] {
  const result: DigitizeFormBlock[] = []

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (block.kind !== 'text') {
      result.push(block)
      continue
    }

    const blob = `${block.title}\n\n${block.description ?? ''}`.trim()
    const prompts = parseFusedNumberedPrompts(blob)
    if (prompts.length < 2) {
      result.push(block)
      continue
    }

    const unanswered = prompts.filter(
      (prompt) => !laterBlockAnswersNumber(blocks, index + 1, prompt.number),
    )
    const headerTitle = sectionHeaderFromFusedCard(block.title)

    // Numbered prompts already have answer items — keep only the section header.
    if (unanswered.length === 0) {
      if (headerTitle) {
        result.push({
          kind: 'text',
          title: headerTitle,
          ...(block.imageIndexes?.length ? { imageIndexes: [...block.imageIndexes] } : {}),
        })
      }
      continue
    }

    if (headerTitle) {
      result.push({
        kind: 'text',
        title: headerTitle,
        ...(block.imageIndexes?.length ? { imageIndexes: [...block.imageIndexes] } : {}),
      })
    }

    for (const prompt of unanswered) {
      const split = splitStemAcrossTitleAndDescription(`${prompt.number}.`, prompt.stem)
      result.push({
        kind: 'question',
        title: split.title,
        type: 'paragraph',
        required: true,
        ...(split.description ? { description: split.description } : {}),
        sourceNumber: prompt.number,
      })
      for (const followUp of prompt.followUps) {
        result.push({
          kind: 'question',
          title: followUp,
          type: 'paragraph',
          required: true,
          sourceNumber: prompt.number,
        })
      }
    }
  }

  return result
}

function sectionHeaderFromFusedCard(title: string): string | null {
  const trimmed = title.trim()
  if (!trimmed || isHollowQuestionNumberTitle(trimmed) || /^\d+[a-z]?[.)]/i.test(trimmed)) {
    return null
  }
  const beforeDash = trimmed.split(/\s+[—–-]\s+/)[0]?.trim() ?? trimmed
  if (/^\d+[a-z]?[.)]/i.test(beforeDash) || beforeDash.length < 3) {
    return null
  }
  return beforeDash
}

export function parseFusedNumberedPrompts(blob: string): Array<{
  number: number
  stem: string
  followUps: string[]
}> {
  const normalized = blob.replaceAll(/\r\n|\r/g, '\n').replaceAll(/\s+[—–]\s+/g, '\n')
  const matches = [...normalized.matchAll(/(?:^|\n)\s*(\d{1,2})[.)]\s+/g)]
  if (matches.length < 2) {
    return []
  }

  const prompts: Array<{ number: number; stem: string; followUps: string[] }> = []
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const number = Number(match[1])
    if (!Number.isInteger(number) || number < 1) {
      continue
    }
    const start = (match.index ?? 0) + match[0].length
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? normalized.length) : normalized.length
    const chunk = normalized.slice(start, end).trim()
    if (!looksLikeStudentPromptChunk(chunk)) {
      continue
    }
    const { stem, followUps } = splitPromptFollowUps(chunk)
    if (stem.length < 20) {
      continue
    }
    prompts.push({ number, stem, followUps })
  }

  return prompts
}

function looksLikeStudentPromptChunk(chunk: string): boolean {
  const t = chunk.toLowerCase()
  return (
    /\?/.test(chunk) ||
    /^(what|who|which|how|why|pick|list|explain|describe|identify|choose|name)\b/.test(t)
  )
}

function splitPromptFollowUps(chunk: string): { stem: string; followUps: string[] } {
  const pieces = chunk
    .split(/\n+/)
    .map((part) => part.replaceAll(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (pieces.length <= 1) {
    const sentences = chunk.match(/[^.?!]+[?]+(?:\s+|$)|[^.?!]+[.!]+(?:\s+|$)|[^.?!]+$/g)
      ?.map((part) => part.trim())
      .filter(Boolean) ?? [chunk]
    if (sentences.length >= 3 && sentences.slice(1).every((sentence) => /\?\s*$/.test(sentence))) {
      return { stem: sentences[0], followUps: sentences.slice(1) }
    }
    return { stem: chunk.replaceAll(/\s+/g, ' ').trim(), followUps: [] }
  }
  return { stem: pieces[0], followUps: pieces.slice(1).filter((part) => looksLikeStudentPromptChunk(part)) }
}

/**
 * If two answer items share "3." and one is the real draw/design prompt,
 * drop the number from the earlier follow-up (e.g. constraints under Q2).
 */
export function relabelDuplicateQuestionNumbers(blocks: DigitizeFormBlock[]): DigitizeFormBlock[] {
  const byNumber = new Map<number, number[]>()
  for (const [index, block] of blocks.entries()) {
    if (block.kind !== 'question') {
      continue
    }
    const match = block.title.trim().match(/^(\d+)[.)]/)
    if (!match) {
      continue
    }
    const number = Number(match[1])
    const list = byNumber.get(number) ?? []
    list.push(index)
    byNumber.set(number, list)
  }

  const next = [...blocks]
  for (const indexes of byNumber.values()) {
    if (indexes.length < 2) {
      continue
    }
    const drawIndex = indexes.find((index) => {
      const block = next[index]
      return block.kind === 'question' && (block.type === 'file' || looksLikeDrawDesignStem(block.title))
    })
    if (drawIndex === undefined) {
      continue
    }
    for (const index of indexes) {
      if (index === drawIndex) {
        continue
      }
      const block = next[index]
      if (block.kind !== 'question') {
        continue
      }
      next[index] = {
        ...block,
        title: block.title.replace(/^\d+[.)]\s*/, '').trim(),
      }
    }
  }
  return next
}

function looksLikeDrawDesignStem(title: string): boolean {
  const t = title.toLowerCase()
  return (
    /\b(draw|words and pictures|words or pictures|design solution|free body|coordinate plot|pedigree|visually represent)\b/.test(
      t,
    )
  )
}

function laterBlockAnswersNumber(
  blocks: DigitizeFormBlock[],
  fromIndex: number,
  questionNumber: number,
): boolean {
  for (let index = fromIndex; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (block.kind !== 'question') {
      continue
    }
    const match = block.title.trim().match(/^(\d+)/)
    if (match && Number(match[1]) === questionNumber) {
      return true
    }
  }
  return false
}

const FILL_IN_BLANK_RE = /_{6,}/g
const WORKSHEET_SECTION_HEADING_RE =
  /^(obtaining information from scientific text|evaluating information from scientific text)$/i

function isIdentityPromptTitle(title: string): boolean {
  return /^(name|date|hour|teacher)\b/i.test(title.trim())
}

function lastQuestionLikeSpan(before: string): string | null {
  const compact = before.replaceAll(/\s+/g, ' ').trim()
  if (!compact) {
    return null
  }
  const questions = [...compact.matchAll(/([^?]{8,400}\?)/g)].map((match) => match[1].trim())
  if (questions.length > 0) {
    const last = questions.at(-1) ?? ''
    const previous = questions.at(-2)
    if (previous && last.length < 40) {
      return `${previous} ${last}`.trim()
    }
    const sentences = last.split(/(?<=\.)\s+(?=[A-Z])/)
    return (sentences.at(-1) ?? last).trim()
  }
  const sentences = compact.split(/(?<=[.!?])\s+/)
  const last = sentences.at(-1)?.trim() ?? ''
  if (last.length >= 12 && looksLikeStudentPromptChunk(last)) {
    return last
  }
  return null
}

/**
 * Pull student fill-in prompts from underline blanks in the handout
 * ("What is the central idea or claim? ________").
 */
export function extractFillInPromptsFromHandout(documentText: string): string[] {
  if (!documentText.trim()) {
    return []
  }

  const marked = documentText.replaceAll('\r\n', '\n').replaceAll(/(?:_{6,}[\t ]*)+/g, ' ⟦BLANK⟧ ')
  const chunks = marked.split('⟦BLANK⟧')
  const prompts: string[] = []

  for (let index = 0; index < chunks.length - 1; index += 1) {
    const before = chunks[index].replaceAll(/\s+/g, ' ').trim()
    const after = chunks[index + 1].replaceAll(/\s+/g, ' ').trim()
    const parenthetical = /^\(([^)]{8,80})\)/.exec(after)
    let prompt = lastQuestionLikeSpan(before)
    if (parenthetical && (!prompt || prompt.length < 20 || !/\?/.test(prompt))) {
      const extra = parenthetical[1].trim()
      prompt = extra.charAt(0).toUpperCase() + extra.slice(1)
    }
    if (!prompt || prompt.length < 12 || isIdentityPromptTitle(prompt)) {
      continue
    }
    if (!prompts.includes(prompt)) {
      prompts.push(prompt)
    }
  }

  return prompts
}

function promptAlreadyHasAnswer(blocks: DigitizeFormBlock[], prompt: string): boolean {
  const needle = prompt.slice(0, 40).toLowerCase()
  return blocks.some(
    (block) =>
      block.kind === 'question' &&
      !isIdentityPromptTitle(block.title) &&
      block.title.toLowerCase().includes(needle),
  )
}

function looksLikeDumpedWorksheetCard(block: DigitizeTextBlock, prompts: string[]): boolean {
  const blob = `${block.title}\n${block.description ?? ''}`
  const blankCount = blob.match(FILL_IN_BLANK_RE)?.length ?? 0
  const matched = prompts.filter((prompt) => blob.toLowerCase().includes(prompt.slice(0, 24).toLowerCase()))
  return blankCount >= 2 || matched.length >= 2
}

function worksheetSectionBlocks(documentText: string, prompts: string[]): DigitizeFormBlock[] {
  const blocks: DigitizeFormBlock[] = []
  const emitted = new Set<string>()
  const lines = documentText.replaceAll('\r\n', '\n').split('\n')
  let pendingDescription: string[] = []

  const flushDescription = () => {
    const last = blocks.at(-1)
    if (last?.kind === 'text' && pendingDescription.length > 0 && !last.description) {
      last.description = pendingDescription.join('\n\n')
    }
    pendingDescription = []
  }

  for (const rawLine of lines) {
    const line = rawLine.replaceAll(/_{6,}/g, ' ').replaceAll(/\s+/g, ' ').trim()
    if (!line || /^\d{8,}$/.test(line) || /1905019050/.test(line)) {
      continue
    }
    if (WORKSHEET_SECTION_HEADING_RE.test(line)) {
      flushDescription()
      blocks.push({ kind: 'text', title: line })
      continue
    }
    const prompt = prompts.find(
      (entry) => !emitted.has(entry) && line.toLowerCase().includes(entry.slice(0, 24).toLowerCase()),
    )
    if (prompt) {
      flushDescription()
      blocks.push({
        kind: 'question',
        title: prompt,
        type: 'paragraph',
        required: true,
      })
      emitted.add(prompt)
      continue
    }
    if (
      blocks.at(-1)?.kind === 'text' &&
      !WORKSHEET_SECTION_HEADING_RE.test(line) &&
      line.length > 20 &&
      !/checklist for obtaining/i.test(line)
    ) {
      pendingDescription.push(line)
    }
  }
  flushDescription()

  for (const prompt of prompts) {
    if (!emitted.has(prompt)) {
      blocks.push({
        kind: 'question',
        title: prompt,
        type: 'paragraph',
        required: true,
      })
    }
  }

  return blocks
}

/**
 * Turn dumped checklist/worksheet text cards (questions + underline blanks)
 * into section headers plus one paragraph answer per fill-in prompt.
 */
export function expandFillInWorksheetCards(
  blocks: DigitizeFormBlock[],
  documentText: string | undefined,
): DigitizeFormBlock[] {
  const source =
    documentText?.trim() ||
    blocks
      .filter((block) => block.kind === 'text')
      .map((block) => `${block.title}\n${block.description ?? ''}`)
      .join('\n\n')
  const prompts = extractFillInPromptsFromHandout(source)
  if (prompts.length < 2) {
    return blocks
  }

  const uncovered = prompts.filter((prompt) => !promptAlreadyHasAnswer(blocks, prompt))
  if (uncovered.length < 2) {
    return blocks
  }

  const dumpedIndex = blocks.findIndex(
    (block) => block.kind === 'text' && looksLikeDumpedWorksheetCard(block, prompts),
  )
  if (dumpedIndex === -1) {
    const studentAnswers = blocks.filter(
      (block) => block.kind === 'question' && !isIdentityPromptTitle(block.title),
    )
    if (studentAnswers.length > 0) {
      return blocks
    }
  }

  const targetIndex = dumpedIndex === -1 ? blocks.findIndex((block) => block.kind === 'text') : dumpedIndex
  if (targetIndex === -1) {
    return blocks
  }

  const dumped = blocks[targetIndex]
  if (dumped.kind !== 'text') {
    return blocks
  }

  const worksheet = worksheetSectionBlocks(source, uncovered)
  const headerTitle = dumped.title.trim()
  const header: DigitizeFormBlock[] =
    headerTitle && !prompts.some((prompt) => headerTitle.toLowerCase().includes(prompt.slice(0, 24).toLowerCase()))
      ? [
          {
            kind: 'text',
            title: headerTitle.replace(/\d{10,}$/, '').trim() || headerTitle,
            ...(dumped.imageIndexes?.length ? { imageIndexes: [...dumped.imageIndexes] } : {}),
          },
        ]
      : []

  return [...blocks.slice(0, targetIndex), ...header, ...worksheet, ...blocks.slice(targetIndex + 1)]
}

function laterBlockAnswersExactLabel(
  blocks: DigitizeFormBlock[],
  fromIndex: number,
  title: string,
): boolean {
  const lettered = parseLetteredLabel(title)
  const parent = parseParentNumber(title)
  for (let index = fromIndex; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (block.kind !== 'question') {
      continue
    }
    if (lettered) {
      if (parseLetteredLabel(block.title) === lettered) {
        return true
      }
      continue
    }
    if (parseLetteredLabel(block.title)) {
      continue
    }
    if (parseParentNumber(block.title) === parent) {
      return true
    }
  }
  return false
}

function looksLikeStudentWorkPrompt(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /\?/.test(text) ||
    /\b(synthesize|explain|describe|predict|identify|recommend|draw|write|represent|evaluate|make sense|using the checklist)\b/.test(
      t,
    )
  )
}

/**
 * Numbered items (1a., 2.) dumped as text-only cards still need an answer field
 * when no following question shares that exact label.
 */
export function promoteUnansweredNumberedTextCards(blocks: DigitizeFormBlock[]): DigitizeFormBlock[] {
  return blocks.map((block, index) => {
    if (block.kind !== 'text') {
      return block
    }
    const lettered = parseLetteredLabel(block.title)
    const numberedStem = /^\d+[.)]\s+\S/.test(block.title.trim())
    if (!lettered && !numberedStem) {
      return block
    }
    const extracted = extractStemTextFromLayerA(block)
    if (!extracted || !looksLikeStudentWorkPrompt(`${extracted.numberLabel} ${extracted.stem}`)) {
      return block
    }
    if (laterBlockAnswersExactLabel(blocks, index + 1, block.title)) {
      return block
    }
    const type: DigitizeQuestionBlock['type'] = looksLikeDrawDesignStem(extracted.stem) ? 'file' : 'paragraph'
    return {
      kind: 'question',
      title: `${extracted.numberLabel} ${extracted.stem}`.trim(),
      type,
      required: true,
      ...(block.imageIndexes?.length ? { imageIndexes: [...block.imageIndexes] } : {}),
      sourceNumber: Number.parseInt(extracted.numberLabel, 10),
    }
  })
}

function normalizeStemForDedupe(title: string): string {
  let normalized = title.replaceAll(/\s+/g, ' ').trim().toLowerCase()
  normalized = normalized.replace(/^(?:q\s*)?\d+[a-z]?[.)]?\s+/, '')
  normalized = normalized.replace(/^(?:q\s*)?\d+[a-z]?[.)]?\s+/, '')
  return normalized.slice(0, 160)
}

function stemsAreNearDuplicate(left: string, right: string): boolean {
  const a = normalizeStemForDedupe(left)
  const b = normalizeStemForDedupe(right)
  if (a.length < 40 || b.length < 40) {
    return false
  }
  return a === b || a.startsWith(b.slice(0, 80)) || b.startsWith(a.slice(0, 80))
}

/**
 * LLM sometimes emits both "1. Synthesize…" and "1a. Synthesize…" for the same prompt.
 * Keep the lettered item when the stems match.
 */
export function dropDuplicateAdjacentQuestionStems(blocks: DigitizeFormBlock[]): DigitizeFormBlock[] {
  const result: DigitizeFormBlock[] = []
  for (const block of blocks) {
    const previous = result.at(-1)
    if (
      previous?.kind === 'question' &&
      block.kind === 'question' &&
      stemsAreNearDuplicate(previous.title, block.title)
    ) {
      if (previous.type !== block.type) {
        result.push(block)
        continue
      }
      const preferCurrent =
        Boolean(parseLetteredLabel(block.title)) && !parseLetteredLabel(previous.title)
      if (preferCurrent) {
        result.pop()
        result.push(block)
      }
      continue
    }
    result.push(block)
  }
  return result
}

/**
 * Quality-bar post-pass (Assessment 1 parity for text structure).
 */
export function applyAssessment1QualityPostProcess(
  blocks: DigitizeFormBlock[],
  options?: QualityPostProcessOptions,
): DigitizeFormBlock[] {
  const documentText = options?.documentText
  let next = backfillHollowStems(blocks, documentText)
  next = ensureInvestigationMaterialBlanks(next, documentText)
  next = expandFillInWorksheetCards(next, documentText)
  next = expandFusedNumberedPromptsInTextCards(next)
  next = promoteUnansweredNumberedTextCards(next)
  next = dropDuplicateAdjacentQuestionStems(next)
  next = relabelDuplicateQuestionNumbers(next)
  next = collapseStemAndLoneFileAnswer(next)
  next = formatNumberedStemCards(next)
  // Second pass: LLM may emit "10. stem…" text titles before format; catch those too.
  next = collapseStemAndLoneFileAnswer(next)
  next = ensureNameTeacherQuestions(next, documentText)
  next = ensureAssessmentHeaderTitle(next, options?.assessmentTitle)
  // Handout [IMAGE:N] markers are authoritative for figure placement.
  next = reattachImageIndexesFromDocumentMarkers(next, documentText)
  return next
}

const IMAGE_MARKER_RE = /\[IMAGE:(\d+)\]/g
const IMMEDIATE_QUESTION_RE = /^\s*(\d+)([a-z])?[.)]/i
const IMAGES_BELOW_RE =
  /images?\s+below|figures?\s+below|diagrams?\s+below|using the images?\s+below/i

type QuestionRef = { number: number; letter?: string }

/**
 * Re-assign `imageIndexes` from `[IMAGE:N]` positions in the handout text.
 *
 * LLM placement often pins a figure to the previous stem when the DOCX puts the
 * drawing between questions (e.g. neuron diagram after Q4 → belongs on Q5).
 */
export function reattachImageIndexesFromDocumentMarkers(
  blocks: DigitizeFormBlock[],
  documentText: string | undefined,
): DigitizeFormBlock[] {
  if (!documentText?.trim() || blocks.length === 0) {
    return blocks
  }

  const byBlock = new Map<number, number[]>()

  for (const match of documentText.matchAll(IMAGE_MARKER_RE)) {
    const imageIndex = Number(match[1])
    if (!Number.isInteger(imageIndex) || imageIndex < 1) {
      continue
    }
    const start = match.index ?? 0
    const before = documentText.slice(0, start)
    const after = documentText.slice(start + match[0].length)
    const blockIndex = resolveBlockIndexForImageMarker(blocks, before, after)
    if (blockIndex === null) {
      continue
    }
    const list = byBlock.get(blockIndex) ?? []
    if (!list.includes(imageIndex)) {
      list.push(imageIndex)
    }
    byBlock.set(blockIndex, list)
  }

  if (byBlock.size === 0) {
    return blocks
  }

  return blocks.map((block, index) => {
    const imageIndexes = byBlock.get(index)
    if (!imageIndexes?.length) {
      if (!block.imageIndexes?.length) {
        return block
      }
      if (block.kind === 'text') {
        const { imageIndexes: _removed, ...rest } = block
        return rest
      }
      const { imageIndexes: _removed, ...rest } = block
      return rest
    }
    return { ...block, imageIndexes }
  })
}

function resolveBlockIndexForImageMarker(
  blocks: DigitizeFormBlock[],
  before: string,
  after: string,
): number | null {
  const beforeTail = before.slice(-500)
  const afterHead = after.slice(0, 160)

  if (IMAGES_BELOW_RE.test(beforeTail)) {
    const previous = findLastQuestionRef(before)
    if (previous) {
      const sectionStart = findLastQuestionRefStart(before)
      const section = sectionStart === null ? beforeTail : before.slice(sectionStart)
      // Only keep the figure on the prior prompt when *that* stem says "images below"
      // (not an earlier question still inside the beforeTail window).
      if (IMAGES_BELOW_RE.test(section)) {
        const index = findBlockIndexForQuestionRef(blocks, previous)
        if (index !== null) {
          return index
        }
      }
    }
  }

  const immediate = afterHead.match(IMMEDIATE_QUESTION_RE)
  if (immediate) {
    const nextRef: QuestionRef = {
      number: Number(immediate[1]),
      letter: immediate[2]?.toLowerCase(),
    }
    const index = findBlockIndexForQuestionRef(blocks, nextRef)
    if (index !== null) {
      return index
    }
  }

  const previous = findLastQuestionRef(before)
  if (previous) {
    const index = findBlockIndexForQuestionRef(blocks, previous)
    if (index !== null) {
      return index
    }
  }

  return findIntroTextBlockIndex(blocks)
}

function findLastQuestionRef(before: string): QuestionRef | null {
  const matches = [...before.matchAll(/(?:^|\n)\s*(\d+)([a-z])?[.)]/gi)]
  const last = matches.at(-1)
  if (!last) {
    return null
  }
  return {
    number: Number(last[1]),
    letter: last[2]?.toLowerCase(),
  }
}

function findLastQuestionRefStart(before: string): number | null {
  const matches = [...before.matchAll(/(?:^|\n)\s*(\d+)([a-z])?[.)]/gi)]
  const last = matches.at(-1)
  if (!last || last.index === undefined) {
    return null
  }
  // Prefer the digit start, not the leading newline.
  const raw = last[0]
  const digitOffset = raw.search(/\d/)
  return last.index + Math.max(0, digitOffset)
}

function findBlockIndexForQuestionRef(
  blocks: DigitizeFormBlock[],
  ref: QuestionRef,
): number | null {
  const patterns = questionRefTitlePatterns(ref)

  for (const [index, block] of blocks.entries()) {
    if (block.kind !== 'question') {
      continue
    }
    if (patterns.some((pattern) => pattern.test(block.title))) {
      return index
    }
  }

  for (const [index, block] of blocks.entries()) {
    if (block.kind !== 'text') {
      continue
    }
    const blob = `${block.title}\n${block.description ?? ''}`
    if (patterns.some((pattern) => pattern.test(blob))) {
      return index
    }
  }

  return null
}

function questionRefTitlePatterns(ref: QuestionRef): RegExp[] {
  if (ref.letter) {
    return [
      new RegExp(String.raw`(?:^|\b|Q\d+\s+)${ref.number}${ref.letter}[.)]`, 'i'),
      new RegExp(String.raw`^${ref.number}${ref.letter}\b`, 'i'),
    ]
  }
  return [
    new RegExp(String.raw`(?:^|\b|Q\d+\s+)${ref.number}[.)](?![a-z])`, 'i'),
    new RegExp(String.raw`^${ref.number}\b(?![a-z])`, 'i'),
  ]
}

function findIntroTextBlockIndex(blocks: DigitizeFormBlock[]): number | null {
  for (const [index, block] of blocks.entries()) {
    if (block.kind !== 'text') {
      continue
    }
    if (/^(name|hour|teacher|date)$/i.test(block.title.trim())) {
      continue
    }
    return index
  }
  return null
}

