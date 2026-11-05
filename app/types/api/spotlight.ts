import type { SpotlightThematicStatus } from '@/lib/spotlight/eligibility'

export type { SpotlightThematicStatus } from '@/lib/spotlight/eligibility'

export interface SpotlightCard {
  assessmentId: string
  title: string
  studentResponsesCount: number
  hours: string[]
  thematicStatus: SpotlightThematicStatus
}

export type SpotlightCardsResponse = SpotlightCard[]

export interface DismissSpotlightParams {
  assessmentId: string
}

export interface DismissSpotlightResponse {
  ok: true
}
