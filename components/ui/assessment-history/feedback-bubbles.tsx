'use client'

import { useMemo } from 'react'
import { CheckCircle, Target, RefreshCw } from 'lucide-react'
import { Button } from '@/app/lib/components/ui/buttons/button'
import type { Message } from './types'

interface FeedbackBubblesProps {
  message: Message
  onBubbleCLicked: (type: 'strength' | 'improvement')=> void
  onRegenerate: () => Promise<void> | void
  isRegenerating?: boolean
}

export function FeedbackBubbles({
  message,
  onRegenerate,
  onBubbleCLicked,
  isRegenerating
}: FeedbackBubblesProps) {

  const feedback = message.aiSuggestions?.at(-1)?.feedback


  // Use external regenerating state if provided, otherwise use internal

  // Check if we have specific types of feedback
  const hasStrengthFeedback = useMemo(()=>{
    return feedback?.some((item) => item.type === 'strength')
  },[feedback])
  
  const hasSuggestionFeedback = useMemo(()=>{
    return feedback?.some((item) => item.type === 'suggestion')
  },[feedback])

  // Check if any feedback items are being used (for visual indication)
  const hasUsedStrengthFeedback = useMemo(()=>{
    return feedback?.some((item) => item.type === 'strength' && item.used)
  },[feedback])
  const hasUsedSuggestionFeedback = useMemo(()=>{
    return feedback?.some(
      (item) => item.type === 'improvement' && item.used,
    )
  },[feedback])

  const strengthAriaLabel = hasStrengthFeedback
    ? (hasUsedStrengthFeedback ? 'View strength feedback, selected' : 'View strength feedback')
    : 'No strength feedback available'

  const suggestionAriaLabel = hasSuggestionFeedback
    ? (hasUsedSuggestionFeedback ? 'View suggestion feedback, selected' : 'View suggestion feedback')
    : 'No suggestion feedback available'

  const handleRegenerate = async () => {
    onRegenerate()

  }

  return (
    <div className="flex flex-row justify-center gap-2 lg:w-16 lg:flex-col lg:justify-start">
      {/* Strength bubble */}
      <Button
        variant="ghost"
        size="icon"
        className={`size-10 rounded-full border ${
          (hasStrengthFeedback
            ? (hasUsedStrengthFeedback
              ? 'border-green-300 bg-green-200 ring-2 ring-green-400 hover:bg-green-300 dark:border-green-700 dark:bg-green-800/50 dark:ring-green-500 dark:hover:bg-green-800/70'
              : 'border-green-200 bg-green-100 hover:bg-green-200 dark:border-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50')
            : 'border-gray-200 bg-gray-100 opacity-50 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-900/30 dark:hover:bg-gray-900/50')
        }`}
        onClick={() => onBubbleCLicked('strength')}
        title={
          (hasStrengthFeedback
            ? (hasUsedStrengthFeedback
              ? 'View Strength (Selected)'
              : 'View Strength')
            : 'No strength feedback available')
        }
        aria-label={strengthAriaLabel}
        disabled={!hasStrengthFeedback || isRegenerating}
      >
        <CheckCircle
          className={`size-5 ${
            (hasStrengthFeedback
              ? (hasUsedStrengthFeedback
                ? 'text-green-700 dark:text-green-300'
                : 'text-green-600 dark:text-green-400')
              : 'text-muted-foreground')
          }`}
        />
      </Button>

      {/* Suggestion bubble */}
      <Button
        variant="ghost"
        size="icon"
        className={`size-10 rounded-full border ${
          (hasSuggestionFeedback
            ? (hasUsedSuggestionFeedback
              ? 'border-amber-300 bg-amber-200 ring-2 ring-amber-400 hover:bg-amber-300 dark:border-amber-700 dark:bg-amber-800/50 dark:ring-amber-500 dark:hover:bg-amber-800/70'
              : 'border-amber-200 bg-amber-100 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50')
            : 'border-gray-200 bg-gray-100 opacity-50 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-900/30 dark:hover:bg-gray-900/50')
        }`}
        onClick={() => onBubbleCLicked('improvement')}
        title={
          (hasSuggestionFeedback
            ? (hasUsedSuggestionFeedback
              ? 'View Suggestion (Selected)'
              : 'View Suggestion')
            : 'No suggestion feedback available')
        }
        aria-label={suggestionAriaLabel}
        disabled={!hasSuggestionFeedback || isRegenerating}
      >
        <Target
          className={`size-5 ${
            (hasSuggestionFeedback
              ? (hasUsedSuggestionFeedback
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-amber-600 dark:text-amber-400')
              : 'text-muted-foreground')
          }`}
        />
      </Button>

      {/* Regenerate button */}
      {(
        <Button
          variant="ghost"
          size="icon"
          className={`size-10 rounded-full border transition-all duration-300 ${
            isRegenerating
              ? 'border-blue-200 bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30'
              : 'border-gray-200 bg-gray-100 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-900/30 dark:hover:bg-gray-900/50'
          }`}
          onClick={handleRegenerate}
          title={isRegenerating ? 'Regenerating...' : 'Regenerate AI suggestions'}
          aria-label={isRegenerating ? 'Regenerating AI suggestions' : 'Regenerate AI suggestions'}
          disabled={isRegenerating}
        >
          <RefreshCw
            className={`size-5 transition-all duration-300 ${
              isRegenerating
                ? 'animate-spin text-blue-600 dark:text-blue-400'
                : 'text-muted-foreground'
            }`}
          />
        </Button>
      )}
    </div>
  )
}
