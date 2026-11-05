'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { ThumbsUp, Lightbulb, Check, SquarePen, Star } from 'lucide-react'
import { cn } from '@/app/lib/utils/utils'
import { savedFeedbackFavoriteStorageKey } from '@/app/lib/saved-suggestion-favorite/normalize-suggestion-favorite'

export type FeedbackRowVariant = 'strength' | 'suggestion' | 'comment'

export function normalizeTeacherRowType(type: string): 'strength' | 'suggestion' | 'comment' {
  if (type === 'suggestion' || type === 'improvement') return 'suggestion'
  if (type === 'comment') return 'comment'
  return 'strength'
}

export function feedbackRowVariant(type: string): FeedbackRowVariant {
  return normalizeTeacherRowType(type)
}

function sectionLabelForFeedbackType(t: 'strength' | 'suggestion' | 'comment'): string {
  if (t === 'suggestion') return 'suggestion'
  if (t === 'comment') return 'comment'
  return 'strength'
}

function rowSelectedClassNames(variant: FeedbackRowVariant): string {
  if (variant === 'strength') return 'bg-strength-bg/50 border-strength/30 shadow-sm'
  if (variant === 'suggestion') return 'bg-suggestion-bg/50 border-suggestion/30 shadow-sm'
  return 'bg-primary/5 border-primary/30 shadow-sm'
}

function editPanelClassNames(variant: FeedbackRowVariant): string {
  if (variant === 'strength') return 'border-strength/40 bg-strength-bg/30'
  if (variant === 'suggestion') return 'border-suggestion/40 bg-suggestion-bg/30'
  return 'border-primary/40 bg-primary/5'
}

function draftTypeToApiType(draftType: 'strength' | 'suggestion' | 'comment'): string {
  if (draftType === 'suggestion') return 'suggestion'
  if (draftType === 'comment') return 'comment'
  return 'strength'
}

function variantToApiType(variant: FeedbackRowVariant): string {
  if (variant === 'suggestion') return 'suggestion'
  if (variant === 'comment') return 'comment'
  return 'strength'
}

function favoriteStarTextClass(variant: FeedbackRowVariant): string {
  if (variant === 'suggestion') return 'text-suggestion'
  if (variant === 'comment') return 'text-primary'
  return 'text-strength'
}

export function FeedbackItemRow({
  content,
  selected,
  variant,
  onToggle,
  editable = false,
  onEditSave,
  initialFeedbackType = 'strength',
  isSaving = false,
  readOnly = false,
  /** When true, edit mode hides Strength / Suggestion / Comment toggles (e.g. AI template rows). */
  hideFeedbackTypeSwitcher = false,
  /** Label stored with a saved favorite (e.g. AI `section` field). */
  sectionLabel,
  onSaveFavorite,
  isSavingFavorite = false,
  /** Keys from `savedFeedbackFavoriteStorageKey` for rows already in the teacher library. */
  savedFavoriteKeys,
}: {
  content: string
  selected: boolean
  variant: FeedbackRowVariant
  onToggle: () => void
  editable?: boolean
  readOnly?: boolean
  onEditSave?: (payload: {
    content: string
    type: string
    section: string
  }) => void | Promise<void>
  initialFeedbackType?: 'strength' | 'suggestion' | 'comment'
  isSaving?: boolean
  hideFeedbackTypeSwitcher?: boolean
  sectionLabel?: string
  onSaveFavorite?: (payload: { content: string; type: string; section: string }) => void
  isSavingFavorite?: boolean
  savedFavoriteKeys?: ReadonlySet<string>
}) {
  const [editing, setEditing] = useState(false)
  const [draftContent, setDraftContent] = useState(content)
  const [draftType, setDraftType] = useState<'strength' | 'suggestion' | 'comment'>(initialFeedbackType)

  useEffect(() => {
    if (!editing) {
      setDraftContent(content)
      setDraftType(initialFeedbackType)
    }
  }, [content, initialFeedbackType, editing])

  const selectedStyles = rowSelectedClassNames(variant)
  const unselectedStyles =
    'border-border bg-card opacity-70 hover:opacity-100 hover:border-muted-foreground/30'

  let circleStyles: string
  if (variant === 'strength') {
    circleStyles = selected
      ? 'bg-strength border-strength'
      : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
  } else if (variant === 'suggestion') {
    circleStyles = selected
      ? 'bg-suggestion border-suggestion'
      : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
  } else {
    circleStyles = selected
      ? 'bg-primary border-primary'
      : 'border-muted-foreground/30 group-hover:border-muted-foreground/50'
  }

  const handleSaveEdit = async () => {
    const trimmed = draftContent.trim()
    if (!trimmed || !onEditSave) return
    const apiType = draftTypeToApiType(draftType)
    try {
      await onEditSave({
        content: trimmed,
        type: apiType,
        section: sectionLabelForFeedbackType(draftType),
      })
      setEditing(false)
    } catch {
      // Keep the editor open so the teacher can retry; parent may toast.
    }
  }

  const handleCancelEdit = () => {
    setDraftContent(content)
    setDraftType(initialFeedbackType)
    setEditing(false)
  }

  const resolvedSectionLabel =
    sectionLabel?.trim() || sectionLabelForFeedbackType(initialFeedbackType)

  const currentFavoriteStorageKey = useMemo(() => {
    const apiType =
      editing && !hideFeedbackTypeSwitcher ? draftTypeToApiType(draftType) : variantToApiType(variant)
    const section =
      editing && !hideFeedbackTypeSwitcher
        ? sectionLabelForFeedbackType(draftType)
        : resolvedSectionLabel
    const text = (editing ? draftContent : content).trim()
    return savedFeedbackFavoriteStorageKey({ type: apiType, section, content: text })
  }, [
    content,
    draftContent,
    draftType,
    editing,
    hideFeedbackTypeSwitcher,
    resolvedSectionLabel,
    variant,
  ])

  const isInFavorites = Boolean(
    currentFavoriteStorageKey && savedFavoriteKeys?.has(currentFavoriteStorageKey),
  )

  const handleFavoriteClick = (e: React.MouseEvent, textOverride?: string) => {
    e.stopPropagation()
    e.preventDefault()
    if (!onSaveFavorite) return
    const raw = textOverride ?? (editing ? draftContent : content)
    const trimmed = raw.trim()
    if (!trimmed) return
    const apiType =
      editing && !hideFeedbackTypeSwitcher ? draftTypeToApiType(draftType) : variantToApiType(variant)
    const section =
      editing && !hideFeedbackTypeSwitcher
        ? sectionLabelForFeedbackType(draftType)
        : resolvedSectionLabel
    onSaveFavorite({
      content: trimmed,
      type: apiType,
      section,
    })
  }

  const showFavoriteRow = Boolean(onSaveFavorite) && !readOnly

  if (editing && editable && onEditSave) {
    return (
      <div
        className={cn('rounded-lg border p-2.5 transition-all', editPanelClassNames(variant))}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <textarea
          className={cn(
            'flex min-h-[72px] w-full resize-none rounded-md border border-border bg-card px-2 py-1.5 text-sm leading-relaxed ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            hideFeedbackTypeSwitcher ? 'mb-0' : 'mb-2',
          )}
          value={draftContent}
          onChange={(e) => setDraftContent(e.target.value)}
          disabled={isSaving}
          aria-label="Edit feedback text"
        />
        {hideFeedbackTypeSwitcher ? null : (
          <div className="mb-2 mt-2 flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-7 rounded-full px-2.5 text-xs',
                draftType === 'strength' && 'border-strength bg-strength-bg/50 text-strength',
              )}
              onClick={() => setDraftType('strength')}
            >
              <ThumbsUp className="mr-1 size-3" />
              Strength
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-7 rounded-full px-2.5 text-xs',
                draftType === 'suggestion' && 'border-suggestion bg-suggestion-bg/50 text-suggestion',
              )}
              onClick={() => setDraftType('suggestion')}
            >
              <Lightbulb className="mr-1 size-3" />
              Suggestion
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-7 rounded-full px-2.5 text-xs',
                draftType === 'comment' && 'border-primary bg-primary/10 text-primary',
              )}
              onClick={() => setDraftType('comment')}
            >
              Comment
            </Button>
          </div>
        )}
        <div className={cn('flex justify-end gap-2', hideFeedbackTypeSwitcher ? 'mt-2' : '')}>
          {showFavoriteRow ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 gap-1 px-2 text-xs',
                isInFavorites ? 'text-amber-600 dark:text-amber-400' : favoriteStarTextClass(variant),
              )}
              title={
                isInFavorites
                  ? 'This text is already in your favorites'
                  : 'Add to your favorites'
              }
              aria-label={
                isInFavorites ? 'Already in favorites' : 'Add feedback to favorites'
              }
              onClick={(e) => handleFavoriteClick(e, draftContent)}
              disabled={isSaving || isSavingFavorite || !draftContent.trim()}
            >
              <Star
                className={cn(
                  'size-3.5 shrink-0',
                  isInFavorites && 'fill-amber-400 text-amber-600 dark:fill-amber-500 dark:text-amber-400',
                )}
              />
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancelEdit} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-7 text-xs"
            onMouseDown={(e) => {
              // Prevent the click from landing on the toggle row after the editor unmounts.
              e.preventDefault()
            }}
            onClick={(e) => {
              e.stopPropagation()
              void handleSaveEdit()
            }}
            disabled={!draftContent.trim() || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    )
  }

  if (readOnly) {
    return (
      <div
        role="group"
        className={cn(
          'group relative cursor-default overflow-hidden rounded-lg border p-2.5 transition-all',
          selected ? selectedStyles : unselectedStyles,
        )}
      >
        <div className="flex items-start gap-2.5 pr-[4.25rem] sm:pr-24">
          <p
            className={cn(
              'flex-1 text-sm leading-relaxed',
              selected ? 'font-medium text-foreground' : 'text-foreground',
            )}
          >
            {content}
          </p>
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <div
            className={cn(
              'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
              circleStyles,
            )}
          >
            {selected ? <Check className="h-2.5 w-2.5 text-card" strokeWidth={3} /> : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg border p-2.5 transition-all',
        selected ? selectedStyles : unselectedStyles
      )}
    >
      <div className="flex items-start gap-2.5 pr-[4.25rem] sm:pr-28">
        <p
          className={cn(
            'flex-1 text-sm leading-relaxed',
            selected ? 'font-medium text-foreground' : 'text-foreground',
          )}
        >
          {content}
        </p>
      </div>
      <div className="absolute right-2 top-2 flex items-center gap-1.5">
        {editable && onEditSave ? (
          <div className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-secondary"
              title="Edit feedback"
              aria-label="Edit feedback"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setEditing(true)
              }}
            >
              <SquarePen className="size-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        ) : null}
        {showFavoriteRow ? (
          <div
            className={cn(
              'transition-opacity',
              isInFavorites
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
            )}
          >
            <button
              type="button"
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-secondary',
                isInFavorites ? 'text-amber-600 dark:text-amber-400' : favoriteStarTextClass(variant),
              )}
              title={
                isInFavorites
                  ? 'This text is already in your favorites'
                  : 'Add feedback to your favorites'
              }
              aria-label={
                isInFavorites ? 'Already in favorites' : 'Add feedback to favorites'
              }
              onClick={(e) => handleFavoriteClick(e)}
              disabled={isSavingFavorite || !content.trim()}
            >
              <Star
                className={cn(
                  'size-3.5',
                  isInFavorites
                    ? 'fill-amber-400 text-amber-600 dark:fill-amber-500 dark:text-amber-400'
                    : 'opacity-90 hover:opacity-100',
                )}
              />
            </button>
          </div>
        ) : null}
        <div
          className={cn(
            'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
            circleStyles
          )}
        >
          {selected ? (
            <Check className="h-2.5 w-2.5 text-card" strokeWidth={3} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
