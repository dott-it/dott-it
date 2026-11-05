/**
 * Shared types for export utilities
 */

export interface FeedbackCard {
  id: string
  type: 'strength' | 'suggestion' | 'comment' | 'improvement'
  section: string
  content: string
}

export interface StudentRecord {
  id: string
  name: string
  email: string
  class?: string
  submittedAt?: Date
  responses?: string[]
  score?: number
  maxScore?: number
  status?: string
}

export interface Assessment {
  id: string
  title: string
  unitName?: string
  dueDate?: Date
  maxScore?: number
}

export interface ExportOptions {
  fileName?: string
  includeMetadata?: boolean
  format?: 'pdf' | 'doc'
}
