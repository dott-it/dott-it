'use client'

import { CheckCircle, Target, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/app/lib/components/ui/layout/card'
import { Badge } from '@/app/lib/components/ui/feedback/badge'
import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { useState } from 'react'
import { FeedbackSection } from '@/app/types'


interface FeedbackCardsMessageProps {
  feedbackCards: FeedbackSection[]
}

// Helper functions to avoid nested ternary expressions
const getCardClassName = (type: string) => {
  if (type === 'strength') {
    return 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
  }
  if (type === 'suggestion') {
    return 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
  }
  return 'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20'
}

const getBadgeClassName = (type: string) => {
  if (type === 'strength') {
    return 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
  }
  if (type === 'suggestion') {
    return 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  }
  return 'border-gray-200 bg-gray-100 text-gray-800 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

const getBadgeContent = (type: string) => {
  if (type === 'strength') {
    return (
      <>
        <CheckCircle className="mr-1 size-3" />
        Strength
      </>
    )
  }
  if (type === 'suggestion') {
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
}

export function FeedbackCardsMessage({ feedbackCards }: FeedbackCardsMessageProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950/20">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          T
        </div>
        <span className="text-sm font-medium text-muted-foreground">Archived feedback</span>
        <div className="flex items-center gap-1">
          {feedbackCards.some((card) => card.type === 'strength') && (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
            >
              {feedbackCards.filter((card) => card.type === 'strength').length} strength
              {feedbackCards.filter((card) => card.type === 'strength').length === 1 ? '' : 's'}
            </Badge>
          )}
          {feedbackCards.some((card) => card.type === 'suggestion') && (
            <Badge
              variant="outline"
              className="border-amber-200 bg-amber-50 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
            >
              {feedbackCards.filter((card) => card.type === 'suggestion').length} suggestion
              {feedbackCards.filter((card) => card.type === 'suggestion').length === 1 ? '' : 's'}
            </Badge>
          )}
          {feedbackCards.some((card) => card.type === 'comment') && (
            <Badge
              variant="outline"
              className="border-gray-200 bg-gray-50 text-xs text-gray-700 dark:border-gray-800 dark:bg-gray-950/20 dark:text-gray-400"
            >
              {feedbackCards.filter((card) => card.type === 'comment').length} comment
              {feedbackCards.filter((card) => card.type === 'comment').length === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
      </div>

      {/* Content with partial preview */}
      <div className="relative">
        <div
          className={`transition-all duration-300 ${
            isExpanded ? 'max-h-none' : 'max-h-32 overflow-hidden'
          }`}
        >
          {/* Fade overlay when collapsed */}
          {!isExpanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-gray-50/80 to-transparent dark:from-gray-950/80" />
          )}

          <div className="space-y-3">
            {feedbackCards.map((card, index) => (
              <Card
                key={card.id}
                className={getCardClassName(card.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`text-xs font-medium ${getBadgeClassName(card.type)}`}
                      >
                        {getBadgeContent(card.type)}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Section */}
                    {card.section && (
                      <div className="text-xs text-muted-foreground">Section: {card.section}</div>
                    )}
                    {/* Content */}
                    <div className="text-sm leading-relaxed">{card.content}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Chevron button in center bottom */}
        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="mb-1 size-8 border border-gray-200/50 bg-gray-50/90 hover:bg-gray-100/90 dark:border-gray-800/50 dark:bg-gray-950/90 dark:hover:bg-gray-900/90"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            <span className="sr-only">{isExpanded ? 'Collapse feedback' : 'Expand feedback'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
