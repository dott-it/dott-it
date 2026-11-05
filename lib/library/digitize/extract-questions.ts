import { ChatOpenAI } from '@langchain/openai'
import type { FormCreateItem, QuestionItem } from '@/lib/forms/types/forms'
import {
  formatAssetCatalogForPrompt,
  type AssetCatalogEntry,
} from './asset-catalog'
import { FILE_RESPONSE_MARKER } from './file-response-marker'
import { prepareFormsDescription, prepareFormsOption, prepareFormsTitle } from './forms-text-format'
import { formatAssessment1GoldForPrompt } from './gold/assessment-1-structure'
import { applyAssessment1QualityPostProcess } from './quality-postprocess'
import type {
  DigitizeFormBlock,
  DigitizeQuestion,
  DigitizeQuestionBlock,
  DigitizeQuestionType,
  DigitizeTextBlock,
} from './types'

const QUESTION_TYPES = new Set<DigitizeQuestionType>([
  'text',
  'paragraph',
  'file',
  'radio',
  'checkbox',
])
const CHOICE_TYPES = new Set<DigitizeQuestionType>(['radio', 'checkbox'])

export interface NormalizeDigitizeQuestionsOptions {
  /** When set, imageIndexes outside 1..imageCount are rejected. */
  imageCount?: number
  /** Handout plain text — enables stem backfill, materials blanks, Name/Hour/Teacher. */
  documentText?: string
  /** Canonical assessment title from ingest (overrides handout artifact IDs on the header card). */
  assessmentTitle?: string
}

/**
 * Validate and normalize LLM (or fixture) question JSON into DigitizeQuestion[].
 */
export function normalizeDigitizeQuestions(
  raw: unknown,
  options?: NormalizeDigitizeQuestionsOptions,
): DigitizeQuestion[] {
  const blocks = normalizeDigitizeFormBlocks(coerceLegacyQuestionsToBlocks(raw), options)
  return blocksToQuestions(blocks)
}

/**
 * Normalize ordered handout blocks (text + questions) for Form creation.
 */
export function normalizeDigitizeFormBlocks(
  raw: unknown,
  options?: NormalizeDigitizeQuestionsOptions,
): DigitizeFormBlock[] {
  if (!Array.isArray(raw)) {
    throw new TypeError('Form blocks payload must be a JSON array')
  }

  const imageCount = options?.imageCount
  const blocks: DigitizeFormBlock[] = []

  for (const [index, entry] of raw.entries()) {
    if (!entry || typeof entry !== 'object') {
      throw new TypeError(`Block at index ${index} must be an object`)
    }

    const row = entry as Record<string, unknown>
    const kindRaw = typeof row.kind === 'string' ? row.kind.trim().toLowerCase() : ''

    if (kindRaw === 'text') {
      blocks.push(normalizeTextBlock(row, imageCount, index))
      continue
    }

    if (kindRaw === 'question' || kindRaw === '') {
      blocks.push(normalizeQuestionBlock(row, imageCount, index, kindRaw === 'question'))
      continue
    }

    // LLM sometimes puts the answer type in "kind" (e.g. kind:"radio") instead of
    // kind:"question" + type:"radio". Coerce those into question blocks.
    if (QUESTION_TYPES.has(kindRaw as DigitizeQuestionType)) {
      blocks.push(
        normalizeQuestionBlock(
          { ...row, kind: 'question', type: row.type ?? kindRaw },
          imageCount,
          index,
          true,
        ),
      )
      continue
    }

    throw new TypeError(`Block at index ${index} has invalid kind "${kindRaw}" (expected text|question)`)
  }

  if (!blocks.some((block) => block.kind === 'question')) {
    throw new TypeError('No questions extracted from assessment content')
  }

  return postProcessDigitizeFormBlocks(blocks, {
    documentText: options?.documentText,
    assessmentTitle: options?.assessmentTitle,
  })
}

const NAME_DATE_BLANK_PATTERN =
  /name\s*[:.]?\s*[_\uFF3F.]{3,}[\s\S]{0,40}date\s*[:.]?\s*[_\uFF3F.]{3,}/i

function looksLikeNameDateBlanks(block: DigitizeTextBlock): boolean {
  const blob = `${block.title}\n${block.description ?? ''}`
  if (NAME_DATE_BLANK_PATTERN.test(blob)) {
    return true
  }
  const compact = blob.toLowerCase()
  return (
    /\bname\b/.test(compact) &&
    /\bdate\b/.test(compact) &&
    /_{3,}|\uFF3F{3,}|\.{3,}/.test(blob) &&
    blob.length < 160
  )
}

/** Draw / plot / graph work should become file-response prompts. */
export function looksLikeFileUploadPrompt(title: string): boolean {
  const t = title.toLowerCase()
  // Require an explicit draw/make/graph action — not mere references to prior diagrams.
  if (/\b(draw|sketch|annotate)\b/.test(t)) {
    return true
  }
  if (/\bmake a coordinate plot\b|\bcoordinate plot of the data\b|\bplot of the data from the table\b/.test(t)) {
    return true
  }
  if (/\bgraph(?:ing)? your data\b/.test(t)) {
    return true
  }
  if (/\bphoto of\b/.test(t)) {
    return true
  }
  return false
}

/**
 * Handout offers writing and/or a photo of work → two Form answers
 * (paragraph + optional file), matching teacher-edited assessment Forms.
 */
export function looksLikeWriteOrUploadPrompt(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /\bwords (?:and|or) pictures\b/.test(t) ||
    /\b(write|type|explain).{0,40}\b(or|and\/or)\b.{0,40}\b(draw|sketch|upload|photo|picture|image)\b/.test(
      t,
    ) ||
    /\b(draw|sketch|upload|photo|picture|image).{0,40}\b(or|and\/or)\b.{0,40}\b(write|type|explain)\b/.test(
      t,
    ) ||
    /\bupload or write\b|\bwrite or upload\b/.test(t)
  )
}

/**
 * True when a title looks like a lettered MCQ option ("a. same force"), not a
 * sub-question header ("2a.") or a labeled fill-in blank ("Bat").
 */
export function looksLikeLetteredChoiceOptionTitle(title: string): boolean {
  const trimmed = title.trim()
  // Sub-question numbers like "2a." / "2a. Explain" are NOT choice options.
  if (/^\d+[a-z]\b/i.test(trimmed)) {
    return false
  }
  const match = trimmed.match(/^([a-e])[.)]\s+(\S[\s\S]*)$/i)
  return Boolean(match && match[2].trim().length > 0)
}

/** Stem language that signals choose-one / select-all, not fill-in blanks. */
export function looksLikeChoiceCue(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /\b(circle|choose|select)\b/.test(t) ||
    /\bwhich (of the following|one|option|statement)\b/.test(t) ||
    /\bselect all that apply\b/.test(t) ||
    /\bone of the following\b/.test(t) ||
    /\b(true or false|yes or no)\b/.test(t)
  )
}

function looksLikeYesNoNotSureTitle(title: string): boolean {
  return /^(yes|no|not sure|maybe)$/i.test(title.trim())
}

function questionPromptBlob(block: DigitizeQuestionBlock): string {
  return `${block.title}\n${block.description ?? ''}`
}

function precedingCueText(block: DigitizeFormBlock | undefined): string {
  if (!block) {
    return ''
  }
  if (block.kind === 'text') {
    return `${block.title}\n${block.description ?? ''}`
  }
  return questionPromptBlob(block)
}

function lettersAreSequential(titles: string[]): boolean {
  const letters = titles.map((title) => {
    const match = title.trim().match(/^([a-e])[.)]/i)
    return match?.[1]?.toLowerCase()
  })
  if (letters.some((letter) => !letter)) {
    return false
  }
  for (let i = 1; i < letters.length; i += 1) {
    if (letters[i]!.codePointAt(0) !== letters[i - 1]!.codePointAt(0)! + 1) {
      return false
    }
  }
  return true
}

/**
 * Collapse LLM mistakes where each MCQ alternative became its own short-answer
 * into a single radio/checkbox question.
 */
export function mergeMisclassifiedChoiceOptionRuns(
  blocks: DigitizeFormBlock[],
): DigitizeFormBlock[] {
  const result: DigitizeFormBlock[] = []
  let index = 0

  while (index < blocks.length) {
    const block = blocks[index]
    if (block.kind !== 'question' || (block.type !== 'text' && block.type !== 'paragraph')) {
      result.push(block)
      index += 1
      continue
    }

    const letteredRun: DigitizeQuestionBlock[] = []
    if (looksLikeLetteredChoiceOptionTitle(block.title)) {
      let cursor = index
      while (cursor < blocks.length) {
        const next = blocks[cursor]
        if (
          next.kind !== 'question' ||
          (next.type !== 'text' && next.type !== 'paragraph') ||
          !looksLikeLetteredChoiceOptionTitle(next.title)
        ) {
          break
        }
        letteredRun.push(next)
        cursor += 1
      }

      if (
        letteredRun.length >= 2 &&
        lettersAreSequential(letteredRun.map((entry) => entry.title))
      ) {
        const preceding = result.at(-1)
        const cue = precedingCueText(preceding)
        if (looksLikeChoiceCue(cue) || letteredRun.length >= 2) {
          const choiceType: DigitizeQuestionType = /\bselect all that apply\b/i.test(cue)
            ? 'checkbox'
            : 'radio'

          if (preceding?.kind === 'text') {
            result.pop()
            result.push({
              kind: 'question',
              title: preceding.title,
              ...(preceding.description ? { description: preceding.description } : {}),
              type: choiceType,
              required: true,
              options: letteredRun.map((entry) => entry.title.trim()),
              ...(preceding.imageIndexes?.length
                ? { imageIndexes: preceding.imageIndexes }
                : {}),
            })
          } else {
            result.push({
              kind: 'question',
              title: 'Choose one',
              type: choiceType,
              required: true,
              options: letteredRun.map((entry) => entry.title.trim()),
            })
          }
          index = cursor
          continue
        }
      }
    }

    const yesNoRun: DigitizeQuestionBlock[] = []
    if (looksLikeYesNoNotSureTitle(block.title)) {
      let cursor = index
      while (cursor < blocks.length) {
        const next = blocks[cursor]
        if (
          next.kind !== 'question' ||
          (next.type !== 'text' && next.type !== 'paragraph') ||
          !looksLikeYesNoNotSureTitle(next.title)
        ) {
          break
        }
        yesNoRun.push(next)
        cursor += 1
      }

      if (yesNoRun.length >= 2) {
        const preceding = result.at(-1)
        const cue = precedingCueText(preceding)
        if (looksLikeChoiceCue(cue) || preceding?.kind === 'text') {
          if (preceding?.kind === 'text') {
            result.pop()
            result.push({
              kind: 'question',
              title: preceding.title,
              ...(preceding.description ? { description: preceding.description } : {}),
              type: 'radio',
              required: true,
              options: yesNoRun.map((entry) => entry.title.trim()),
              ...(preceding.imageIndexes?.length
                ? { imageIndexes: preceding.imageIndexes }
                : {}),
            })
          } else {
            result.push({
              kind: 'question',
              title: preceding?.kind === 'question' ? preceding.title : 'Choose one',
              type: 'radio',
              required: true,
              options: yesNoRun.map((entry) => entry.title.trim()),
            })
          }
          index = cursor
          continue
        }
      }
    }

    result.push(block)
    index += 1
  }

  return result
}

/**
 * Fix common LLM/handout artifacts before Form creation.
 * Keeps handout numbering (1. / 2a. / 2b.) — Google Forms does not auto-prefix createItem titles.
 */
export function postProcessDigitizeFormBlocks(
  blocks: DigitizeFormBlock[],
  options?: { documentText?: string; assessmentTitle?: string },
): DigitizeFormBlock[] {
  const result: DigitizeFormBlock[] = []

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (block.kind === 'text' && looksLikeNameDateBlanks(block)) {
      result.push(
        {
          kind: 'question',
          title: 'Name',
          type: 'text',
          required: true,
        },
        {
          kind: 'question',
          title: 'Hour',
          type: 'text',
          required: true,
        },
        {
          kind: 'question',
          title: 'Teacher',
          type: 'text',
          required: true,
        },
      )
      continue
    }

    if (block.kind === 'question') {
      const blob = questionPromptBlob(block)
      if (looksLikeWriteOrUploadPrompt(blob)) {
        result.push(
          {
            ...block,
            type: 'paragraph',
            required: block.required,
          },
          {
            kind: 'question',
            title: normalizeDisplayedText(
              `${block.title.replace(/\s*[—-]\s*\[File response\].*$/i, '').trim()} — photo of your work (optional)`,
            ),
            type: 'file',
            required: false,
            ...(block.sourceNumber ? { sourceNumber: block.sourceNumber } : {}),
          },
        )
        continue
      }

      const type =
        (block.type === 'paragraph' || block.type === 'text') &&
        looksLikeFileUploadPrompt(blob)
          ? 'file'
          : block.type
      result.push({ ...block, type })
      continue
    }

    // Design / "words and pictures" prompts → ONE file question (not a duplicate text card).
    if (block.kind === 'text' && looksLikeDesignDrawStimulusCard(block)) {
      const next = blocks[index + 1]
      const nextIsFileAnswer =
        next?.kind === 'question' &&
        (next.type === 'file' ||
          looksLikeFileUploadPrompt(questionPromptBlob(next)) ||
          looksLikeWriteOrUploadPrompt(questionPromptBlob(next)))

      const stem = nextIsFileAnswer
        ? normalizeDisplayedText(
            prepareFormsTitle(
              next.title.trim().length >= 40 ? next.title : extractDesignDrawStemFromTextCard(block),
            ),
          )
        : extractDesignDrawStemFromTextCard(block)

      const imageIndexes = uniqueImageIndexes([
        ...(block.imageIndexes ?? []),
        ...(nextIsFileAnswer && next.kind === 'question' ? (next.imageIndexes ?? []) : []),
      ])

      result.push({
        kind: 'question',
        title: stem,
        type: 'file',
        required: true,
        ...(imageIndexes.length > 0 ? { imageIndexes } : {}),
      })

      if (nextIsFileAnswer) {
        index += 1
      }
      continue
    }

    result.push(block)
  }

  const withChoices = mergeMisclassifiedChoiceOptionRuns(result)
  return applyAssessment1QualityPostProcess(withChoices, {
    documentText: options?.documentText,
    assessmentTitle: options?.assessmentTitle,
  })
}

function uniqueImageIndexes(indexes: number[]): number[] {
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

/** Section / prompt cards that ask students to draw a design (need a file response). */
export function looksLikeDesignDrawStimulusCard(block: DigitizeTextBlock): boolean {
  const blob = `${block.title}\n${block.description ?? ''}`.toLowerCase()
  if (/\byour design\b/.test(blob) && /\b(draw|words (?:and|or) pictures|design solution)\b/.test(blob)) {
    return true
  }
  return (
    looksLikeWriteOrUploadPrompt(blob) ||
    (/\bdraw the proposed design\b/.test(blob) && /\bdesign solution\b/.test(blob))
  )
}

function extractDesignDrawStemFromTextCard(block: DigitizeTextBlock): string {
  const blob = `${block.title}\n${block.description ?? ''}`.replaceAll(/\s+/g, ' ').trim()
  const numbered = blob.match(/\b(\d+[a-z]?)[.)]\s+(.{40,500}?)(?=\s+\d+[a-z]?[.)]\s+|$)/i)
  if (numbered) {
    return normalizeDisplayedText(`${numbered[1]}. ${numbered[2]}`)
  }
  if (/^\d+[a-z]?[.)]/i.test(block.title.trim())) {
    return normalizeDisplayedText(prepareFormsTitle(block.title))
  }
  return normalizeDisplayedText(
    prepareFormsTitle(
      block.description?.trim()
        ? `${block.title.replace(/\s*[—-].*$/, '').trim()}. ${block.description}`
        : block.title,
    ),
  )
}

function coerceLegacyQuestionsToBlocks(raw: unknown): unknown {
  if (!Array.isArray(raw)) {
    return raw
  }
  if (raw.some((entry) => entry && typeof entry === 'object' && 'kind' in entry)) {
    return raw
  }
  return raw.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      return entry
    }
    return { kind: 'question', ...(entry as object) }
  })
}

function normalizeTextBlock(
  row: Record<string, unknown>,
  imageCount: number | undefined,
  index: number,
): DigitizeTextBlock {
  const title = typeof row.title === 'string' ? row.title.trim() : ''
  if (!title) {
    throw new TypeError(`Text block at index ${index} is missing a title`)
  }
  const description =
    typeof row.description === 'string' && row.description.trim()
      ? normalizeDescriptionText(row.description)
      : undefined
  const imageIndexes = normalizeImageIndexes(row.imageIndexes, imageCount, index)
  return {
    kind: 'text',
    title,
    ...(description ? { description } : {}),
    ...(imageIndexes.length > 0 ? { imageIndexes } : {}),
  }
}

function normalizeOptions(raw: unknown, index: number): string[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new TypeError(`Choice question at index ${index} requires a non-empty options array`)
  }
  const options: string[] = []
  for (const value of raw) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new TypeError(`Choice question at index ${index} has an invalid options entry`)
    }
    options.push(value.trim())
  }
  return options
}

function normalizeQuestionBlock(
  row: Record<string, unknown>,
  imageCount: number | undefined,
  index: number,
  requireKind: boolean,
): DigitizeQuestionBlock {
  if (requireKind && row.kind !== 'question') {
    throw new TypeError(`Block at index ${index} must have kind "question"`)
  }

  const title = typeof row.title === 'string' ? row.title.trim() : ''
  if (!title) {
    throw new TypeError(`Question at index ${index} is missing a title`)
  }

  const typeRaw = typeof row.type === 'string' ? row.type.trim().toLowerCase() : ''
  if (!QUESTION_TYPES.has(typeRaw as DigitizeQuestionType)) {
    throw new TypeError(
      `Question at index ${index} has invalid type "${typeRaw}" (expected text|paragraph|file|radio|checkbox)`,
    )
  }
  const type = typeRaw as DigitizeQuestionType

  const required = typeof row.required === 'boolean' ? row.required : true
  const imageIndexes = normalizeImageIndexes(row.imageIndexes, imageCount, index)
  const sourceNumber =
    typeof row.sourceNumber === 'number' && Number.isInteger(row.sourceNumber) && row.sourceNumber > 0
      ? row.sourceNumber
      : undefined

  const options = CHOICE_TYPES.has(type) ? normalizeOptions(row.options, index) : undefined
  const description =
    typeof row.description === 'string' && row.description.trim()
      ? normalizeDescriptionText(row.description)
      : undefined

  return {
    kind: 'question',
    title,
    type,
    required,
    ...(description ? { description } : {}),
    ...(options ? { options } : {}),
    ...(imageIndexes.length > 0 ? { imageIndexes } : {}),
    ...(sourceNumber ? { sourceNumber } : {}),
  }
}

function normalizeImageIndexes(
  raw: unknown,
  imageCount: number | undefined,
  blockIndex: number,
): number[] {
  if (raw === undefined || raw === null) {
    return []
  }
  if (!Array.isArray(raw)) {
    throw new TypeError(`Block at index ${blockIndex} has invalid imageIndexes (expected array)`)
  }

  const seen = new Set<number>()
  const indexes: number[] = []

  for (const value of raw) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
      throw new TypeError(
        `Block at index ${blockIndex} has invalid imageIndexes entry "${String(value)}"`,
      )
    }
    if (imageCount !== undefined && value > imageCount) {
      throw new TypeError(
        `Block at index ${blockIndex} references imageIndexes ${value} but only ${imageCount} images exist`,
      )
    }
    if (!seen.has(value)) {
      seen.add(value)
      indexes.push(value)
    }
  }

  return indexes
}

export function blocksToQuestions(blocks: DigitizeFormBlock[]): DigitizeQuestion[] {
  return blocks
    .filter((block): block is DigitizeQuestionBlock => block.kind === 'question')
    .map(({ kind: _kind, ...question }) => question)
}

/** Where the Form will live — changes file-response copy. */
export type FileResponseVariant = 'curriculum-example' | 'teacher-export'

export interface DigitizeToFormItemsOptions {
  /**
   * Drive folder URL for student file responses (teacher-export live copies).
   * Curriculum template Forms omit this — draw prompts stay paste-a-link example copy.
   */
  uploadFolderUrl?: string
  /**
   * `curriculum-example` (default): library preview — paste-a-link + export hint.
   * `teacher-export`: live teacher copy — paste-a-link until native File upload convert runs.
   */
  fileResponseVariant?: FileResponseVariant
  /**
   * Map of 1-based image index → publicly fetchable HTTPS URI for Forms `sourceUri`.
   */
  imageSourceUris?: Map<number, string> | Record<number, string>
}

/**
 * Build the Form prompt for an explicit upload / draw question.
 * Native fileUploadQuestion is not creatable via Forms API; teacher-export Forms
 * keep a `[File response]` marker that Playwright converts to File upload.
 * Returns title (stem) + description (file-response instructions).
 */
export function formatFileResponseFields(
  title: string,
  options?: {
    description?: string
    uploadFolderUrl?: string
    fileResponseVariant?: FileResponseVariant
  },
): { title: string; description: string } {
  const cleanTitle = normalizeDisplayedText(prepareFormsTitle(title))
  const variant = options?.fileResponseVariant ?? 'curriculum-example'
  let uploadHint: string
  if (variant === 'curriculum-example') {
    uploadHint =
      'Library example only — paste a link to your file for now. When this assessment is exported to a teacher’s Google Drive, Dott.it creates a native File upload question.'
  } else if (options?.uploadFolderUrl) {
    uploadHint = `Upload a photo or PDF of your work to this Drive folder, then paste the file link in your answer: ${options.uploadFolderUrl}`
  } else {
    uploadHint =
      'Upload a photo or PDF of your work (this becomes a File upload question after Dott.it finishes setting up the form).'
  }
  const fileLine = `${FILE_RESPONSE_MARKER} ${uploadHint}`
  const existing = options?.description?.trim()
    ? normalizeDescriptionText(prepareFormsDescription(options.description))
    : ''
  const description = existing ? `${existing}\n\n${fileLine}` : fileLine
  return { title: cleanTitle, description }
}

/**
 * @deprecated Prefer {@link formatFileResponseFields} (hint lives in description).
 */
export function formatFileResponseQuestionTitle(
  title: string,
  uploadFolderUrl?: string,
): string {
  const fields = formatFileResponseFields(title, {
    uploadFolderUrl,
    fileResponseVariant: uploadFolderUrl ? 'teacher-export' : 'curriculum-example',
  })
  return normalizeDisplayedText(`${fields.title} — ${fields.description.replaceAll(/\n+/g, ' ')}`)
}

/**
 * Normalize whitespace for Forms createItem titles.
 * The Forms API rejects newlines in displayed titles (UI-edited forms may still show soft breaks).
 */
export function normalizeDisplayedText(value: string): string {
  return value
    .replaceAll(/\r\n|\r|\n/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
}

/**
 * Keep blank-line paragraph breaks in descriptions (assessment / question context).
 * Preserves single newlines (tables / soft breaks); collapses 3+ blank lines to `\n\n`.
 */
export function normalizeDescriptionText(value: string): string {
  return value
    .replaceAll(/\r\n|\r/g, '\n')
    .replaceAll(/[ \t]+\n/g, '\n')
    .replaceAll(/\n[ \t]+/g, '\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .replaceAll(/[ \t]{2,}/g, ' ')
    .trim()
}

/** @deprecated Use {@link normalizeDisplayedText}. */
export function flattenDisplayedText(value: string): string {
  return normalizeDisplayedText(value)
}

function resolveImageUri(
  index: number,
  imageSourceUris?: Map<number, string> | Record<number, string>,
): string | undefined {
  if (!imageSourceUris) {
    return undefined
  }
  if (imageSourceUris instanceof Map) {
    return imageSourceUris.get(index)
  }
  return imageSourceUris[index]
}

function resolveImageUris(
  indexes: number[],
  options?: DigitizeToFormItemsOptions,
): Array<{ index: number; uri: string }> {
  return indexes
    .map((index) => ({ index, uri: resolveImageUri(index, options?.imageSourceUris) }))
    .filter((row): row is { index: number; uri: string } => Boolean(row.uri))
}

function buildQuestionPayload(
  block: DigitizeQuestionBlock,
  options?: DigitizeToFormItemsOptions,
): QuestionItem {
  let title = normalizeDisplayedText(prepareFormsTitle(block.title))
  let description = block.description?.trim()
    ? normalizeDescriptionText(prepareFormsDescription(block.description))
    : undefined

  // Draw/plot prompts: stem stays in title; file-response instructions go in description
  // (native fileUploadQuestion is not creatable via Forms API on curriculum-owned Forms).
  if (block.type === 'file') {
    const fields = formatFileResponseFields(block.title, {
      description: block.description,
      uploadFolderUrl: options?.uploadFolderUrl,
      fileResponseVariant: options?.fileResponseVariant,
    })
    title = fields.title
    description = fields.description
  }

  const baseQuestion: QuestionItem['questionItem']['question'] = {
    required: block.required,
  }

  if (block.type === 'radio' || block.type === 'checkbox') {
    baseQuestion.choiceQuestion = {
      type: block.type === 'checkbox' ? 'CHECKBOX' : 'RADIO',
      options: (block.options ?? []).map((value) => ({
        value: normalizeDisplayedText(prepareFormsOption(value)),
      })),
    }
  } else {
    baseQuestion.textQuestion = {
      paragraph: block.type !== 'text',
    }
  }

  return {
    title,
    ...(description ? { description } : {}),
    questionItem: {
      question: baseQuestion,
    },
  }
}

/**
 * Map digitize questions to Google Forms createItem payloads.
 * Prefer {@link digitizeFormBlocksToFormItems} for curriculum fidelity.
 */
export function digitizeQuestionsToFormItems(
  questions: DigitizeQuestion[],
  options?: DigitizeToFormItemsOptions,
): FormCreateItem[] {
  return digitizeFormBlocksToFormItems(
    questions.map((question) => ({ kind: 'question' as const, ...question })),
    options,
  )
}

/**
 * Map ordered text + question blocks to Forms createItem payloads.
 *
 * Structure (teacher-edited assessment Forms):
 * - Assessment / question header + context (+ figure) live in ONE card:
 *   imageItem title+description when figures exist; otherwise textItem title+description.
 * - Sub-questions (2a, 2b, …) are separate answer items after that card.
 */
export function digitizeFormBlocksToFormItems(
  blocks: DigitizeFormBlock[],
  options?: DigitizeToFormItemsOptions,
): FormCreateItem[] {
  const items: FormCreateItem[] = []

  for (const block of blocks) {
    if (block.kind === 'text') {
      const uris = resolveImageUris(block.imageIndexes ?? [], options)
      const description = block.description?.trim()
        ? normalizeDescriptionText(prepareFormsDescription(block.description))
        : undefined
      if (uris.length > 0) {
        // One bordered card: header (title) + context (description) + figure.
        // Do not emit a separate textItem above the image — Forms cannot nest
        // an image inside a text block.
        const [first, ...rest] = uris
        items.push({
          title: normalizeDisplayedText(prepareFormsTitle(block.title)),
          ...(description ? { description } : {}),
          imageItem: {
            image: {
              sourceUri: first.uri,
              altText: `Figure ${first.index}`,
            },
          },
        })
        for (const image of rest) {
          items.push({
            imageItem: {
              image: {
                sourceUri: image.uri,
                altText: `Figure ${image.index}`,
              },
            },
          })
        }
      } else {
        items.push({
          title: normalizeDisplayedText(prepareFormsTitle(block.title)),
          ...(description ? { description } : {}),
          textItem: {},
        })
      }
      continue
    }

    const uris = resolveImageUris(block.imageIndexes ?? [], options)
    // Always emit figures as imageItem cards — questionItem.image is easy to miss in the UI.
    for (const image of uris) {
      items.push({
        imageItem: {
          image: {
            sourceUri: image.uri,
            altText: `Figure ${image.index}`,
          },
        },
      })
    }

    items.push(buildQuestionPayload(block, options))
  }

  return items
}

/**
 * Collect unique 1-based image indexes referenced by blocks or questions.
 */
export function collectReferencedImageIndexes(
  blocksOrQuestions: DigitizeFormBlock[] | DigitizeQuestion[],
): number[] {
  const seen = new Set<number>()
  const indexes: number[] = []

  for (const entry of blocksOrQuestions) {
    for (const index of entry.imageIndexes ?? []) {
      if (!seen.has(index)) {
        seen.add(index)
        indexes.push(index)
      }
    }
  }
  return indexes
}

/**
 * Build the LLM prompt for handout → Form blocks.
 * Exported for unit tests that assert asset-catalog wiring.
 */
export function buildExtractionPrompt(
  assessmentTitle: string,
  documentText: string,
  imageCount: number,
  assetCatalog?: AssetCatalogEntry[],
): string {
  const catalog = assetCatalog ?? []
  const catalogBlock = formatAssetCatalogForPrompt(catalog)
  const goldBlock = formatAssessment1GoldForPrompt()
  const imageRules =
    imageCount > 0
      ? `
- The document text includes markers like [IMAGE:1] … [IMAGE:${imageCount}] where figures appear.
- Attach relevant 1-based indexes via "imageIndexes" on the stimulus text block (question-header card) that needs the figure — not on every sub-question.
- Do not invent indexes outside 1..${imageCount}.
- Skip decorative logos, title icons, checkmarks, pencils, and page chrome.
- Prefer critical graphs/diagrams/data-table figures over every decorative photo.
- kind "table": put that single imageIndexes entry on the section’s text block and do NOT re-type the whole table into description (header + image is enough). NEVER paste rows of numbers (mass/speed/mph tables) into description — those belong only as imageIndexes.
- kind "composed": already merges adjacent panels (e.g. three ball choices) into ONE asset — attach that single index once; do not expect separate indexes per panel.
- kind "figure": single photo/graph/diagram — attach on the matching stem text block.
- When a graph or data table exists as [IMAGE:N] near a question, attach imageIndexes on that question’s Layer A text block.
- When a graph exists as [IMAGE:N], put imageIndexes on that section’s text block the same way.`
      : `
- There are no figure markers in this document; omit "imageIndexes".`

  return `You convert OpenSciEd assessment handouts into an ordered Google Form structure matching teacher-edited assessment Forms.

Assessment title: ${assessmentTitle}

## Target Form structure

1) Assessment header card
- After Name / Hour / Teacher, emit kind "text" with title EXACTLY equal to the Assessment title above (e.g. "Baseball Assessment 2"). Do NOT copy handout document/barcode IDs into the title (ignore trailing numbers like "21905019050").
- description = assessment context / intro copied from the handout (full paragraphs, not a one-line summary).
- Put blank lines (\`\\n\\n\`) between distinct paragraphs in description so it reads in spaced chunks (e.g. background paragraph, then a blank line, then the call-to-action paragraph).

1b) Early stimulus sections (BEFORE Question 1)
- Section headings that appear after the intro and before Question 1 (e.g. "Weather Conditions and Pitch Speed") must be kind "text" cards in that document order — title = section heading, description = the section prose (graph callouts, "To the right is a graph…", etc.).
- Attach the matching early figure/graph imageIndexes on THAT section text card (not on Question 8/9).
- Do NOT treat narrative callout prose as a data table. Data-table images belong with the later questions that reference those tables.

2) Numbered questions — prefer ONE answer item when there is a single response
- When the handout question is answered by a single draw/upload/explain response: emit ONE kind "question" whose title is "N. " + the FULL handout stem, type "file" or "paragraph" as appropriate. Attach imageIndexes on that question when a figure belongs with the stem. Do NOT emit a separate text header card plus an empty "Na." answer.
- When the handout question is a single multiple-choice (lettered a./b./c./d. under one stem): emit ONE kind "question" type "radio" whose title is "N. " + the FULL stem, with options for each alternative. Do NOT emit a "N." text card plus a bare "Na." radio.
- When the question has MULTIPLE distinct answer parts (materials blanks, 2a/2b/2c, radio then explain): use a Layer A text card whose title is "N. " + the first stem paragraph (same "N. texto" pattern as other questions — never a bare "N." title). Put remaining instructional paragraphs in "description" with blank lines (\`\\n\\n\`) between them. Then emit Layer B answer items.
- Section headers like "Considerations for design" may introduce numbered student prompts (1. purpose/criteria, 2. stakeholder/constraints). Emit the header as a text card, then ONE answer item per numbered prompt (paragraph unless the stem asks to draw). Never leave "1." / "2." only inside a section description with no answer field.
- Fill-in worksheets and reading checklists (questions followed by underline blanks like "What is the central idea or claim? ________"): emit a section text card for each heading (e.g. "Obtaining information from scientific text"), then ONE "paragraph" question per fill-in prompt. NEVER dump the entire checklist into a single kind "text" card with no answer items — students must type answers in the Form.
- Numbered items such as 1a. / 1b. / 1c. that ask the student to synthesize, draw pedigrees, write a model, or explain MUST be answer items (paragraph or file). A text-only "1a." card with no following question is invalid.
- CRITICAL: Never emit a Layer A text block whose title is only "1" / "2" / "3" with an empty or tiny description. The student must be able to read the full prompt from the Form card.
- CRITICAL anti-pattern: "2." text card with the stem + empty "2a." file question. That must be ONE file question titled with the full stem.
- CRITICAL anti-pattern: "10." text card with the stem + "10a." radio with choices. That must be ONE radio titled with the full stem.

3) Answer item types — classify from stem CONTEXT, not from how options are listed
- "text" = short fill-in only: Name, Hour, Teacher, a single numeric/prediction value, or a **labeled material blank that appears in THIS handout** (e.g. title "Bat" only if the handout has a Bat fill-in line). Never use "text" for multiple-choice alternatives. Never invent baseball materials (Bat / Pitcher / Ball / Wind) for other units.
- "paragraph" = written explanation, CER/argument, open reasoning, long response.
- "file" = draw / free-body diagram / coordinate plot / line of best fit / graph your data / photo of drawn work / explain-with-diagram work. Prefer "file" when the handout asks students to draw OR to show work that is naturally photographed (same quality bar as teacher-edited Baseball Assessment Forms).
- "radio" = student must pick **exactly one** option. Use when the handout shows lettered choices (a./b./c.), Yes/No/Not sure, True/False, or says circle / choose one / which of the following. REQUIRED non-empty "options" array. Put the stem in title/description; put each alternative ONLY in "options" (keep "a. …" wording). Do NOT emit a separate short-answer question per alternative.
- "checkbox" = select-all-that-apply. REQUIRED "options". Same rule: options live in "options", never as separate "text" questions.
- CRITICAL anti-pattern to avoid: turning "a. … / b. … / c. …" into three type "text" questions. That is ONE "radio" (or "checkbox") with three options.
- Contrast — labeled blanks vs choices:
  - Choice: "Circle one: a. same force  b. different force" → one "radio" with those options.
  - Blank: "Bat: ____  Pitcher: ____" → separate short "text" questions titled Bat / Pitcher (these are fill-ins, not a./b./c. choices).
- When students may answer by writing OR by uploading a photo of work ("words and pictures", "words or pictures", write-or-draw): emit TWO questions — (1) paragraph text box, (2) optional "file" for a photo of work. If the teacher-edited pattern uses a single file response for that prompt (e.g. draw on the figure provided), a single "file" is also acceptable. Never leave a "Your design" / "words and pictures" / "Draw the proposed design" prompt as a text-only card with no answer item.
- Drawing-only prompts → single "file" question.
- Investigation prompts that ask students to list materials: emit the stem as a text block with FULL description, then a short "text" question for each labeled fill-in line that actually appears in THIS handout (Bat / Pitcher / Ball / Wind only if printed). Then paragraph questions for any "Other items needed…" / "My plan…" lines that appear. If the handout has no labeled material blanks, keep the investigation as paragraph/file items matching the handout — do not invent baseball blanks. NEVER fuse labeled blanks into one "3a" paragraph.
- If the prompt is an open “does this support… why?” CER without fixed choices, use "paragraph" (optionally a Yes/No "radio" first when the handout explicitly asks yes/no, then a paragraph for the explanation).

4) Headers vs body + emphasis
- Put question numbers and short headers in "title". Prefer "N. first paragraph of the stem" so the Form reads "3. How would you…" on one line (never title "3." alone with the stem only in description).
- Put continuing paragraphs in "description" with blank lines (\`\\n\\n\`) between instructional beats (e.g. after "List the items…", before "Then describe…").
- KEEP handout numbering in titles (e.g. "1.", "2a.", "2b."). Set sourceNumber when it is a single integer.
- Forms titles already get native heavier weight in the Forms UI (like section headers). Do NOT wrap titles or material blanks (Bat, Pitcher, Ball, Wind, Name, Hour, Teacher) in **asterisks** — leave them plain. Do not invent emphasis markers for ordinary verbs.
- Name / Hour / Teacher → the FIRST three short "text" questions in the Form, BEFORE the assessment intro text card. Do NOT use Date (Google Forms already records a submission timestamp). If the handout shows Name/Date blanks, map Date → Teacher and still include Hour.
- Do NOT emit a text block that is only Name/Date underline blanks.
- Skip teacher-only rubrics/answer keys/page numbers. Do not invent questions.

${goldBlock}

Return ONLY a JSON array of blocks (no markdown fences, no commentary). Each block is one of:

1) Context / section / question-header card (NOT a student answer):
{ "kind": "text", "title": string, "description"?: string, "imageIndexes"?: number[] }

2) Student answer item:
{ "kind": "question", "title": string, "description"?: string, "type": "text"|"paragraph"|"radio"|"checkbox"|"file", "required": boolean, "options"?: string[], "imageIndexes"?: number[], "sourceNumber"?: number }
${imageRules}
${catalogBlock ? `\n${catalogBlock}\n` : ''}
Document text:
---
${documentText.slice(0, 60_000)}
---`
}

function parseJsonFromLlmContent(content: string): unknown {
  const trimmed = content.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1]?.trim() ?? trimmed
  return JSON.parse(candidate) as unknown
}

export interface ExtractFormBlocksOptions {
  imageCount?: number
  assetCatalog?: AssetCatalogEntry[]
}

/**
 * Use the LLM to turn handout plain text into ordered Form blocks (text + questions).
 */
export async function extractFormBlocksFromText(
  assessmentTitle: string,
  documentText: string,
  options?: ExtractFormBlocksOptions,
): Promise<DigitizeFormBlock[]> {
  if (!documentText.trim()) {
    throw new Error('Assessment document text is empty')
  }

  const imageCount = options?.imageCount ?? options?.assetCatalog?.length ?? 0
  const llm = new ChatOpenAI({
    model: 'gpt-4.1-mini',
    temperature: 0.1,
  })

  const response = await llm.invoke(
    buildExtractionPrompt(assessmentTitle, documentText, imageCount, options?.assetCatalog),
  )
  const content = response.content?.toString() ?? ''
  const parsed = parseJsonFromLlmContent(content)
  return normalizeDigitizeFormBlocks(parsed, {
    imageCount: imageCount > 0 ? imageCount : undefined,
    documentText,
    assessmentTitle,
  })
}

/**
 * Use the LLM to turn handout plain text into typed Form questions (legacy helper).
 */
export async function extractQuestionsFromText(
  assessmentTitle: string,
  documentText: string,
  options?: ExtractFormBlocksOptions,
): Promise<DigitizeQuestion[]> {
  const blocks = await extractFormBlocksFromText(assessmentTitle, documentText, options)
  return blocksToQuestions(blocks)
}
