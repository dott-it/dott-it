/** Serializable library activity hit used by client search UI. */
export interface LibraryActivitySearchResult {
  grade: number
  unitCode: string
  unitTitle: string
  lessonNumber: number
  title: string
  kind: 'assessment' | 'opportunity'
  categoryLabel: string
  href: string
}
