'use client'

import { ExternalLink, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DOTT_COMMUNITY_DEMO_URL } from '@/lib/library/site-url'

interface AddToWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentTitle: string
  unitCode: string
  assessmentId: string
  loginHref: string
}

export function AddToWorkspaceDialog({
  open,
  onOpenChange,
  assessmentTitle,
  unitCode,
  assessmentId,
  loginHref,
}: AddToWorkspaceDialogProps) {
  const router = useRouter()
  const { status } = useSession()
  const [isAttaching, setIsAttaching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const shouldAutoAttach = useRef(false)
  const postLoginAttachStarted = useRef(false)

  const runAttach = useCallback(async () => {
    setIsAttaching(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/library/workspace/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitCode, assessmentId }),
      })

      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        redirectUrl?: string
        alreadyAttached?: boolean
        title?: string
      }

      if (response.status === 401) {
        globalThis.location.assign(loginHref)
        return
      }

      if (!response.ok) {
        setErrorMessage(data.error ?? 'Could not add this assessment to Workspace.')
        return
      }

      const label = data.alreadyAttached
        ? 'This assessment is already in your Workspace.'
        : 'Assessment added to your Workspace.'
      setSuccessMessage(label)

      if (data.redirectUrl) {
        router.push(data.redirectUrl)
      }
    } catch {
      setErrorMessage('Could not add this assessment to Workspace. Please try again.')
    } finally {
      setIsAttaching(false)
    }
  }, [assessmentId, loginHref, router, unitCode])

  useEffect(() => {
    if (!open) {
      shouldAutoAttach.current = false
      postLoginAttachStarted.current = false
      setErrorMessage(null)
      setSuccessMessage(null)
      setIsAttaching(false)
      return
    }

    const params = new URLSearchParams(globalThis.location.search)
    if (params.get('addToWorkspace') === 'ready') {
      shouldAutoAttach.current = true
      params.delete('addToWorkspace')
      const nextSearch = params.toString()
      const nextUrl = `${globalThis.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`
      globalThis.history.replaceState({}, '', nextUrl)
    }

    // Wait for session to resolve after login callback before attaching.
    if (
      shouldAutoAttach.current &&
      status === 'authenticated' &&
      !postLoginAttachStarted.current
    ) {
      postLoginAttachStarted.current = true
      shouldAutoAttach.current = false
      void runAttach()
    }
  }, [open, runAttach, status])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMessage(null)
      setSuccessMessage(null)
    }
    onOpenChange(nextOpen)
  }

  const handlePrimaryAction = () => {
    if (status !== 'authenticated') {
      globalThis.location.assign(loginHref)
      return
    }
    void runAttach()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Unit {unitCode} · Add to Workspace
          </DialogDescription>
          <DialogTitle className="text-xl leading-snug">{assessmentTitle}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Attach the Google Form and scoring bundle to your Dott.it Workspace so you can collect
            student responses and generate AI-assisted feedback.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {successMessage}
          </p>
        ) : null}

        <aside className="rounded-md border border-border bg-muted/30 px-3 py-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            New to Dott.it? Join our community to see how teachers collect responses and deliver
            AI-assisted feedback.
          </p>
          <Button asChild variant="link" className="mt-1 h-auto px-0 text-sm">
            <a href={DOTT_COMMUNITY_DEMO_URL} target="_blank" rel="noopener noreferrer">
              Join the Dott.it community
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Button>
        </aside>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handlePrimaryAction} disabled={isAttaching}>
            {isAttaching ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Adding…
              </>
            ) : (
              (status === 'authenticated' ? 'Add to Workspace' : 'Sign in to continue')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
