'use client'

import { BarChart3 } from 'lucide-react'

interface ThematicAnalysisEmptyProps {
  variant: 'no-responses' | 'ready' | 'generating' | 'failed'
}

export function ThematicAnalysisEmpty({ variant }: ThematicAnalysisEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <BarChart3 className="size-8 text-muted-foreground" />
      </div>
      {variant === 'no-responses' && (
        <>
          <h3 className="mb-2 text-lg font-semibold">No Analysis Yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            We will generate thematic patterns once student responses are in!
          </p>
        </>
      )}
      {variant === 'ready' && (
        <>
          <h3 className="mb-2 text-lg font-semibold">No Analysis Yet</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Student responses are ready. Run analysis to generate thematic
            patterns.
          </p>
        </>
      )}
      {variant === 'failed' && (
        <>
          <h3 className="mb-2 text-lg font-semibold">Analysis Failed</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            We couldn&apos;t generate thematic patterns. Try running the analysis
            again.
          </p>
        </>
      )}
      {variant === 'generating' && (
        <>
          <h3 className="mb-2 text-lg font-semibold">Generating Analysis...</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            We are generating the assessment patterns right now, stay tuned!
          </p>
          <div className="mt-6 flex gap-1">
            <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="size-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="size-2 animate-bounce rounded-full bg-primary" />
          </div>
        </>
      )}
    </div>
  )
}
