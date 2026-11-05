export interface SavedSuggestionFavorite {
  id: string
  tenantId: string
  ownerUserId: string
  type: string
  section: string
  content: string
  createdAt: string
  updatedAt: string
}

export type CreateSavedSuggestionFavoriteBody = {
  type: string
  section: string
  content: string
}
