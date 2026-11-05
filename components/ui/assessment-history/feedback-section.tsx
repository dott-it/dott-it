'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card } from '@/app/lib/components/ui/layout/card'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ThumbsUp,
  Lightbulb,
  Plus,
  ChevronDown,
  SquarePen,
  Filter,
  Sparkles,
  Trash2,
  Download,
  Star,
} from 'lucide-react'
import type { AssessmentRecord, FeedbackSection as FeedbackSectionType } from '@/app/types'
import { CreateFeedbackSectionData } from '@/app/types/api/feedback-section'
import { cn } from '@/app/lib/utils/utils'
import { FeedbackItemRow, feedbackRowVariant, normalizeTeacherRowType } from './feedback-item-row'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  normalizeSuggestionFavoritePayload,
  savedFeedbackFavoriteStorageKey,
} from '@/app/lib/saved-suggestion-favorite/normalize-suggestion-favorite'
import { savedSuggestionFavoriteQueries } from '@/app/lib/services/saved-suggestion-favorite/saved-suggestion-favorite.queries'
import type { SavedSuggestionFavorite } from '@/types'

function formatLastUpdated(date: Date | string): string {
  const d = new Date(date)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${weekday} ${time}`
}

function feedbackSectionLabel(
  row: { section?: string | null; type?: string | null },
  fallback: 'strength' | 'suggestion' | 'comment',
): string {
  const s = row.section?.trim()
  if (s) return s
  if (fallback === 'strength') return 'strength'
  if (fallback === 'comment') return 'comment'
  return 'suggestion'
}

function savedTypeBadgeNormalizedType(type: string): 'strength' | 'suggestion' | 'comment' {
  const u = type.toLowerCase()
  if (u === 'strength') return 'strength'
  if (u === 'comment') return 'comment'
  return 'suggestion'
}

function savedTypeBadge(t: string): string {
  switch (savedTypeBadgeNormalizedType(t)) {
    case 'strength': {
      return 'Strength'
    }
    case 'comment': {
      return 'Comment'
    }
    default: {
      return 'Suggestion'
    }
  }
}

function savedTypeBadgeClass(type: string): string {
  switch (savedTypeBadgeNormalizedType(type)) {
    case 'strength': {
      return 'border-strength/40 bg-strength-bg/50 text-strength'
    }
    case 'comment': {
      return 'border-primary/40 bg-primary/10 text-primary'
    }
    default: {
      return 'border-suggestion/40 bg-suggestion-bg/50 text-suggestion'
    }
  }
}

/** Hide `section` next to the chip when it only repeats the feedback type (e.g. type strength + section "strength"). */
function sectionIsRedundantWithSavedType(type: string, section: string | undefined): boolean {
  const normalizedType = savedTypeBadgeNormalizedType(type)
  const s = (section ?? '').trim().toLowerCase()
  if (!s) return true
  if (s === normalizedType) return true
  if (normalizedType === 'suggestion' && s === 'improvement') return true
  return false
}

function SavedFeedbackFavoriteList({
  items,
  isSavingFeedback,
  deletePending,
  onInsert,
  onDelete,
}: {
  items: SavedSuggestionFavorite[]
  isSavingFeedback: boolean
  deletePending: boolean
  onInsert: (f: SavedSuggestionFavorite) => void
  onDelete: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-muted-foreground">No favorites in this tab yet.</p>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((f) => (
        <li key={f.id} className="rounded-md border border-border bg-card p-2 text-sm">
          <p className="line-clamp-3 leading-relaxed text-foreground">{f.content}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className={cn(
                  'shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                  savedTypeBadgeClass(f.type),
                )}
              >
                {savedTypeBadge(f.type)}
              </span>
              {sectionIsRedundantWithSavedType(f.type, f.section) ? null : (
                <span className="truncate text-[10px] text-muted-foreground" title={f.section}>
                  {f.section}
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs transition-colors hover:bg-primary/10 hover:text-primary"
                disabled={isSavingFeedback}
                onClick={() => onInsert(f)}
              >
                Add Feedback
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                title="Remove from favorites"
                aria-label="Remove favorite feedback"
                disabled={deletePending}
                onClick={(e) => {
                  e.preventDefault()
                  void onDelete(f.id)
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export interface FeedbackSectionProps {
  feedbackCards: FeedbackSectionType[]
  strengths: FeedbackSectionType[]
  suggestions: FeedbackSectionType[]
  customStrengths: FeedbackSectionType[]
  customSuggestions: FeedbackSectionType[]
  customComments: FeedbackSectionType[]
  selectedAiSuggestionIds: Set<string>
  lastUpdated: Date | string
  record: AssessmentRecord
  onToggleFeedback: (section: FeedbackSectionType) => void
  onAddFeedback: (data: CreateFeedbackSectionData) => void
  onUpdateTeacherFeedback?: (
    sectionId: string,
    data: { content?: string; type?: string; section?: string },
  ) => void | Promise<void>
  onClearAllFeedback?: () => void
  /** When set, shows Export PDF using the current workspace selection (draft + selected AI). */
  onExportPdf?: () => void
  isSavingFeedback?: boolean
  /** Shared record: read-only controls; no helper copy in the toolbar (Past Attempts carries the archive label). */
  readOnlyFeedback?: boolean
}

export function FeedbackSection({
  feedbackCards,
  strengths,
  suggestions,
  customStrengths,
  customSuggestions,
  customComments,
  selectedAiSuggestionIds,
  lastUpdated,
  record: _record,
  onToggleFeedback,
  onAddFeedback,
  onUpdateTeacherFeedback,
  onClearAllFeedback,
  onExportPdf,
  isSavingFeedback = false,
  readOnlyFeedback = false,
}: FeedbackSectionProps) {
  const queryClient = useQueryClient()
  const [customText, setCustomText] = useState('')
  const [customType, setCustomType] = useState<'strength' | 'suggestion' | 'comment'>('strength')
  const [viewMode, setViewMode] = useState<'all' | 'selected'>('all')
  const [savedLibraryOpen, setSavedLibraryOpen] = useState(false)

  const { data: savedFavorites = [], isLoading: savedFavoritesLoading } =
    savedSuggestionFavoriteQueries.list.useQuery({
      enabled: !readOnlyFeedback,
    })

  const savedFavoriteKeys = useMemo(() => {
    const set = new Set<string>()
    for (const f of savedFavorites) {
      const k = savedFeedbackFavoriteStorageKey({
        type: f.type,
        section: f.section,
        content: f.content,
      })
      if (k) set.add(k)
    }
    return set
  }, [savedFavorites])

  const savedFavoritesByType = useMemo(() => {
    const out: {
      strength: SavedSuggestionFavorite[]
      suggestion: SavedSuggestionFavorite[]
      comment: SavedSuggestionFavorite[]
    } = { strength: [], suggestion: [], comment: [] }
    for (const f of savedFavorites) {
      out[savedTypeBadgeNormalizedType(f.type)].push(f)
    }
    return out
  }, [savedFavorites])

  const savedLibraryDefaultTab = useMemo((): 'strength' | 'suggestion' | 'comment' => {
    if (savedFavoritesByType.strength.length > 0) return 'strength'
    if (savedFavoritesByType.suggestion.length > 0) return 'suggestion'
    return 'comment'
  }, [savedFavoritesByType])

  const createFavoriteMutation = savedSuggestionFavoriteQueries.create.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: savedSuggestionFavoriteQueries.list.getOptions().queryKey,
      })
    },
  })

  const deleteFavoriteMutation = savedSuggestionFavoriteQueries.delete.useMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: savedSuggestionFavoriteQueries.list.getOptions().queryKey,
      })
    },
  })

  const handleSaveFavorite = useCallback(
    (payload: { content: string; type: string; section: string }) => {
      const normalized = normalizeSuggestionFavoritePayload(payload)
      if (!normalized.ok) return
      void createFavoriteMutation.mutateAsync({
        type: normalized.value.type,
        section: normalized.value.section,
        content: normalized.value.content,
      })
    },
    [createFavoriteMutation],
  )

  const insertSavedFavorite = useCallback(
    (f: SavedSuggestionFavorite) => {
      const normalized = normalizeSuggestionFavoritePayload({
        type: f.type,
        section: f.section,
        content: f.content,
      })
      if (!normalized.ok) return
      onAddFeedback({
        type: normalized.value.type,
        section: normalized.value.section,
        content: normalized.value.content,
        used: true,
      })
      setSavedLibraryOpen(false)
    },
    [onAddFeedback],
  )

  /** Template row is selected if it appears in the expanded id set or any draft row still points at it (stable after AI text edits). */
  const isSelected = (section: FeedbackSectionType) => {
    if (!section.id) return false
    const id = String(section.id)
    if (selectedAiSuggestionIds.has(id)) return true
    return feedbackCards.some((s) => String(s.originalSectionId ?? '') === id)
  }

  /** AI template `used` reflects past exports / server state — only `isSelected` matches the current draft. */
  const strengthsSelected = strengths.filter((s) => isSelected(s)).length + customStrengths.length
  const suggestionsSelected =
    suggestions.filter((s) => isSelected(s)).length + customSuggestions.length

  /** Must match visible checkmarks (not raw `feedbackCards.length`, which can include orphan rows). */
  const selectedCount = useMemo(() => {
    const templateRowSelected = (s: FeedbackSectionType) => {
      if (!s.id) return false
      const id = String(s.id)
      if (selectedAiSuggestionIds.has(id)) return true
      return feedbackCards.some((row) => String(row.originalSectionId ?? '') === id)
    }
    return (
      strengths.filter((s) => templateRowSelected(s)).length +
      suggestions.filter((s) => templateRowSelected(s)).length +
      customStrengths.length +
      customSuggestions.length +
      customComments.filter((c) => c.used !== false).length
    )
  }, [
    strengths,
    suggestions,
    customStrengths,
    customSuggestions,
    customComments,
    selectedAiSuggestionIds,
    feedbackCards,
  ])

  const visibleCustomCards = useMemo(
    () =>
      customComments.filter((c) => (viewMode === 'all' ? true : c.used !== false)),
    [customComments, viewMode],
  )

  const handleAddCustom = () => {
    if (!customText.trim()) return
    onAddFeedback({
      type: customType,
      section: customType,
      content: customText.trim(),
      used: true,
    })
    setCustomText('')
  }

  return (
    <Card className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex shrink-0 flex-col justify-start border-b border-border bg-secondary/30 px-6 py-4">
        <h2 className="font-serif text-base font-semibold text-foreground">Feedback</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Last updated {formatLastUpdated(lastUpdated)}
        </p>
      </div>
      <div
        className={cn(
          'flex shrink-0 flex-wrap items-center gap-4 border-b border-border bg-muted/30 px-6 py-3',
          readOnlyFeedback ? 'justify-start' : 'justify-between',
        )}
      >
        {readOnlyFeedback ? null : (
          <p className="text-xs text-muted-foreground">
            Click any item to toggle selection. Selected items will be sent to student.
          </p>
        )}
        <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-lg bg-secondary p-1">
          <Button
            variant={viewMode === 'all' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setViewMode('all')}
          >
            All
          </Button>
          <Button
            variant={viewMode === 'selected' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 gap-1 px-3 text-xs"
            onClick={() => setViewMode('selected')}
          >
            <Filter className="size-3" />
            Selected
            <span className="ml-1 inline-flex items-center rounded-full border border-transparent bg-background px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80">
              {selectedCount}
            </span>
          </Button>
          {!readOnlyFeedback && onExportPdf ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-3 text-xs"
              onClick={onExportPdf}
              disabled={isSavingFeedback}
              title="Export selected feedback as PDF"
            >
              <Download className="size-3" />
              Export PDF
            </Button>
          ) : null}
          {readOnlyFeedback ? null : (
            <Popover open={savedLibraryOpen} onOpenChange={setSavedLibraryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 px-3 text-xs"
                  type="button"
                  disabled={isSavingFeedback}
                  title="Insert favorite feedback from your favorites"
                >
                  <Star className="size-3" />
                  Favorites
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-96 p-3"
                align="end"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <p className="mb-2 text-xs font-medium text-foreground">Favorite feedback</p>
                {savedFavoritesLoading ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : (
                  (savedFavorites.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Star any feedback row to add it to your favorites, then insert it on any student.
                    </p>
                  ) : (
                    <Tabs defaultValue={savedLibraryDefaultTab} className="w-full">
                      <TabsList className="grid h-auto w-full grid-cols-3 gap-0.5 p-1">
                        <TabsTrigger
                          value="strength"
                          title="Strength"
                          className="flex flex-col gap-0.5 px-1 py-2 text-[10px] leading-tight sm:flex-row sm:items-center sm:gap-1 sm:text-xs"
                        >
                          <ThumbsUp className="mx-auto size-3.5 shrink-0 text-strength sm:mx-0" />
                          <span className="truncate">Strength</span>
                          <span className="tabular-nums text-muted-foreground">
                            ({savedFavoritesByType.strength.length})
                          </span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="suggestion"
                          title="Suggestions"
                          className="flex flex-col gap-0.5 px-1 py-2 text-[10px] leading-tight sm:flex-row sm:items-center sm:gap-1 sm:text-xs"
                        >
                          <Lightbulb className="mx-auto size-3.5 shrink-0 text-suggestion sm:mx-0" />
                          <span className="truncate">Suggestion</span>
                          <span className="tabular-nums text-muted-foreground">
                            ({savedFavoritesByType.suggestion.length})
                          </span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="comment"
                          title="Comments"
                          className="flex flex-col gap-0.5 px-1 py-2 text-[10px] leading-tight sm:flex-row sm:items-center sm:gap-1 sm:text-xs"
                        >
                          <SquarePen className="mx-auto size-3.5 shrink-0 text-primary sm:mx-0" />
                          <span className="truncate">Comments</span>
                          <span className="tabular-nums text-muted-foreground">
                            ({savedFavoritesByType.comment.length})
                          </span>
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent
                        value="strength"
                        className="mt-2 max-h-[min(18rem,55vh)] overflow-y-auto overscroll-y-contain pr-0.5"
                      >
                        <SavedFeedbackFavoriteList
                          items={savedFavoritesByType.strength}
                          isSavingFeedback={isSavingFeedback}
                          deletePending={deleteFavoriteMutation.isPending}
                          onInsert={insertSavedFavorite}
                          onDelete={(id) => {
                            void deleteFavoriteMutation.mutateAsync({ id })
                          }}
                        />
                      </TabsContent>
                      <TabsContent
                        value="suggestion"
                        className="mt-2 max-h-[min(18rem,55vh)] overflow-y-auto overscroll-y-contain pr-0.5"
                      >
                        <SavedFeedbackFavoriteList
                          items={savedFavoritesByType.suggestion}
                          isSavingFeedback={isSavingFeedback}
                          deletePending={deleteFavoriteMutation.isPending}
                          onInsert={insertSavedFavorite}
                          onDelete={(id) => {
                            void deleteFavoriteMutation.mutateAsync({ id })
                          }}
                        />
                      </TabsContent>
                      <TabsContent
                        value="comment"
                        className="mt-2 max-h-[min(18rem,55vh)] overflow-y-auto overscroll-y-contain pr-0.5"
                      >
                        <SavedFeedbackFavoriteList
                          items={savedFavoritesByType.comment}
                          isSavingFeedback={isSavingFeedback}
                          deletePending={deleteFavoriteMutation.isPending}
                          onInsert={insertSavedFavorite}
                          onDelete={(id) => {
                            void deleteFavoriteMutation.mutateAsync({ id })
                          }}
                        />
                      </TabsContent>
                    </Tabs>
                  ))
                )}
              </PopoverContent>
            </Popover>
          )}
          {!readOnlyFeedback && onClearAllFeedback && selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-3 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={onClearAllFeedback}
              title="Clear all selected feedback"
            >
              <Trash2 className="size-3" />
              Clear all
            </Button>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
        <div
          data-scroll-region="feedback"
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
          dir="ltr"
        >
          <div className="min-w-full space-y-3 pb-2">
              {/* Strengths Collapsible */}
              {strengths.length > 0 && (
                <Collapsible defaultOpen>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="size-4 text-strength" />
                          <span className="text-sm font-medium text-foreground">Strengths</span>
                          <span className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80">
                            {strengthsSelected}/{strengths.length}
                          </span>
                        </div>
                        <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:overflow-hidden">
                      <div className="space-y-2 overflow-hidden px-3 pb-3">
                        <div className="flex items-center gap-2 px-1 pt-2">
                          <Sparkles className="size-3 text-muted-foreground" />
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            AI Suggestions
                          </span>
                        </div>
                        {strengths.map((section, index) => {
                          const selected = Boolean(isSelected(section))
                          const show =
                            viewMode === 'all' || (viewMode === 'selected' && selected)
                          if (!show) return null
                          return (
                            <FeedbackItemRow
                              key={section.id ?? index}
                              content={section.content}
                              selected={selected}
                              variant="strength"
                              readOnly={readOnlyFeedback}
                              onToggle={() => onToggleFeedback(section)}
                              editable={Boolean(!readOnlyFeedback && section.id && onUpdateTeacherFeedback)}
                              onEditSave={
                                section.id && onUpdateTeacherFeedback
                                  ? (payload) =>
                                      onUpdateTeacherFeedback(section.id as string, {
                                        content: payload.content,
                                        type: payload.type,
                                        section: payload.section,
                                      })
                                  : undefined
                              }
                              initialFeedbackType={normalizeTeacherRowType(section.type)}
                              isSaving={isSavingFeedback}
                              hideFeedbackTypeSwitcher
                              sectionLabel={feedbackSectionLabel(section, 'strength')}
                              onSaveFavorite={readOnlyFeedback ? undefined : handleSaveFavorite}
                              isSavingFavorite={createFavoriteMutation.isPending}
                              savedFavoriteKeys={savedFavoriteKeys}
                            />
                          )
                        })}
                        {customStrengths.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 px-1 pt-2">
                              <SquarePen className="size-3 text-muted-foreground" />
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                Custom Strength
                              </span>
                            </div>
                            {customStrengths.map((card, index) => {
                              const show =
                                viewMode === 'all' || (viewMode === 'selected' && card.used !== false)
                              if (!show) return null
                              return (
                                <FeedbackItemRow
                                  key={card.id ?? `custom-strength-${index}`}
                                  content={card.content}
                                  selected={card.used !== false}
                                  variant="strength"
                                  readOnly={readOnlyFeedback}
                                  onToggle={() => onToggleFeedback(card)}
                                  editable={Boolean(!readOnlyFeedback && card.id && onUpdateTeacherFeedback)}
                                  onEditSave={
                                    card.id && onUpdateTeacherFeedback
                                      ? (payload) =>
                                          onUpdateTeacherFeedback(card.id as string, {
                                            content: payload.content,
                                            type: payload.type,
                                            section: payload.section,
                                          })
                                      : undefined
                                  }
                                  initialFeedbackType={normalizeTeacherRowType(card.type)}
                                  isSaving={isSavingFeedback}
                                  sectionLabel={feedbackSectionLabel(card, 'strength')}
                                  onSaveFavorite={readOnlyFeedback ? undefined : handleSaveFavorite}
                                  isSavingFavorite={createFavoriteMutation.isPending}
                                  savedFavoriteKeys={savedFavoriteKeys}
                                />
                              )
                            })}
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Suggestions Collapsible */}
              {suggestions.length > 0 && (
                <Collapsible defaultOpen>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb className="size-4 text-suggestion" />
                          <span className="text-sm font-medium text-foreground">Suggestions</span>
                          <span className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80">
                            {suggestionsSelected}/{suggestions.length}
                          </span>
                        </div>
                        <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:overflow-hidden">
                      <div className="space-y-2 overflow-hidden px-3 pb-3">
                        <div className="flex items-center gap-2 px-1 pt-2">
                          <Sparkles className="size-3 text-muted-foreground" />
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            AI Suggestions
                          </span>
                        </div>
                        {suggestions.map((section, index) => {
                          const selected = Boolean(isSelected(section))
                          const show =
                            viewMode === 'all' || (viewMode === 'selected' && selected)
                          if (!show) return null
                          return (
                            <FeedbackItemRow
                              key={section.id ?? index}
                              content={section.content}
                              selected={selected}
                              variant="suggestion"
                              readOnly={readOnlyFeedback}
                              onToggle={() => onToggleFeedback(section)}
                              editable={Boolean(!readOnlyFeedback && section.id && onUpdateTeacherFeedback)}
                              onEditSave={
                                section.id && onUpdateTeacherFeedback
                                  ? (payload) =>
                                      onUpdateTeacherFeedback(section.id as string, {
                                        content: payload.content,
                                        type: payload.type,
                                        section: payload.section,
                                      })
                                  : undefined
                              }
                              initialFeedbackType={normalizeTeacherRowType(section.type)}
                              isSaving={isSavingFeedback}
                              hideFeedbackTypeSwitcher
                              sectionLabel={feedbackSectionLabel(section, 'suggestion')}
                              onSaveFavorite={readOnlyFeedback ? undefined : handleSaveFavorite}
                              isSavingFavorite={createFavoriteMutation.isPending}
                              savedFavoriteKeys={savedFavoriteKeys}
                            />
                          )
                        })}
                        {customSuggestions.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 px-1 pt-2">
                              <SquarePen className="size-3 text-muted-foreground" />
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                Custom Suggestion
                              </span>
                            </div>
                            {customSuggestions.map((card, index) => {
                              const show =
                                viewMode === 'all' || (viewMode === 'selected' && card.used !== false)
                              if (!show) return null
                              return (
                                <FeedbackItemRow
                                  key={card.id ?? `custom-suggestion-${index}`}
                                  content={card.content}
                                  selected={card.used !== false}
                                  variant="suggestion"
                                  readOnly={readOnlyFeedback}
                                  onToggle={() => onToggleFeedback(card)}
                                  editable={Boolean(!readOnlyFeedback && card.id && onUpdateTeacherFeedback)}
                                  onEditSave={
                                    card.id && onUpdateTeacherFeedback
                                      ? (payload) =>
                                          onUpdateTeacherFeedback(card.id as string, {
                                            content: payload.content,
                                            type: payload.type,
                                            section: payload.section,
                                          })
                                      : undefined
                                  }
                                  initialFeedbackType={normalizeTeacherRowType(card.type)}
                                  isSaving={isSavingFeedback}
                                  sectionLabel={feedbackSectionLabel(card, 'suggestion')}
                                  onSaveFavorite={readOnlyFeedback ? undefined : handleSaveFavorite}
                                  isSavingFavorite={createFavoriteMutation.isPending}
                                  savedFavoriteKeys={savedFavoriteKeys}
                                />
                              )
                            })}
                          </>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Teacher comments (persisted on this pending feedback) */}
              {customComments.length > 0 && (
                <Collapsible defaultOpen>
                  <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <SquarePen className="size-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            Comments
                          </span>
                          <span className="inline-flex items-center rounded-full border border-transparent bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                            {visibleCustomCards.length}
                          </span>
                        </div>
                        <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden data-[state=closed]:overflow-hidden">
                      <div
                        className={cn(
                          'overflow-hidden px-3',
                          visibleCustomCards.length > 0 && 'space-y-2 pt-1 pb-3',
                          visibleCustomCards.length === 0 && 'py-0',
                        )}
                      >
                        {customComments.map((card, index) => {
                          const show =
                            viewMode === 'all' || (viewMode === 'selected' && card.used !== false)
                          if (!show) return null
                          const rowVariant = feedbackRowVariant(card.type)
                          const selected = card.used !== false
                          return (
                            <FeedbackItemRow
                              key={card.id ?? `custom-${index}`}
                              content={card.content}
                              selected={selected}
                              variant={rowVariant}
                              readOnly={readOnlyFeedback}
                              onToggle={() => onToggleFeedback(card)}
                              editable={Boolean(!readOnlyFeedback && card.id && onUpdateTeacherFeedback)}
                              onEditSave={
                                card.id && onUpdateTeacherFeedback
                                  ? (payload) =>
                                      onUpdateTeacherFeedback(card.id as string, {
                                        content: payload.content,
                                        type: payload.type,
                                        section: payload.section,
                                      })
                                  : undefined
                              }
                              initialFeedbackType={normalizeTeacherRowType(card.type)}
                              isSaving={isSavingFeedback}
                              sectionLabel={feedbackSectionLabel(card, 'comment')}
                              onSaveFavorite={readOnlyFeedback ? undefined : handleSaveFavorite}
                              isSavingFavorite={createFavoriteMutation.isPending}
                              savedFavoriteKeys={savedFavoriteKeys}
                            />
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )}

              {/* Write Custom Feedback Collapsible */}
              {readOnlyFeedback ? null : (
              <Collapsible defaultOpen>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="size-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Write Custom Feedback
                        </span>
                      </div>
                      <ChevronDown className="size-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:overflow-hidden">
                    <div className="space-y-3 overflow-hidden bg-secondary/30 p-4">
                      <div className="space-y-2">
                        <textarea
                          className="flex min-h-[100px] w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Write your custom feedback here..."
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          disabled={isSavingFeedback}
                        />
                        <p className="text-xs text-muted-foreground">
                          Write your feedback, then select a label
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomType('strength')}
                          className={cn(
                            'rounded-full border border-border bg-secondary/50 text-sm font-medium text-muted-foreground',
                            customType === 'strength' &&
                              'border-strength bg-strength-bg/50 text-strength'
                          )}
                        >
                          <ThumbsUp className="mr-1.5 size-3.5" />
                          Strength
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomType('suggestion')}
                          className={cn(
                            'rounded-full border border-border bg-secondary/50 text-sm font-medium text-muted-foreground',
                            customType === 'suggestion' &&
                              'border-suggestion bg-suggestion-bg/50 text-suggestion'
                          )}
                        >
                          <Lightbulb className="mr-1.5 size-3.5" />
                          Suggestion
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCustomType('comment')}
                          className={cn(
                            'rounded-full border border-border bg-secondary/50 text-sm font-medium text-muted-foreground',
                            customType === 'comment' && 'border-primary bg-primary/10 text-primary'
                          )}
                        >
                          Comment
                        </Button>
                        <div className="flex-1" />
                        <Button
                          size="sm"
                          onClick={handleAddCustom}
                          disabled={!customText.trim() || isSavingFeedback}
                        >
                          <Plus className="mr-1 size-3" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
              )}
            </div>
        </div>
      </div>
    </Card>
  )
}
