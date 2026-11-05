import React, { useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { Message } from './types'
import { FeedbackBubbles } from './feedback-bubbles'
import { FeedbackSideCard } from './feedback-side-card'
import { FeedbackSection } from '@/app/types'

interface MessageOptionsProps {
  message: Message
  addedFeedbackIds: Set<string>
  onAddAllFeedback: (feedbackSections: FeedbackSection[]) => void
  onFeedbackToggle: (feedbacSection: FeedbackSection) => void
  regenerateFeedback: (studentAnswerId: string) => Promise<void> | void
  suggestionsOpenByDefault: boolean
}

function getMessageFeedback(message: Message, type: 'strength' | 'suggestion') {
  return message.aiSuggestions?.at(-1)?.feedback?.filter((item) => item.type === type) || []
}

export function MessageOptions({
  message,
  addedFeedbackIds,
  onAddAllFeedback,
  onFeedbackToggle,
  regenerateFeedback,
  suggestionsOpenByDefault = false,
}: MessageOptionsProps) {
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)

  const [openImprovementFeedbackCards, setOpenImprovementFeedbackCards] =
    useState<boolean>(suggestionsOpenByDefault)
  const [openStrengthFeedbackCards, setOpenStrengthFeedbackCards] =
    useState<boolean>(suggestionsOpenByDefault)

  const strengthSections = useMemo(() => {
    const sections = getMessageFeedback(message, 'strength')
    return sections
  }, [message])

  const improvementSections = useMemo(() => {
    const sections = getMessageFeedback(message, 'suggestion')
    return sections
  }, [message])

  const onFeedbackCLicked = (type: 'strength' | 'improvement') => {
    if (type === 'strength') {
      setOpenStrengthFeedbackCards(!openStrengthFeedbackCards)
    } else {
      setOpenImprovementFeedbackCards(!openImprovementFeedbackCards)
    }
  }

  const handleRegenerate = async () => {
    setRegeneratingMessageId(message.studentAnswerId??null)
    await regenerateFeedback(message.studentAnswerId??'')
    setRegeneratingMessageId(null)
  }

  return (
    <div className="flex w-full flex-col gap-4 lg:w-1/2 lg:flex-row">
      {/* Feedback bubbles */}
      <FeedbackBubbles
        message={message}
        onBubbleCLicked={onFeedbackCLicked}
        onRegenerate={handleRegenerate}
        isRegenerating={regeneratingMessageId === message.studentAnswerId}
      />

      {/* Open feedback cards - below bubbles on mobile, side by side on desktop */}
      {(openStrengthFeedbackCards || openImprovementFeedbackCards) && (
        <div className="w-full space-y-2 lg:w-auto">
          {/* Show loading message when regenerating */}
          {regeneratingMessageId === message.id && (
            <div className="flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/30">
              <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <RefreshCw className="size-5 animate-spin" />
                <span className="text-sm font-medium">Generating new AI suggestions...</span>
              </div>
            </div>
          )}

          {/* Show strength feedback when not regenerating */}
          {regeneratingMessageId !== message.id &&
            openStrengthFeedbackCards &&
            strengthSections.length > 0 && (
              <FeedbackSideCard
                addedFeedbackIds={addedFeedbackIds}
                key="strength-feedback-combined"
                feedbackSections={strengthSections}
                onAddFeedback={onFeedbackToggle}
                onClose={() => setOpenStrengthFeedbackCards(false)}
                onAddAll={() => onAddAllFeedback(strengthSections)}
              />
            )}

          {/* Show suggestion feedback when not regenerating */}
          {regeneratingMessageId !== message.id &&
            openImprovementFeedbackCards &&
            improvementSections.length > 0 && (
              <FeedbackSideCard
                key="suggestion-feedback-combined"
                feedbackSections={improvementSections}
                addedFeedbackIds={addedFeedbackIds}
                onAddFeedback={onFeedbackToggle}
                onClose={() => setOpenImprovementFeedbackCards(false)}
                onAddAll={() => onAddAllFeedback(improvementSections)}
              />
            )}
        </div>
      )}
    </div>
  )
}
