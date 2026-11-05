'use client'

import { Target, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { Badge } from '@/app/lib/components/ui/feedback/badge'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AIMessageProps {
  content: string
  messageType?: 'feedback' | 'default'
  feedbackType?: 'strength' | 'suggestion'
  isRegenerating?: boolean
}

export function AIMessage({
  content,
  messageType = 'default',
  feedbackType,
  isRegenerating = false,
}: AIMessageProps) {
  return (
    <div className="w-full max-w-[75%]">
      <Card
        className={`group relative ${(() => {
          if (messageType === 'feedback') return 'border border-border/50'
          return 'bg-card border'
        })()}`}
        title={
          messageType === 'default'
            ? 'AI generation is immutable - content can be copied to feedback cards for editing'
            : undefined
        }
      >
        <CardContent className="p-4">
          {/* AI Message Type Badge */}
          {messageType === 'feedback' && (
            <div className="mb-3">
              <Badge variant="secondary" className="text-xs font-medium">
                {feedbackType === 'strength' ? (
                  <>
                    <Target className="mr-1 size-3" />
                    Suggestion
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

          {isRegenerating ? (
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
                {messageType === 'feedback' ? (
                  <div className="space-y-3">
                    {content.split('\n').map((line, index) => {
                      const cleanLine = line.replace(/^\*\*.*?\*\*:\s*/, '').trim()
                      if (!cleanLine) return null

                      return (
                        <div
                          key={index}
                          className="group relative flex cursor-pointer items-start justify-between gap-2 rounded-lg border border-border bg-muted/30 p-3 transition-all duration-300 hover:scale-105 hover:bg-muted/50 hover:shadow-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed">{cleanLine}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mb-3 text-lg font-bold text-foreground">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-2 text-base font-bold text-foreground">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-2 text-sm font-semibold text-foreground">{children}</h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 text-sm leading-relaxed text-foreground">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      em: ({ children }) => <em className="italic">{children}</em>,
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
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamp removed for all AI messages */}
    </div>
  )
}
