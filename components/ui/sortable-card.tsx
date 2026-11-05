import { FeedbackSection } from "@/app/types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { CheckCircle, Edit2, GripVertical, MessageSquare, Target, X } from "lucide-react"
import { Input } from "./input"
import React from "react"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"


interface SortableCardProps {
  card: FeedbackSection
  index: number
  editingState: {
    cardId: string | null
    type: 'strength' | 'suggestion' | 'improvement' | 'comment'
    section: string
    content: string
  }
  onEdit: (card: FeedbackSection) => void
  onSave: () => void
  onCancel: () => void
  onToggleType: () => void
  onUpdateSection: (section: string) => void
  onUpdateContent: (content: string) => void
  onDelete: (id: string) => void
}

export function SortableCard({
  card,
  index,
  editingState,
  onEdit,
  onSave,
  onCancel,
  onToggleType,
  onUpdateSection,
  onUpdateContent,
  onDelete,
}: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id?? '',
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative transition-all duration-200',
        // Type-specific styling
        editingState.cardId === card.id
          ? 'border-border bg-background'
          : (() => {
              if (card.type === 'strength') {
                return 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
              }
              if (card.type === 'suggestion') {
                return 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
              }
              return 'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20'
            })(),
        // State-based styling
        editingState.cardId === card.id
          ? 'ring-2 ring-primary/20 shadow-lg scale-[1.02] z-10 border-primary/50'
          : 'hover:shadow-md hover:border-border/80 dark:hover:border-border/60',
        isDragging && 'opacity-50 scale-95',
      )}
    >
      <CardContent className={editingState.cardId === card.id ? 'p-4' : 'p-3'}>
        {editingState.cardId === card.id ? (
          // Edit Mode
          <div className="space-y-4">
            {/* Header with type, section, and actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onToggleType}
                  aria-label="Toggle feedback type between strength, suggestion, and comment"
                  className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 ${(() => {
                    if (editingState.type === 'strength') {
                      return 'border border-green-200 bg-green-100 text-green-700 hover:bg-green-200 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                    }
                    if (editingState.type === 'suggestion') {
                      return 'border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                    }
                    return 'border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300 dark:hover:bg-gray-900/50'
                  })()}`}
                >
                  {(() => {
                    if (editingState.type === 'strength') {
                      return (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-4" />
                          <span className="text-sm font-medium">Strength</span>
                        </div>
                      )
                    }
                    if (editingState.type === 'suggestion') {
                      return (
                        <div className="flex items-center gap-2">
                          <Target className="size-4" />
                          <span className="text-sm font-medium">Suggestion</span>
                        </div>
                      )
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="size-4" />
                        <span className="text-sm font-medium">Comment</span>
                      </div>
                    )
                  })()}
                </button>
                <div className="hidden h-4 w-px bg-border sm:block" />
                <Input
                  value={editingState.section}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onUpdateSection(e.target.value)
                  }
                  placeholder="Section"
                  className="h-8 text-sm"
                  aria-label="Section title"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={onSave} className="h-7 px-2 text-xs">
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={onCancel} className="h-7 px-2 text-xs">
                  Cancel
                </Button>
              </div>
            </div>
            {/* Content textarea */}
            <textarea
              value={editingState.content}
              onChange={(e) => onUpdateContent(e.target.value)}
              aria-label="feedback-content-input"
              placeholder="Enter feedback content..."
              className="min-h-[80px] w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        ) : (
          // View Mode
          <div className="space-y-3">
            {/* Header with type badge, position, and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium ${(() => {
                    if (card.type === 'strength') {
                      return 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }
                    if (card.type === 'suggestion') {
                      return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    }
                    return 'border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  })()}`}
                >
                  {(() => {
                    if (card.type === 'strength') {
                      return (
                        <>
                          <CheckCircle className="mr-1 size-3" />
                          Strength
                        </>
                      )
                    }
                    if (card.type === 'suggestion') {
                      return (
                        <>
                          <Target className="mr-1 size-3" />
                          Suggestion
                        </>
                      )
                    }
                    return (
                      <>
                        <MessageSquare className="mr-1 size-3" />
                        Comment
                      </>
                    )
                  })()}
                </Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  #{index + 1}
                </Badge>
              </div>
              <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  type="button"
                  {...attributes}
                  {...listeners}
                  aria-label="Reorder card"
                  className="cursor-grab rounded p-1 hover:bg-muted/50 active:cursor-grabbing"
                >
                  <GripVertical className="size-3 text-muted-foreground" />
                </button>
                <Button variant="ghost" size="icon" className="size-6" onClick={() => onEdit(card)} aria-label="Edit card">
                  <Edit2 className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => onDelete(card.id?? '')}
                  aria-label="Remove card"
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>
            {/* Section */}
            {card.section && (
              <div className="text-xs text-muted-foreground">Section: {card.section}</div>
            )}
            {/* Content */}
            <div className="text-sm leading-relaxed">{card.content}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
