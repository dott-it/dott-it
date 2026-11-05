import type { ThematicAnalysis, ThematicAnalysisItemType } from '@/types'

export interface ThematicHighlightPhrase {
  phrase: string
  type: ThematicAnalysisItemType
}

const HIGHLIGHT_CLASS_NEED =
  'rounded-sm !bg-orange-100 px-0.5 !text-orange-950 ring-1 ring-orange-200 dark:!bg-orange-950/40 dark:!text-orange-50 dark:ring-orange-800'

const HIGHLIGHT_CLASS_STRENGTH =
  'rounded-sm !bg-green-100 px-0.5 !text-green-950 ring-1 ring-green-200 dark:!bg-green-950/40 dark:!text-green-50 dark:ring-green-800'

export function escapeHtml(raw: string): string {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

type Interval = { start: number; end: number; type: ThematicAnalysisItemType }

/** Map smart quotes to ASCII so LLM snippets still match form text (same string length). */
export function normalizeQuotesForMatch(raw: string): string {
  return raw
    .replaceAll('\u2018', "'")
    .replaceAll('\u2019', "'")
    .replaceAll('\u201C', '"')
    .replaceAll('\u201D', '"')
}

function mergeIntervalsWithNeedPriority(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return []
  const sorted = [...intervals].sort(
    (a, b) => a.start - b.start || a.end - b.end,
  )
  const out: Interval[] = []
  for (const cur of sorted) {
    const last = out.at(-1)
    if (last === undefined || cur.start >= last.end) {
      out.push({ ...cur })
      continue
    }
    last.end = Math.max(last.end, cur.end)
    last.type =
      cur.type === 'need' || last.type === 'need' ? 'need' : 'strength'
  }
  return out
}

function collectIntervals(plainText: string, phrases: ThematicHighlightPhrase[]): Interval[] {
  const intervals: Interval[] = []
  const normFull = normalizeQuotesForMatch(plainText)

  for (const { phrase, type } of phrases) {
    if (phrase.length === 0) continue
    const normPhrase = normalizeQuotesForMatch(phrase)
    if (normPhrase.length === 0 || normPhrase.length > plainText.length) continue

    let from = 0
    while (from <= normFull.length - normPhrase.length) {
      let idx = plainText.indexOf(phrase, from)
      let len = phrase.length
      if (idx === -1) {
        idx = normFull.indexOf(normPhrase, from)
        len = normPhrase.length
      }
      if (idx === -1) break
      intervals.push({ start: idx, end: idx + len, type })
      from = idx + len
    }
  }
  return intervals
}

/**
 * Wraps verbatim citation substrings in `<mark>` with Tailwind classes (orange = need, green = strength).
 * `plainText` must be plain answer text (not HTML); output is safe HTML fragments.
 */
export function buildHtmlWithThematicHighlights(
  plainText: string,
  phrases: ThematicHighlightPhrase[],
): string {
  if (!plainText) return ''
  if (phrases.length === 0) return escapeHtml(plainText)

  const merged = mergeIntervalsWithNeedPriority(collectIntervals(plainText, phrases))
  if (merged.length === 0) return escapeHtml(plainText)

  let out = ''
  let cursor = 0
  for (const span of merged) {
    const safeStart = Math.max(0, span.start)
    const safeEnd = Math.min(plainText.length, span.end)
    if (safeStart > plainText.length || safeEnd <= safeStart) continue
    if (safeStart > cursor) {
      out += escapeHtml(plainText.slice(cursor, safeStart))
    }
    const cls =
      span.type === 'need' ? HIGHLIGHT_CLASS_NEED : HIGHLIGHT_CLASS_STRENGTH
    out += `<mark class="${cls}">${escapeHtml(plainText.slice(safeStart, safeEnd))}</mark>`
    cursor = Math.max(cursor, safeEnd)
  }
  if (cursor < plainText.length) {
    out += escapeHtml(plainText.slice(cursor))
  }
  return out
}

/**
 * Collects highlight phrases from the latest completed thematic analysis for this student only.
 */
export function buildThematicHighlightSegmentsFromAnalysis(
  analysis: ThematicAnalysis | null,
  studentEntryId: string,
  learnerId: string,
): ThematicHighlightPhrase[] {
  if (!analysis?.items?.length) return []

  const phrases: ThematicHighlightPhrase[] = []
  for (const item of analysis.items) {
    const t: ThematicAnalysisItemType =
      item.type === 'strength' ? 'strength' : 'need'
    for (const c of item.citations) {
      const sameStudent =
        c.assessmentRecordId === studentEntryId ||
        (learnerId.length > 0 && c.learnerId === learnerId)
      if (!sameStudent) continue
      for (const h of c.highlights) {
        const p = typeof h === 'string' ? h.trim() : ''
        if (p.length > 0) phrases.push({ phrase: p, type: t })
      }
    }
  }
  return phrases
}
