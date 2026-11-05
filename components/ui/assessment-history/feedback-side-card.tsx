'use client'

import { CheckCircle, Target, X, Plus, Copy, Check, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/app/lib/components/ui/layout/card'
import { Badge } from '@/app/lib/components/ui/feedback/badge'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { useMemo, useState } from 'react'
import { FeedbackSection } from '@/app/types'

// Helper functions for type-based styling
const getTypeBadgeClasses = (type: string) => {
  switch (type) {
    case 'strength': {
      return 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    case 'suggestion': {
      return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    }
    case 'improvement': {
      return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    }
    default: {
      return 'border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'strength': {
      return (
        <>
          <CheckCircle className="mr-1 size-3" />
          Strength
        </>
      )
    }
    case 'suggestion': {
      return (
        <>
          <Target className="mr-1 size-3" />
          Suggestion
        </>
      )
    }
    case 'improvement': {
      return (
        <>
          <Target className="mr-1 size-3" />
          Improvement
        </>
      )
    }
    default: {
      return (
        <>
          <MessageSquare className="mr-1 size-3" />
          Comment
        </>
      )
    }
  }
}

const getTypeCardClasses = (type: string, isSelected: boolean) => {
  if (!isSelected) {
    return 'border-border bg-muted/30 hover:scale-105 hover:bg-muted/50 hover:shadow-lg'
  }

  switch (type) {
    case 'strength': {
      return 'border-green-200 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/20 dark:hover:bg-green-950/40'
    }
    case 'suggestion': {
      return 'border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-950/40'
    }
    default: {
      return 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-950/20 dark:hover:bg-gray-950/40'
    }
  }
}

interface FeedbackSideCardProps {
  feedbackSections: FeedbackSection[]
  addedFeedbackIds: Set<string>,
  onAddFeedback: (section: FeedbackSection)=>void,
  onClose: ()=>void,
  onAddAll: (feedbackSections: FeedbackSection[]) => void
}

const handleCopyFeedback = async (
  text: string,
  setCopiedId: (id: string | null) => void,
  feedbackId: string,
) => {
  try {
    await navigator.clipboard.writeText(text)
    setCopiedId(feedbackId)
    // Reset after 2 seconds
    setTimeout(() => setCopiedId(null), 2000)
  } catch {
    // Silent fail for copy operations
  }
}

export function FeedbackSideCard({
  feedbackSections,
  addedFeedbackIds,
  onAddFeedback,
  onClose,
  onAddAll,
}: FeedbackSideCardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const _hasUnaddedItems = useMemo(() => {
    return feedbackSections.some((section) => !addedFeedbackIds.has(section.id??''))
  }, [feedbackSections, addedFeedbackIds])

  // Function to handle adding all feedback items at once
  const _handleAddAll = (feedbackSections: FeedbackSection[]) => {
    onAddAll(feedbackSections);
  }


  return (
    <div className="w-full lg:flex-1">
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`text-xs font-medium ${getTypeBadgeClasses(feedbackSections[0].type)}`}
              >
                {getTypeIcon(feedbackSections[0].type)}
              </Badge>
              {/* {hasUnaddedItems && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleAddAll(feedbackSections)}
                  title={`Add all ${feedbackSections[0].type}s at once`}
                >
                  Add All
                </Button>
              )} */}
            </div>
            <Button variant="ghost" size="icon" className="size-6" onClick={onClose} aria-label="Close feedback panel">
              <X className="size-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {feedbackSections.map((section, index) => {
              const feedbackId = `${section.id}`
              const isAdded = section.used;
              const isCopied = copiedId === feedbackId

              const handleAddRow = () => onAddFeedback(section)

              return (
                <div
                  key={index}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    isAdded
                      ? 'Feedback already added to draft'
                      : 'Add this feedback to draft'
                  }
                  className={`group relative flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-3 transition-all duration-300 ${getTypeCardClasses(
                    section.type,
                    isAdded??false,
                  )}`}
                  onClick={handleAddRow}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleAddRow()
                    }
                  }}
                >
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{section.content}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`size-6 transition-all duration-200 ${
                        isCopied
                          ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyFeedback(section.content, setCopiedId, feedbackId)
                      }}
                      title={isCopied ? 'Copied!' : 'Copy feedback'}
                      aria-label={isCopied ? 'Copied' : 'Copy feedback'}
                    >
                      {isCopied ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3 text-muted-foreground" />
                      )}
                    </Button>
                    {isAdded ? (
                      <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Plus className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
