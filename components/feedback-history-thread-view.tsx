'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'
import {
  Send,
  User,
  GraduationCap,
  FileText,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Plus,
  CheckCircle,
  X,
  Paperclip,
  Edit3,
  RefreshCw,
  PencilIcon,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Sparkles,
  Eye,
  Target,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAnonymousView } from '@/components/anonymous-view-provider'

function keyboardActivateLine(
  e: React.KeyboardEvent<Element>,
  handler: () => void,
) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handler()
  }
}
import { SmartDate } from '@/app/lib/components/ui/feedback'
// import { formatScoreForDisplay } from '@/app/lib/utils/score-format'

interface Record {
  id: string
  assessmentId: string
  studentName: string
  studentId: string
  status: string
  submittedDate: string
  score?: number
  maxScore?: number
  reviewedDate?: string
  flagged: boolean
  feedback: Array<{
    type: string
    section: string
    content: string
  }>
  content?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    type?: 'submission' | 'feedback' | 'question' | 'score-suggestion'
    section?: string
    score?: number
    feedbackType?: 'strength' | 'improvement'
    suggestedScore?: number
  }
}

interface FeedbackHistoryThreadViewProps {
  record: Record
  showNavigationButtons?: boolean
}

// Simulate AI message regeneration
const regenerateAIMessage = async (_originalContent: string): Promise<string> => {
  // This is a mock implementation - replace with actual AI service call
  const responses = [
    'Based on your student submission, I can see they have a solid foundation in understanding natural selection. Here are some key observations...',
    'Looking at this response, the student demonstrates good conceptual understanding. Let me provide some specific feedback on their explanation...',
    "This submission shows promise in several areas. I'd like to highlight both strengths and areas for improvement...",
    "After analyzing the student's work, I notice several key points worth discussing in detail...",
  ]

  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  return randomResponse
}

// Handler for setting score manually
const handleSetScore = () => {
  // TODO: Here you would open a modal or input to set score manually
  // console.log('Set score manually')
}

export function FeedbackHistoryThreadView({
  record,
  showNavigationButtons: _showNavigationButtons = true,
}: FeedbackHistoryThreadViewProps) {
  const { showStudentInfo } = useAnonymousView()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')

  const [submissionOpen, setSubmissionOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [feedbackCards, setFeedbackCards] = useState<
    Array<{
      id: string
      section: string
      content: string
      type: 'strength' | 'suggestion' | 'comment'
      isCustomized: boolean // Track if the feedback has been manually edited
    }>
  >([])
  const [addedFeedbackIds, setAddedFeedbackIds] = useState<Set<string>>(new Set())
  const [editingState, setEditingState] = useState<{
    cardId: string | null
    content: string
    section: string
    type: 'strength' | 'suggestion' | 'comment'
    showPreview: boolean
  }>({
    cardId: null,
    content: '',
    section: '',
    type: 'strength',
    showPreview: false,
  })
  const [showCelebration, setShowCelebration] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean
    cardId: string | null
    feedbackId: string | null
  }>({
    show: false,
    cardId: null,
    feedbackId: null,
  })

  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [messageRatings, setMessageRatings] = useState<{ [key: string]: 'up' | 'down' | null }>({})
  const [selectedFeedbackCard, setSelectedFeedbackCard] = useState<{
    id: string
    section: string
    content: string
    type: 'strength' | 'suggestion' | 'comment'
  } | null>(null)
  const [acceptedScore, setAcceptedScore] = useState<boolean>(false)

  // Handler for accepting suggested score
  const handleAcceptScore = () => {
    setAcceptedScore(true)
    // Trigger celebration animation
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
    // TODO: Here you would make an API call to update the student's score
    // console.log('Score accepted:', record.score)
  }

  // Handler functions for editing feedback cards
  const handleEditCard = (card: {
    id: string
    section: string
    content: string
    type: 'strength' | 'suggestion' | 'comment'
    isCustomized: boolean
  }) => {
    setEditingState({
      cardId: card.id,
      content: card.content,
      section: card.section,
      type: card.type,
      showPreview: false,
    })
  }

  const handleToggleType = () => {
    setEditingState((prev) => ({
      ...prev,
      type:
        prev.type === 'strength'
          ? 'suggestion'
          : (prev.type === 'suggestion'
          ? 'comment'
          : 'strength'),
    }))
  }

  // Handle keyboard shortcuts in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.metaKey || e.ctrlKey) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSaveEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancelEdit()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleSaveEdit = () => {
    if (!editingState.cardId || !editingState.content.trim() || !editingState.section.trim()) return

    setFeedbackCards((prev) =>
      prev.map((card) =>
        card.id === editingState.cardId
          ? {
              ...card,
              content: editingState.content.trim(),
              section: editingState.section.trim(),
              type: editingState.type,
              isCustomized: true,
            } // Mark as customized when edited
          : card,
      ),
    )
    setEditingState({
      cardId: null,
      content: '',
      section: '',
      type: 'strength',
      showPreview: false,
    })

    // Trigger celebration animation for successful save
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
  }

  const handleCancelEdit = () => {
    // If canceling a new card that was just created, remove it
    if (editingState.cardId && editingState.cardId.startsWith('new-')) {
      const editingCard = feedbackCards.find((card) => card.id === editingState.cardId)
      if (editingCard && !editingCard.content && !editingCard.section) {
        setFeedbackCards((prev) => prev.filter((card) => card.id !== editingState.cardId))
      }
    }

    setEditingState({
      cardId: null,
      content: '',
      section: '',
      type: 'strength',
      showPreview: false,
    })
  }

  const handleRemoveFeedback = (cardId: string, feedbackId: string) => {
    const card = feedbackCards.find((c) => c.id === cardId)

    // If it's customized feedback, show confirmation
    if (card?.isCustomized) {
      setShowDeleteConfirm({
        show: true,
        cardId,
        feedbackId,
      })
    } else {
      // Non-customized feedback can be removed immediately
      setFeedbackCards((prev) => prev.filter((c) => c.id !== cardId))
      setAddedFeedbackIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(feedbackId)
        return newSet
      })
    }
  }

  const confirmRemoveFeedback = () => {
    if (showDeleteConfirm.cardId && showDeleteConfirm.feedbackId) {
      setFeedbackCards((prev) => prev.filter((c) => c.id !== showDeleteConfirm.cardId))
      setAddedFeedbackIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(showDeleteConfirm.feedbackId!)
        return newSet
      })
    }
    setShowDeleteConfirm({ show: false, cardId: null, feedbackId: null })
  }

  const cancelRemoveFeedback = () => {
    setShowDeleteConfirm({ show: false, cardId: null, feedbackId: null })
  }

  // Handler for adding new feedback card
  const handleAddFeedback = (type: 'strength' | 'suggestion' | 'comment') => {
    const newCard = {
      id: `new-${Date.now()}`,
      section: '',
      content: '',
      type,
      isCustomized: true, // New cards are always custom
    }

    setFeedbackCards((prev) => [...prev, newCard])
    setEditingState({
      cardId: newCard.id,
      content: '',
      section: '',
      type,
      showPreview: false,
    })

    // Trigger celebration animation
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
  }

  // Handler for regenerating AI messages
  const handleRegenerateMessage = async (messageId: string) => {
    setRegeneratingMessageId(messageId)

    try {
      // Simulate AI regeneration call - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate new message content
      const originalMessage = messages.find((m) => m.id === messageId)
      const newContent = await regenerateAIMessage(originalMessage?.content || '')

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: newContent } : m)),
      )
    } catch {
      // Silently handle error
    } finally {
      setRegeneratingMessageId(null)
    }
  }

  // Handler for thumbs up/down rating on AI messages
  const handleRateMessage = (messageId: string, rating: 'up' | 'down') => {
    setMessageRatings((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === rating ? null : rating,
    }))
  }

  // Update document title based on anonymous view
  useEffect(() => {
    const studentName = showStudentInfo ? record?.studentName || 'Student' : 'Anonymous Student'
    if (globalThis.document !== undefined) {
      globalThis.document.title = `Assessment Feedback for ${studentName}`
    }
  }, [showStudentInfo, record?.studentName])

  // Set initial document title
  useEffect(() => {
    if (record) {
      const studentName = showStudentInfo ? record.studentName || 'Student' : 'Anonymous Student'
      if (globalThis.document !== undefined) {
        globalThis.document.title = `Assessment Feedback for ${studentName}`
      }
    }
  }, [record, showStudentInfo])

  // Initialize messages from record data
  useEffect(() => {
    try {
      if (!record) return

      const initialMessages: Message[] = []

      // Add student submission as first message
      if (record.content && typeof record.content === 'string') {
        const submissionDate = record.submittedDate ? new Date(record.submittedDate) : new Date()

        // Try to parse JSON content
        let formattedContent = record.content
        try {
          const parsed = JSON.parse(record.content)
          if (parsed.rawAnswer) {
            formattedContent = `## Explanation\n\n${
              parsed.rawAnswer.explanationQuestion || ''
            }\n\n## Observations\n\n${parsed.rawAnswer.observationQuestion || ''}`
          }
        } catch {
          // If not valid JSON, use as plain text
          formattedContent = record.content
        }

        initialMessages.push({
          id: 'submission',
          role: 'user',
          content: formattedContent,
          timestamp: submissionDate,
          metadata: {
            type: 'submission',
            section: 'Student Response',
          },
        })
      }

      // Note: feedbackCards will be populated only when professor selects feedback items
      // from the side cards when clicking on strength/suggestion bubbles

      setMessages(initialMessages)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize messages')
    }
  }, [record])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')

    // Trigger celebration animation when message is sent
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 3000)

    // Dispatch custom event to trigger Eddo icon somersault
    const event = new CustomEvent('eddo-celebration', { detail: { type: 'message-sent' } })
    globalThis.dispatchEvent(event)

    // Message sent successfully - no automatic AI response needed
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!record) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">No record data available</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="mb-2 text-muted-foreground">Error loading record</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="flex h-full max-h-screen flex-col">
        {/* Celebration Animation */}
        {showCelebration && (
          <div className="pointer-events-none fixed inset-0 z-50">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Confetti Animation */}
              <div className="flex space-x-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const colors = ['bg-green-400', 'bg-blue-400', 'bg-yellow-400', 'bg-pink-400']
                  const colorClass = colors[i % 4]
                  return (
                    <div
                      key={i}
                      className={`size-3 animate-bounce rounded-full ${colorClass}`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '1s',
                      }}
                    />
                  )
                })}
              </div>

              {/* Somersaulting Eddo Icon */}
              <div className="absolute left-4 top-4">
                <div className="animate-somersault">
                  <Image
                    src="/eddo-logo.png"
                    alt="Eddo"
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <Card className="rounded-none border-0 bg-muted/50">
          <CardHeader className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              <h2 className="text-base font-semibold lg:text-lg">Assessment Feedback</h2>
            </div>
          </CardHeader>
        </Card>

        {/* Messages Thread */}
        <ScrollArea ref={scrollAreaRef} className="h-[400px]">
          <div className="space-y-6 px-4">
            {/* Date Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 border-t border-border" />
              <div className="text-xs font-medium text-muted-foreground">
                {record?.submittedDate || 'Unknown date'}
              </div>
              <div className="flex-1 border-t border-border" />
            </div>
            {messages &&
              messages.length > 0 &&
              messages.map((message, _index) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.metadata?.type === 'submission' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {message.metadata?.type === 'submission' && (
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`flex flex-1 flex-col gap-2 ${
                      message.metadata?.type === 'submission'
                        ? 'items-start'
                        : 'max-w-[75%] items-end'
                    }`}
                  >
                    {message.metadata?.type === 'submission' ? (
                      <div className="flex w-full flex-col gap-4 lg:flex-row">
                        {/* Student message */}
                        <div className="w-full lg:w-3/5">
                          <Card
                            className={cn(
                              'w-full',
                              'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
                              'hover:shadow-md hover:border-border/80 dark:hover:border-border/60',
                            )}
                          >
                            <div className="w-full">
                              {/* Header */}
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                  <FileText className="size-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm font-medium">
                                    {showStudentInfo
                                      ? record?.studentName || 'Student'
                                      : 'Anonymous Student'}{' '}
                                    submitted their response
                                  </span>
                                </div>
                              </CardContent>

                              {/* Content with partial preview */}
                              <div className="relative">
                                <CardContent
                                  className={`p-4 pt-0 transition-all duration-300 ${
                                    submissionOpen ? 'max-h-none' : 'max-h-32 overflow-hidden'
                                  }`}
                                >
                                  {/* Fade overlay when collapsed */}
                                  {!submissionOpen && (
                                    <>
                                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-blue-50/80 to-transparent dark:from-blue-950/80" />
                                      {/* Chevron button in center bottom */}
                                      <div className="absolute inset-x-0 bottom-0 flex justify-center">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="mb-1 size-8 border border-blue-200/50 bg-blue-50/90 hover:bg-blue-100/90 dark:border-blue-800/50 dark:bg-blue-950/90 dark:hover:bg-blue-900/90"
                                          onClick={() => setSubmissionOpen(true)}
                                        >
                                          <ChevronDown className="size-4" />
                                          <span className="sr-only">Expand submission</span>
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                  <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      components={{
                                        // Enhanced markdown components for better readability
                                        h1: ({ children }) => (
                                          <h1 className="mb-3 text-lg font-bold text-foreground">
                                            {children}
                                          </h1>
                                        ),
                                        h2: ({ children }) => (
                                          <h2 className="mb-2 text-base font-bold text-foreground">
                                            {children}
                                          </h2>
                                        ),
                                        h3: ({ children }) => (
                                          <h3 className="mb-2 text-sm font-semibold text-foreground">
                                            {children}
                                          </h3>
                                        ),
                                        p: ({ children }) => (
                                          <p className="mb-3 text-sm leading-relaxed text-foreground">
                                            {children}
                                          </p>
                                        ),
                                        strong: ({ children }) => (
                                          <strong className="font-semibold text-foreground">
                                            {children}
                                          </strong>
                                        ),
                                        em: ({ children }) => (
                                          <em className="italic">{children}</em>
                                        ),
                                        code: ({ children }) => (
                                          <code className="rounded border bg-muted px-2 py-1 font-mono text-xs">
                                            {children}
                                          </code>
                                        ),
                                        pre: ({ children }) => (
                                          <pre className="overflow-x-auto rounded-md border bg-muted p-3 text-xs">
                                            {children}
                                          </pre>
                                        ),
                                        ul: ({ children }) => (
                                          <ul className="ml-4 list-disc space-y-1 text-sm">
                                            {children}
                                          </ul>
                                        ),
                                        ol: ({ children }) => (
                                          <ol className="ml-4 list-decimal space-y-1 text-sm">
                                            {children}
                                          </ol>
                                        ),
                                        li: ({ children }) => (
                                          <li className="text-sm">{children}</li>
                                        ),
                                        blockquote: ({ children }) => (
                                          <blockquote className="rounded-r border-l-4 border-primary/30 bg-muted/30 p-3 pl-4 italic text-muted-foreground">
                                            {children}
                                          </blockquote>
                                        ),
                                        table: ({ children }) => (
                                          <div className="overflow-x-auto">
                                            <table className="min-w-full border border-border text-sm">
                                              {children}
                                            </table>
                                          </div>
                                        ),
                                        th: ({ children }) => (
                                          <th className="border border-border bg-muted px-3 py-2 text-left font-semibold">
                                            {children}
                                          </th>
                                        ),
                                        td: ({ children }) => (
                                          <td className="border border-border px-3 py-2">
                                            {children}
                                          </td>
                                        ),
                                      }}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  </div>

                                  {/* Collapse button when expanded */}
                                  {submissionOpen && (
                                    <div className="mt-4 flex justify-center">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSubmissionOpen(false)}
                                        className="text-xs"
                                      >
                                        <ChevronUp className="mr-1 size-3" />
                                        Collapse
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </div>
                            </div>
                          </Card>
                        </div>

                        {/* Feedback bubbles */}
                        <div className="flex flex-row justify-center gap-2 lg:flex-col lg:justify-start">
                          {/* Strength bubble */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`size-10 rounded-full border ${
                              record.feedback?.some((f) => f.type === 'strength')
                                ? 'border-green-200 bg-green-100 hover:bg-green-200 dark:border-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50'
                                : 'border-gray-200 bg-gray-100 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-900/30 dark:hover:bg-gray-900/50 opacity-50'
                            }`}
                            onClick={() => {
                              const strengthFeedback = record.feedback?.find(
                                (feedback) => feedback.type === 'strength',
                              )
                              if (strengthFeedback) {
                                const strengthCard = {
                                  id: 'strength-feedback',
                                  section: strengthFeedback.section,
                                  content: strengthFeedback.content,
                                  type: 'strength' as const,
                                }
                                // Toggle: if same card is selected, close it; otherwise, open it
                                if (selectedFeedbackCard?.id === strengthCard.id) {
                                  setSelectedFeedbackCard(null)
                                } else {
                                  setSelectedFeedbackCard(strengthCard)
                                }
                              }
                            }}
                            title={
                              record.feedback?.some((f) => f.type === 'strength')
                                ? 'View Strength'
                                : 'No strength feedback available'
                            }
                            aria-label={
                              record.feedback?.some((f) => f.type === 'strength')
                                ? 'View Strength'
                                : 'No strength feedback available'
                            }
                            disabled={!record.feedback?.some((f) => f.type === 'strength')}
                          >
                            <CheckCircle
                              className={`size-5 ${
                                record.feedback?.some((f) => f.type === 'strength')
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}
                            />
                          </Button>

                          {/* Suggestion bubble */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`size-10 rounded-full border ${
                              record.feedback?.some((f) => f.type === 'improvement')
                                ? 'border-amber-200 bg-amber-100 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50'
                                : 'border-gray-200 bg-gray-100 hover:bg-gray-200 dark:border-gray-800 dark:bg-gray-900/30 dark:hover:bg-gray-900/50 opacity-50'
                            }`}
                            onClick={() => {
                              // Find feedback with type 'improvement' (which is the suggestion type)
                              const suggestionFeedback = record.feedback?.find(
                                (feedback) => feedback.type === 'improvement',
                              )

                              if (suggestionFeedback) {
                                const suggestionCard = {
                                  id: 'suggestion-feedback',
                                  section: suggestionFeedback.section,
                                  content: suggestionFeedback.content,
                                  type: 'suggestion' as const,
                                }
                                // console.log('Setting suggestion card:', suggestionCard)

                                // Toggle: if same card is selected, close it; otherwise, open it
                                if (selectedFeedbackCard?.id === suggestionCard.id) {
                                  setSelectedFeedbackCard(null)
                                } else {
                                  setSelectedFeedbackCard(suggestionCard)
                                }
                              }
                            }}
                            title={
                              record.feedback?.some((f) => f.type === 'improvement')
                                ? 'View Suggestion'
                                : 'No suggestion feedback available'
                            }
                            aria-label={
                              record.feedback?.some((f) => f.type === 'improvement')
                                ? 'View Suggestion'
                                : 'No suggestion feedback available'
                            }
                            disabled={!record.feedback?.some((f) => f.type === 'improvement')}
                          >
                            <Target
                              className={`size-5 ${
                                record.feedback?.some((f) => f.type === 'improvement')
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-gray-400 dark:text-gray-500'
                              }`}
                            />
                          </Button>
                        </div>

                        {/* Selected feedback card */}
                        {selectedFeedbackCard ? (
                          <div className="w-full lg:w-2/5">
                            <Card className="h-fit">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs font-medium ${
                                      selectedFeedbackCard.type === 'strength'
                                        ? 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                    }`}
                                  >
                                    {selectedFeedbackCard.type === 'strength' ? (
                                      <>
                                        <CheckCircle className="mr-1 size-3" />
                                        Strength
                                      </>
                                    ) : (
                                      <>
                                        <Target className="mr-1 size-3" />
                                        Suggestion
                                      </>
                                    )}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    aria-label="Close selected feedback"
                                    onClick={() => {
                                      setSelectedFeedbackCard(null)
                                      // Optionally collapse student message when no card is selected
                                      // setSubmissionOpen(false)
                                    }}
                                  >
                                    <X className="size-3" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-3">
                                  {selectedFeedbackCard.content.split('\n').map((line, index) => {
                                    const cleanLine = line.replace(/^\*\*.*?\*\*:\s*/, '').trim()
                                    if (!cleanLine) return null

                                    const lineFeedbackId = `${
                                      selectedFeedbackCard.section || 'Feedback'
                                    }-${cleanLine}-${
                                      selectedFeedbackCard.type === 'strength'
                                        ? 'strength'
                                        : 'suggestion'
                                    }`

                                    const handleToggleFeedbackLine = () => {
                                      const feedbackText = cleanLine
                                      const section = selectedFeedbackCard.section || 'Feedback'
                                      const type: 'strength' | 'suggestion' =
                                        selectedFeedbackCard.type === 'strength'
                                          ? 'strength'
                                          : 'suggestion'

                                      const feedbackId = `${section}-${feedbackText}-${type}`

                                      if (addedFeedbackIds.has(feedbackId)) {
                                        setAddedFeedbackIds((prev) => {
                                          const newSet = new Set(prev)
                                          newSet.delete(feedbackId)
                                          return newSet
                                        })
                                        setFeedbackCards((prev) =>
                                          prev.filter(
                                            (card) =>
                                              !(
                                                card.section === section &&
                                                card.content === feedbackText &&
                                                card.type === type
                                              ),
                                          ),
                                        )
                                      } else {
                                        const newFeedbackCard = {
                                          id: `custom-${Date.now()}-${index}`,
                                          section,
                                          content: feedbackText,
                                          type,
                                          isCustomized: true,
                                        }
                                        setFeedbackCards((prev) => [...prev, newFeedbackCard])
                                        setAddedFeedbackIds(
                                          (prev) => new Set([...prev, feedbackId]),
                                        )
                                      }
                                    }

                                    return (
                                      <div
                                        key={index}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={
                                          addedFeedbackIds.has(lineFeedbackId)
                                            ? 'Remove feedback line from draft'
                                            : 'Add feedback line to draft'
                                        }
                                        className={`group relative flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-3 transition-all duration-300 ${(() => {
                                          const feedbackId = lineFeedbackId
                                          const isAdded = addedFeedbackIds.has(feedbackId)
                                          return isAdded
                                            ? (selectedFeedbackCard.type === 'strength'
                                              ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/40'
                                              : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/40')
                                            : 'bg-muted/30 border-border hover:bg-muted/50 hover:scale-105 hover:shadow-lg'
                                        })()}`}
                                        onClick={handleToggleFeedbackLine}
                                        onKeyDown={(e) =>
                                          keyboardActivateLine(e, handleToggleFeedbackLine)
                                        }
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm leading-relaxed">{cleanLine}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {(() => {
                                            const feedbackId = `${
                                              selectedFeedbackCard.section || 'Feedback'
                                            }-${cleanLine}-${
                                              selectedFeedbackCard.type === 'strength'
                                                ? 'strength'
                                                : 'suggestion'
                                            }`
                                            const isAdded = addedFeedbackIds.has(feedbackId)
                                            return isAdded ? (
                                              <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                                            ) : (
                                              <Plus className="size-4 text-muted-foreground" />
                                            )
                                          })()}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="w-full">
                        <Card
                          className={`group relative ${(() => {
                            if (message.role === 'user')
                              return 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                            if (message.metadata?.type === 'feedback')
                              return 'border border-border/50'
                            return 'bg-card border'
                          })()}`}
                          title={
                            message.role === 'assistant'
                              ? 'AI generation is immutable - content can be copied to feedback cards for editing'
                              : undefined
                          }
                        >
                          <CardContent className="p-4">
                            {/* AI Message Type Badge */}
                            {message.role === 'assistant' &&
                              message.metadata?.type === 'feedback' && (
                                <div className="mb-3">
                                  <Badge
                                    variant="secondary"
                                    className={`text-xs font-medium ${
                                      message.metadata?.feedbackType === 'strength'
                                        ? 'border-green-200 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                    }`}
                                  >
                                    {message.metadata?.feedbackType === 'strength' ? (
                                      <>
                                        <CheckCircle className="mr-1 size-3" />
                                        Strength
                                      </>
                                    ) : (
                                      <>
                                        <Target className="mr-1 size-3" />
                                        Suggestion
                                      </>
                                    )}
                                  </Badge>
                                </div>
                              )}
                            {regeneratingMessageId === message.id ? (
                              // Regenerating state
                              <div className="flex items-center justify-center py-8">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <RefreshCw className="size-5 animate-spin" />
                                  <span className="text-sm">Regenerating response...</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <div className="prose prose-zinc dark:prose-invert max-w-none flex-1">
                                  {message.metadata?.type === 'score-suggestion' ? (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <span className="text-sm font-medium">{message.content}</span>
                                      {acceptedScore ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                          <CheckCircle className="size-4" />
                                          <span className="text-sm font-medium">Accepted!</span>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                          <Button
                                            size="sm"
                                            onClick={handleAcceptScore}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            Accept Score
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleSetScore}
                                          >
                                            Set Score
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (message.metadata?.type === 'feedback' ? (
                                    <div className="space-y-3">
                                      {message.content.split('\n').map((line, index) => {
                                        const cleanLine = line
                                          .replace(/^\*\*.*?\*\*:\s*/, '')
                                          .trim()
                                        if (!cleanLine) return null

                                        const lineFeedbackId = `${
                                          message.metadata?.section || 'Feedback'
                                        }-${cleanLine}-${
                                          message.metadata?.feedbackType === 'strength'
                                            ? 'strength'
                                            : 'suggestion'
                                        }`

                                        const handleToggleAiFeedbackLine = () => {
                                          const feedbackText = cleanLine
                                          const section =
                                            message.metadata?.section || 'Feedback'
                                          const type: 'strength' | 'suggestion' =
                                            message.metadata?.feedbackType === 'strength'
                                              ? 'strength'
                                              : 'suggestion'

                                          const feedbackId = `${section}-${feedbackText}-${type}`

                                          if (addedFeedbackIds.has(feedbackId)) {
                                            const cardToRemove = feedbackCards.find(
                                              (card) =>
                                                card.section === section &&
                                                card.content === feedbackText &&
                                                card.type === type,
                                            )

                                            if (cardToRemove) {
                                              handleRemoveFeedback(cardToRemove.id, feedbackId)
                                            }
                                            return
                                          }

                                          const newCard = {
                                            id: Date.now().toString(),
                                            section,
                                            content: feedbackText,
                                            type,
                                            isCustomized: false,
                                          }

                                          setFeedbackCards((prev) => [...prev, newCard])
                                          setAddedFeedbackIds(
                                            (prev) => new Set([...prev, feedbackId]),
                                          )

                                          setShowCelebration(true)
                                          setTimeout(() => setShowCelebration(false), 2000)
                                        }

                                        return (
                                          <div
                                            key={index}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={
                                              addedFeedbackIds.has(lineFeedbackId)
                                                ? 'Remove feedback line from draft'
                                                : 'Add feedback line to draft'
                                            }
                                            className={`group relative flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-3 transition-all duration-300 ${(() => {
                                              const feedbackId = lineFeedbackId
                                              const isAdded = addedFeedbackIds.has(feedbackId)
                                              return isAdded
                                                ? (message.metadata?.feedbackType === 'strength'
                                                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/40'
                                                  : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/40')
                                                : 'bg-muted/30 border-border hover:bg-muted/50 hover:scale-105 hover:shadow-lg'
                                            })()}`}
                                            onClick={handleToggleAiFeedbackLine}
                                            onKeyDown={(e) =>
                                              keyboardActivateLine(e, handleToggleAiFeedbackLine)
                                            }
                                          >
                                            <div className="flex-1 space-y-3">
                                              <div className="flex items-center gap-2">
                                                <Badge
                                                  variant="outline"
                                                  className={`text-xs font-semibold ${
                                                    message.metadata?.feedbackType === 'strength'
                                                      ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300'
                                                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300'
                                                  }`}
                                                >
                                                  {message.metadata?.section || 'Feedback'}
                                                </Badge>
                                              </div>
                                              <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                  {line}
                                                </ReactMarkdown>
                                              </div>
                                            </div>
                                            {(() => {
                                              const feedbackId = `${
                                                message.metadata?.section || 'Feedback'
                                              }-${cleanLine}-${
                                                message.metadata?.feedbackType === 'strength'
                                                  ? 'strength'
                                                  : 'suggestion'
                                              }`
                                              const isAdded = addedFeedbackIds.has(feedbackId)

                                              if (isAdded) {
                                                return (
                                                  <div className="flex items-center gap-1.5 rounded-md bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 shadow-sm dark:bg-green-900/30 dark:text-green-300">
                                                    <CheckCircle className="size-3.5" />
                                                    Added
                                                  </div>
                                                )
                                              }

                                              return (
                                                <div className="flex items-center gap-1.5 rounded-md bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 dark:bg-green-900/30 dark:text-green-300">
                                                  <Plus className="size-3.5" />
                                                  Add
                                                </div>
                                              )
                                            })()}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {message.content}
                                    </ReactMarkdown>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* AI-style action buttons for assessment messages */}
                        {message.role === 'assistant' && regeneratingMessageId !== message.id && (
                          <div className="ml-2 mt-2 flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 px-2 text-xs ${
                                messageRatings[message.id] === 'up'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : 'hover:bg-green-100 dark:hover:bg-green-900/20'
                              }`}
                              onClick={() => handleRateMessage(message.id, 'up')}
                              title="Good response"
                            >
                              <ThumbsUp className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-7 px-2 text-xs ${
                                messageRatings[message.id] === 'down'
                                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                  : 'hover:bg-red-100 dark:hover:bg-red-900/20'
                              }`}
                              onClick={() => handleRateMessage(message.id, 'down')}
                              title="Poor response"
                            >
                              <ThumbsDown className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/20"
                              onClick={() => handleRegenerateMessage(message.id)}
                              disabled={regeneratingMessageId !== null}
                              title="Regenerate response"
                            >
                              <RefreshCw className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-900/20"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(message.content)
                                } catch {
                                  // Silently handle copy error
                                }
                              }}
                              title="Copy message"
                            >
                              <Copy className="size-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    {message.metadata?.type !== 'submission' && (
                      <div
                        className={`text-xs text-muted-foreground ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {message.timestamp &&
                        message.timestamp instanceof Date &&
                        !Number.isNaN(message.timestamp.getTime()) ? (
                          <SmartDate date={message.timestamp} includeTime />
                        ) : (
                          'Invalid time'
                        )}
                      </div>
                    )}
                  </div>

                  {(message.role === 'user' || message.role === 'assistant') &&
                    message.metadata?.type !== 'submission' && (
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback
                          className={
                            message.role === 'assistant'
                              ? 'bg-gradient-to-br from-purple-500/60 to-pink-500/60 text-white shadow-lg'
                              : 'bg-secondary text-secondary-foreground'
                          }
                        >
                          {message.role === 'assistant' ? (
                            <Image
                              src="/eddo-logo.png"
                              alt="Eddo AI"
                              width={32}
                              height={32}
                              className="size-full object-cover"
                            />
                          ) : (
                            <GraduationCap className="size-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    )}
                </div>
              ))}
          </div>
        </ScrollArea>

        {/* Pinned Bottom Navigation with Composer and Feedback */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background">
          {/* Feedback Added Section */}
          {feedbackCards.length > 0 && (
            <div className="border-b">
              <Card className="rounded-none border-0">
                <Collapsible open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="cursor-pointer p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Paperclip className="size-4 text-muted-foreground" />
                          <h3 className="text-sm font-medium">Feedback Draft</h3> 
                          <div
                            className="flex items-center gap-2"
                            aria-live="polite"
                            role="status"
                          >
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
                                  {feedbackCards.filter((card) => card.type === 'strength')
                                    .length === 1
                                    ? ''
                                    : 's'}
                                </Badge>
                              )}
                              {feedbackCards.some((card) => card.type === 'suggestion') && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-200 bg-amber-50 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                                >
                                  {
                                    feedbackCards.filter((card) => card.type === 'suggestion')
                                      .length
                                  }{' '}
                                  suggestion
                                  {feedbackCards.filter((card) => card.type === 'suggestion')
                                    .length === 1
                                    ? ''
                                    : 's'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddFeedback('strength')
                              }}
                              className="h-7 border-green-200 bg-green-50 px-2 text-xs text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400 dark:hover:bg-green-950/40"
                            >
                              <Plus className="mr-1 size-3" />
                              Add Strength
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddFeedback('suggestion')
                              }}
                              className="h-7 border-amber-200 bg-amber-50 px-2 text-xs text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40"
                            >
                              <Plus className="mr-1 size-3" />
                              Add Suggestion
                            </Button>
                          </div>

                          <ChevronDown
                            className={`size-4 transition-transform ${
                              feedbackOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-4 pt-0">
                      {feedbackCards.length === 0 ? (
                        // Empty state
                        <div className="py-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                              <Paperclip className="size-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium">No feedback</h3>
                              <p className="max-w-sm text-xs text-muted-foreground">
                                Click feedback items from AI messages above, or create your own
                                using the buttons below.
                              </p>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddFeedback('strength')
                                }}
                                className="border-green-200 bg-green-50 text-xs text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/20 dark:text-green-400"
                              >
                                <Plus className="mr-1 size-3" />
                                Add Strength
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddFeedback('suggestion')
                                }}
                                className="border-amber-200 bg-amber-50 text-xs text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                              >
                                <Plus className="mr-1 size-3" />
                                Add Suggestion
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {feedbackCards
                            .sort((a, b) => {
                              // Sort strengths before suggestions
                              if (a.type === 'strength' && b.type === 'suggestion') return -1
                              if (a.type === 'suggestion' && b.type === 'strength') return 1
                              return 0
                            })
                            .map((card, _index) => (
                              <Card
                                key={card.id}
                                className={cn(
                                  'group relative transition-all duration-200',
                                  // Type-specific styling using shadcn base with Tailwind utilities
                                  editingState.cardId === card.id
                                    ? 'border-border bg-background' // Neutral background when editing
                                    : (card.type === 'strength'
                                    ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                                    : 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'),
                                  // State-based styling
                                  editingState.cardId === card.id
                                    ? 'ring-2 ring-primary/20 shadow-lg scale-[1.02] z-10 border-primary/50'
                                    : 'hover:shadow-md hover:border-border/80 dark:hover:border-border/60',
                                )}
                              >
                                <CardContent
                                  className={editingState.cardId === card.id ? 'p-4' : 'p-3'}
                                >
                                  {editingState.cardId === card.id ? (
                                    // Edit Mode with Preview Toggle
                                    <div className="space-y-4">
                                      {/* Header with type, section, and preview toggle */}
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <button
                                            onClick={handleToggleType}
                                            className={`flex items-center gap-2 rounded-md px-3 py-2 transition-all duration-200 ${
                                              editingState.type === 'strength'
                                                ? 'border border-green-200 bg-green-100 text-green-700 hover:bg-green-200 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                                                : 'border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                                            }`}
                                          >
                                            {editingState.type === 'strength' ? (
                                              <div className="flex items-center gap-2">
                                                <CheckCircle className="size-4" />
                                                <span className="text-sm font-medium">
                                                  Strength
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                <Target className="size-4" />
                                                <span className="text-sm font-medium">
                                                  Suggestion
                                                </span>
                                              </div>
                                            )}
                                          </button>
                                          <div className="h-4 w-px bg-border" />
                                          <Input
                                            value={editingState.section}
                                            onChange={(e) =>
                                              setEditingState((prev) => ({
                                                ...prev,
                                                section: e.target.value,
                                              }))
                                            }
                                            placeholder="Section"
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setEditingState((prev) => ({
                                              ...prev,
                                              showPreview: !prev.showPreview,
                                            }))
                                          }
                                          className="h-8 px-3 text-xs"
                                        >
                                          {editingState.showPreview ? (
                                            <>
                                              <Edit3 className="mr-1 size-3" />
                                              Edit
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="mr-1 size-3" />
                                              Preview
                                            </>
                                          )}
                                        </Button>
                                      </div>

                                      {/* Content editor or preview */}
                                      {editingState.showPreview ? (
                                        // Preview Mode
                                        <div className="rounded-md border bg-muted/30 p-3">
                                          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                            {editingState.section || 'Section'}
                                            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                              <PencilIcon className="size-3" />
                                              <span className="text-xs">Custom</span>
                                            </div>
                                          </div>
                                          <div className="prose prose-sm dark:prose-invert prose-zinc max-w-none">
                                            <ReactMarkdown
                                              remarkPlugins={[remarkGfm]}
                                              components={{
                                                p: ({ children }) => (
                                                  <p className="mb-2 text-sm leading-relaxed last:mb-0">
                                                    {children}
                                                  </p>
                                                ),
                                                strong: ({ children }) => (
                                                  <strong className="font-semibold text-foreground">
                                                    {children}
                                                  </strong>
                                                ),
                                                em: ({ children }) => (
                                                  <em className="italic text-muted-foreground">
                                                    {children}
                                                  </em>
                                                ),
                                                code: ({ children }) => (
                                                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                                                    {children}
                                                  </code>
                                                ),
                                                ul: ({ children }) => (
                                                  <ul className="ml-4 list-disc space-y-1 text-sm">
                                                    {children}
                                                  </ul>
                                                ),
                                                ol: ({ children }) => (
                                                  <ol className="ml-4 list-decimal space-y-1 text-sm">
                                                    {children}
                                                  </ol>
                                                ),
                                                li: ({ children }) => (
                                                  <li className="text-sm">{children}</li>
                                                ),
                                                blockquote: ({ children }) => (
                                                  <blockquote className="border-l-2 border-muted-foreground/20 pl-3 text-sm italic text-muted-foreground">
                                                    {children}
                                                  </blockquote>
                                                ),
                                              }}
                                            >
                                              {editingState.content || 'Enter feedback...'}
                                            </ReactMarkdown>
                                          </div>
                                        </div>
                                      ) : (
                                        // Edit Mode
                                        <div>
                                          <Textarea
                                            value={editingState.content}
                                            onChange={(e) =>
                                              setEditingState((prev) => ({
                                                ...prev,
                                                content: e.target.value,
                                              }))
                                            }
                                            onKeyDown={handleEditKeyDown}
                                            placeholder="Enter feedback..."
                                            className="min-h-[120px] text-sm"
                                            autoFocus
                                          />
                                        </div>
                                      )}

                                      {/* Footer with actions */}
                                      <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span>↵ save • ⇧↵ new line</span>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCancelEdit}
                                            className="h-8 px-3 text-xs"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={handleSaveEdit}
                                            className="h-8 px-3 text-xs"
                                            disabled={
                                              !editingState.content.trim() ||
                                              !editingState.section.trim()
                                            }
                                          >
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    // Preview Mode
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      className="cursor-pointer"
                                      aria-label={`Edit feedback: ${card.section}`}
                                      onClick={() => handleEditCard(card)}
                                      onKeyDown={(e) =>
                                        keyboardActivateLine(e, () => handleEditCard(card))
                                      }
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex flex-1 items-start gap-2">
                                          {card.type === 'strength' ? (
                                            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
                                          ) : (
                                            <Target className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                          )}
                                          <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                              {card.section}
                                              {/* Source Indicator */}
                                              {card.isCustomized ? (
                                                <div
                                                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400"
                                                  title="Customized feedback"
                                                >
                                                  <PencilIcon className="size-3" />
                                                  <span className="text-xs">Custom</span>
                                                </div>
                                              ) : (
                                                <Badge
                                                  variant="outline"
                                                  className="border-amber-200 bg-amber-50 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
                                                  title="AI-generated feedback copy - edits won't affect original message"
                                                >
                                                  <Sparkles className="mr-1 size-3" />
                                                  AI
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="prose prose-sm dark:prose-invert prose-zinc max-w-none">
                                              <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                  // Customize markdown components for better card display
                                                  p: ({ children }) => (
                                                    <p className="mb-2 text-sm leading-relaxed last:mb-0">
                                                      {children}
                                                    </p>
                                                  ),
                                                  strong: ({ children }) => (
                                                    <strong className="font-semibold text-foreground">
                                                      {children}
                                                    </strong>
                                                  ),
                                                  em: ({ children }) => (
                                                    <em className="italic text-muted-foreground">
                                                      {children}
                                                    </em>
                                                  ),
                                                  code: ({ children }) => (
                                                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                                                      {children}
                                                    </code>
                                                  ),
                                                  ul: ({ children }) => (
                                                    <ul className="ml-4 list-disc space-y-1 text-sm">
                                                      {children}
                                                    </ul>
                                                  ),
                                                  ol: ({ children }) => (
                                                    <ol className="ml-4 list-decimal space-y-1 text-sm">
                                                      {children}
                                                    </ol>
                                                  ),
                                                  li: ({ children }) => (
                                                    <li className="text-sm">{children}</li>
                                                  ),
                                                  blockquote: ({ children }) => (
                                                    <blockquote className="border-l-2 border-muted-foreground/20 pl-3 text-sm italic text-muted-foreground">
                                                      {children}
                                                    </blockquote>
                                                  ),
                                                  h1: ({ children }) => (
                                                    <h1 className="mb-2 text-base font-bold">
                                                      {children}
                                                    </h1>
                                                  ),
                                                  h2: ({ children }) => (
                                                    <h2 className="mb-1 text-sm font-bold">
                                                      {children}
                                                    </h2>
                                                  ),
                                                  h3: ({ children }) => (
                                                    <h3 className="mb-1 text-sm font-semibold">
                                                      {children}
                                                    </h3>
                                                  ),
                                                }}
                                              >
                                                {card.content}
                                              </ReactMarkdown>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                          {card.isCustomized ? (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 px-2 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                              onClick={(e) => {
                                                e.stopPropagation() // Prevent triggering edit mode
                                                handleEditCard(card)
                                              }}
                                              title="Edit this custom feedback"
                                            >
                                              <Edit3 className="mr-1 size-3" />
                                              Edit
                                            </Button>
                                          ) : (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 px-2 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                              onClick={(e) => {
                                                e.stopPropagation() // Prevent triggering edit mode
                                                handleEditCard(card)
                                              }}
                                              title="Customize this AI feedback"
                                            >
                                              <PencilIcon className="mr-1 size-3" />
                                              Customize
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6 shrink-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                                            onClick={(e) => {
                                              e.stopPropagation() // Prevent triggering edit mode
                                              const feedbackId = `${card.section}-${card.content}-${card.type}`
                                              handleRemoveFeedback(card.id, feedbackId)
                                            }}
                                          >
                                            <X className="size-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          )}

          {/* Message Composer */}
          <Card className="rounded-none border-0">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Your message to ${
                    showStudentInfo ? record?.studentName || 'Student' : 'Anonymous Student'
                  }...`}
                  className="flex-1"
                  aria-label="Message to student"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  size="icon"
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom padding to prevent content from being hidden behind fixed nav */}
        <div className={`${feedbackCards.length > 0 ? 'h-24' : 'h-12'}`}></div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title" aria-describedby="delete-confirm-desc">
            <div className="mx-4 max-w-sm rounded-lg bg-background p-6 shadow-lg">
              <div className="mb-4">
                <h3 id="delete-confirm-title" className="text-lg font-semibold">Delete Custom Feedback?</h3>
                <p id="delete-confirm-desc" className="mt-2 text-sm text-muted-foreground">
                  This custom feedback will be permanently deleted. This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={cancelRemoveFeedback}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" onClick={confirmRemoveFeedback}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  } catch {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="mb-2 text-muted-foreground">Error rendering component</p>
          <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }
}
