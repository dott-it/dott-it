import { significantTokens } from './formal-files'

export interface TeLinkCandidate {
  id: string
  title: string
  buildingTowards?: string | null
  lookListenFor?: string | null
  whatToDo?: string | null
  peCode?: string | null
}

function candidateHaystack(candidate: TeLinkCandidate): string {
  return [candidate.title, candidate.buildingTowards, candidate.lookListenFor, candidate.whatToDo]
    .filter((value): value is string => Boolean(value?.trim()))
    .join('\n')
}

export function scoreTeLinkForFormal(formalTitle: string, candidate: TeLinkCandidate): number {
  const haystack = candidateHaystack(candidate)
  if (!haystack.trim()) {
    return 0
  }

  let score = 0
  if (
    /complete the assessment|ask students to complete|individually complete assessment|refer to assessment key|refer to key:/i.test(
      haystack,
    )
  ) {
    score += 6
  }
  if (/independent assessment|unit assessment|summative assessment/i.test(haystack)) {
    score += 3
  }
  if (/\bassessment\b/i.test(haystack)) {
    score += 2
  }
  if (candidate.buildingTowards?.trim() && candidate.lookListenFor?.trim() && candidate.whatToDo?.trim()) {
    score += 2
  }
  if (candidate.peCode?.trim()) {
    score += 1
  }

  const formalTokens = significantTokens(formalTitle)
  const candidateTokens = significantTokens(haystack)
  for (const token of formalTokens) {
    if (candidateTokens.has(token)) {
      score += 2
    }
  }

  return score
}

export function pickLinkedTeOpportunityId(
  formalTitle: string,
  candidates: TeLinkCandidate[],
  usedIds: Set<string> = new Set(),
): string | undefined {
  const unused = candidates.filter((candidate) => !usedIds.has(candidate.id))
  const pool = unused.length > 0 ? unused : candidates

  let bestId: string | undefined
  let bestScore = -1

  for (const candidate of pool) {
    const score = scoreTeLinkForFormal(formalTitle, candidate)
    if (score > bestScore) {
      bestScore = score
      bestId = candidate.id
    }
  }

  if (bestScore > 0) {
    return bestId
  }

  return pool.find((candidate) => candidateHaystack(candidate).trim())?.id
}
