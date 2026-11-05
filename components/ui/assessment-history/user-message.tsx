'use client'

import { Card, CardContent } from '@/app/lib/components/ui/layout/card'
import { cn } from '@/app/lib/utils/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SmartDate } from '@/app/lib/components/ui/feedback'

interface UserMessageProps {
  content: string
  timestamp?: Date
}

export function UserMessage({ content, timestamp }: UserMessageProps) {
  return (
    <div className="w-full">
      <Card
        className={cn(
          'w-full',
          'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20',
          'hover:shadow-md hover:border-border/80 dark:hover:border-border/60',
        )}
      >
        <CardContent className="p-4">
          <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-3 text-sm leading-relaxed text-foreground last:mb-0">
                    {children}
                  </p>
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
          </div>
          {timestamp && (
            <div className="mt-2 text-xs text-muted-foreground">
              <SmartDate date={timestamp} includeTime />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
