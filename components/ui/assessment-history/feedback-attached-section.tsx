'use client'

import React, { useState } from 'react'
import {
  ChevronDown,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { FeedbackPreviewModal } from './feedback-preview-modal'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { Badge } from '@/app/lib/components/ui/feedback/badge'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { AssessmentRecord } from '@/app/types'
import { FeedbackSection, CreateFeedbackSectionData } from '@/app/types/api/feedback-section'
import { SortableCard } from '../sortable-card'

interface FeedbackDraftSectionProps {
  feedbackCards: FeedbackSection[]
  onAddFeedback: (feedbackSection: CreateFeedbackSectionData) => void
  onUpdateFeedback: (id: string, updates: Partial<FeedbackSection>) => void
  onDeleteFeedback: (id: string) => void
  onReorderCards: (newOrder: FeedbackSection[]) => void
  onClearAllFeedback: () => void
  isEditing?: boolean
  isSavingFeedback?: boolean
  onCancelEdit?: () => void
  studentRecord?:AssessmentRecord
  assessment?: {
    id: string
    title: string
    unitName?: string
    dueDate?: Date
  }
  feedbackId?: string
  feedbackStatus?: string
  onCreateDraftFeedback?: () => void
  onSaveFeedback?: (feedbackId: string) => void
}


export function FeedbackDraftSection({
  feedbackCards,
  onAddFeedback,
  onUpdateFeedback,
  onDeleteFeedback,
  onReorderCards,
  onClearAllFeedback,
  isEditing = false,
  isSavingFeedback = false,
  onCancelEdit,
  studentRecord,
  assessment,
  feedbackId: _feedbackId,
  feedbackStatus: _feedbackStatus,
  onCreateDraftFeedback,
  onSaveFeedback: _onSaveFeedback,
}: FeedbackDraftSectionProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [editingState, setEditingState] = useState<{
    cardId: string | null
    type: 'strength' | 'suggestion' |'improvement'| 'comment'
    section: string
    content: string
  }>({
    cardId: null,
    type: 'strength' as const,
    section: '',
    content: '',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = feedbackCards.findIndex((card) => card.id === active.id)
      const newIndex = feedbackCards.findIndex((card) => card.id === over?.id)

      const newOrder = arrayMove(feedbackCards, oldIndex, newIndex)
      onReorderCards?.(newOrder)
    }
  }

  const handleEditFeedback = (card: FeedbackSection) => {
    setEditingState({
      cardId: card.id?? '',
      type: card.type as 'strength' | 'suggestion' | 'improvement' | 'comment',
      section: card.section,
      content: card.content,
    })
  }

  const handleSaveFeedback = () => {
    if (editingState.cardId) {
      onUpdateFeedback(editingState.cardId, {
        type: editingState.type,
        section: editingState.section,
        content: editingState.content,
      })
      setEditingState({
        cardId: null,
        type: 'strength',
        section: '',
        content: '',
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingState({
      cardId: null,
      type: 'strength',
      section: '',
      content: '',
    })
  }

  const handleToggleType = () => {
    setEditingState((prev) => ({
      ...prev,
      type: (() => {
        if (prev.type === 'strength') {
          return 'suggestion'
        }
        if (prev.type === 'suggestion') {
          return 'comment'
        }
        return 'strength'
      })(),
    }))
  }

  const handleClearAll = () => {
    onClearAllFeedback()
    setClearConfirmOpen(false)
  }

  // Always render the component, even when there are no feedback cards

  return (
    <div className="border-b">
      <Card className="rounded-none border-0">
        <Collapsible open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <CollapsibleTrigger asChild>
            <CardContent className="cursor-pointer p-4 transition-colors hover:bg-muted/50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left side - Info badges */}
                <div className="flex items-center gap-2">
                  {isSavingFeedback && (
                    <div
                      className="flex items-center gap-1 text-xs text-muted-foreground"
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <RefreshCw className="h-3 w-3 animate-spin" aria-hidden />
                      Saving...
                    </div>
                  )}
                  {isEditing && (
                    <Badge
                      variant="outline"
                      className="border-purple-200 bg-purple-50 text-xs text-purple-700 dark:border-purple-800 dark:bg-purple-950/20 dark:text-purple-400"
                    >
                      Edit Mode
                    </Badge>
                  )}
                  <div
                    className="flex items-center gap-2"
                    aria-live="polite"
                    role="status"
                  >
                    {feedbackCards.length > 0 ? (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {feedbackCards.length} item{feedbackCards.length === 1 ? '' : 's'}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {feedbackCards.some((card) => card.type === 'strength') && (
                            <Badge
                              variant="outline"
                              className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
                            >
                              {feedbackCards.filter((card) => card.type === 'strength').length}{' '}
                              strength
                              {feedbackCards.filter((card) => card.type === 'strength').length === 1
                                ? ''
                                : 's'}
                            </Badge>
                          )}
                          {feedbackCards.some((card) => card.type === 'suggestion') && (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                            >
                              {feedbackCards.filter((card) => card.type === 'suggestion').length}{' '}
                              suggestion
                              {feedbackCards.filter((card) => card.type === 'suggestion').length ===
                              1
                                ? ''
                                : 's'}
                            </Badge>
                          )}
                          {feedbackCards.some((card) => card.type === 'comment') && (
                            <Badge
                              variant="outline"
                              className="border-gray-200 bg-gray-50 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-950/20 dark:text-gray-400"
                            >
                              {feedbackCards.filter((card) => card.type === 'comment').length}{' '}
                              comment
                              {feedbackCards.filter((card) => card.type === 'comment').length === 1
                                ? ''
                                : 's'}
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        No feedback items
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Center - Title with chevron */}
                <div className="flex items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                  <h3 className="text-sm font-medium">
                    {isEditing ? 'Editing Feedback' : 'Feedback Draft'}
                  </h3>
                  <ChevronDown
                    className={`size-4 transition-transform ${feedbackOpen ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2">
                  {isEditing && onCancelEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCancelEdit()
                      }}
                      className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      Cancel Edit
                    </Button>
                  )}
                  {feedbackCards.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setClearConfirmOpen(true)
                      }}
                      className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="mr-1 size-3" />
                      Clear All
                    </Button>
                  )}
                  {feedbackCards.length > 0 ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewModalOpen(true)
                      }}
                    >
                      <Eye className="mr-1 size-3" />
                      {isEditing ? 'Update Feedback' : 'Preview and Send'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onCreateDraftFeedback) {
                          onCreateDraftFeedback()
                        }
                      }}
                    >
                      <Plus className="mr-1 size-3" />
                      Create Draft Feedback
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-4 pt-0">
              {feedbackCards.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={feedbackCards.map((card, index) => card.id ?? index)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {feedbackCards.map((card, index) => (
                        <SortableCard
                          key={card.id??index}
                          card={card}
                          index={index}
                          editingState={editingState}
                          onEdit={handleEditFeedback}
                          onSave={handleSaveFeedback}
                          onCancel={handleCancelEdit}
                          onToggleType={handleToggleType}
                          onUpdateSection={(section) =>
                            setEditingState((prev) => ({ ...prev, section }))
                          }
                          onUpdateContent={(content) =>
                            setEditingState((prev) => ({ ...prev, content }))
                          }
                          onDelete={onDeleteFeedback}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <p className="mb-2 text-sm text-muted-foreground">No feedback items yet</p>
                    <p className="text-xs text-muted-foreground">
                      Click &quot;Add Strength&quot; or &quot;Add Suggestion&quot; to create
                      feedback
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Feedback Preview Modal */}
      {studentRecord && assessment && (
        <FeedbackPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          feedbackCards={feedbackCards}
          studentRecord={studentRecord}
          assessment={assessment}
          onReorderCards={onReorderCards}
          onAddFeedback={onAddFeedback}
          onDeleteFeedback={onDeleteFeedback}
        />
      )}

      {/* Clear All Confirmation Modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="clear-all-title" aria-describedby="clear-all-desc">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <div className="mb-4">
              <h3 id="clear-all-title" className="text-lg font-semibold">Clear All Feedback</h3>
              <p id="clear-all-desc" className="mt-2 text-sm text-muted-foreground">
                Are you sure you want to clear all feedback items? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setClearConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearAll}>
                <Trash2 className="mr-1 size-3" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
