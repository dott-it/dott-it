'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PackageItem } from '@/lib/library/materials'
import { googleFormEmbedUrl } from '@/lib/library/materials/google-form-embed-url'
import {
  isDriveDocumentPreviewKind,
  libraryMaterialPreviewUrl,
} from '@/lib/library/materials/library-material-preview-url'

interface MaterialQuickLookDialogProps {
  item: PackageItem
  assessmentTitle: string
  unitCode: string
  assessmentId: string
  previewExcerpt?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type DocumentPreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; blobUrl: string }
  | {
      status: 'error'
      message: string
      code?: string
      openInDriveUrl?: string
      needsAuth?: boolean
    }

export function MaterialQuickLookDialog({
  item,
  assessmentTitle,
  unitCode,
  assessmentId,
  previewExcerpt,
  open,
  onOpenChange,
}: MaterialQuickLookDialogProps) {
  const pathname = usePathname()
  const openFormUrl =
    item.kind === 'google-form' && item.available && item.url?.startsWith('http') ? item.url : null
  // Prefer curriculum Shared Drive Form for iframe (embeds without Google login).
  const iframeSourceUrl =
    item.kind === 'google-form' && item.embedUrl?.startsWith('http')
      ? item.embedUrl
      : openFormUrl

  const teacherReadyDiffers =
    Boolean(openFormUrl) && Boolean(iframeSourceUrl) && openFormUrl !== iframeSourceUrl

  const documentPreviewUrl =
    item.available && isDriveDocumentPreviewKind(item.kind)
      ? libraryMaterialPreviewUrl({ unitCode, assessmentId, kind: item.kind })
      : null

  const showFormIframe = Boolean(iframeSourceUrl)
  const showDocumentPreview = Boolean(documentPreviewUrl) && !showFormIframe

  const [formEmbedUrl, setFormEmbedUrl] = useState<string | null>(null)
  const [formEmbedLoading, setFormEmbedLoading] = useState(false)
  const [documentPreview, setDocumentPreview] = useState<DocumentPreviewState>({ status: 'idle' })

  useEffect(() => {
    if (!open || !iframeSourceUrl) {
      setFormEmbedUrl(null)
      setFormEmbedLoading(false)
      return
    }

    let cancelled = false
    setFormEmbedLoading(true)
    setFormEmbedUrl(null)

    void (async () => {
      try {
        const response = await fetch(
          `/api/library/google-form-embed?formUrl=${encodeURIComponent(iframeSourceUrl)}`,
        )
        const data = (await response.json()) as { embedUrl?: string }
        if (!cancelled) {
          setFormEmbedUrl(
            response.ok && data.embedUrl ? data.embedUrl : googleFormEmbedUrl(iframeSourceUrl),
          )
        }
      } catch {
        if (!cancelled) {
          setFormEmbedUrl(googleFormEmbedUrl(iframeSourceUrl))
        }
      } finally {
        if (!cancelled) {
          setFormEmbedLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, iframeSourceUrl])

  useEffect(() => {
    if (!open || !showDocumentPreview || !documentPreviewUrl) {
      setDocumentPreview({ status: 'idle' })
      return
    }

    let cancelled = false
    let objectUrl: string | null = null
    setDocumentPreview({ status: 'loading' })

    void (async () => {
      try {
        const response = await fetch(documentPreviewUrl, { credentials: 'same-origin' })
        const contentType = response.headers.get('content-type') ?? ''

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string
            code?: string
            openInDriveUrl?: string
          }
          if (cancelled) {
            return
          }
          setDocumentPreview({
            status: 'error',
            message:
              data.error ??
              (response.status === 401
                ? 'Sign in to preview this material.'
                : 'Could not load document preview.'),
            code: data.code,
            openInDriveUrl: data.openInDriveUrl,
            needsAuth: response.status === 401 || data.code === 'AUTH_REQUIRED',
          })
          return
        }

        if (!contentType.includes('application/pdf')) {
          if (!cancelled) {
            setDocumentPreview({
              status: 'error',
              message: 'Unexpected preview response. Try opening the file in Drive instead.',
            })
          }
          return
        }

        const blob = await response.blob()
        const nextUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(nextUrl)
          return
        }
        objectUrl = nextUrl
        setDocumentPreview({ status: 'ready', blobUrl: nextUrl })
      } catch {
        if (!cancelled) {
          setDocumentPreview({
            status: 'error',
            message: 'Could not load document preview. Check your connection and try again.',
          })
        }
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [open, showDocumentPreview, documentPreviewUrl])

  const formDescription =
    showFormIframe && teacherReadyDiffers
      ? `In-app preview of ${assessmentTitle}. Google cannot embed File upload Forms here — use Open to see the teacher File upload version.`
      : null

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || '/library/openscied')}`
  const excerptFallback =
    documentPreview.status === 'error' && previewExcerpt ? previewExcerpt : null
  const openInDriveUrl =
    documentPreview.status === 'error' ? documentPreview.openInDriveUrl : undefined
  const documentErrorMessage =
    documentPreview.status === 'error' ? documentPreview.message : null
  const needsAuth = documentPreview.status === 'error' && documentPreview.needsAuth
  const useWideLayout =
    showFormIframe ||
    (showDocumentPreview &&
      (documentPreview.status === 'loading' || documentPreview.status === 'ready'))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          useWideLayout
            ? 'flex max-h-[92vh] max-w-4xl flex-col gap-3 overflow-hidden'
            : 'max-h-[92vh] max-w-xl overflow-y-auto'
        }
      >
        <DialogHeader className="space-y-1">
          <DialogTitle>{item.label}</DialogTitle>
          {formDescription ? <DialogDescription>{formDescription}</DialogDescription> : null}
          {documentErrorMessage ? (
            <DialogDescription>{documentErrorMessage}</DialogDescription>
          ) : null}
        </DialogHeader>

        {showFormIframe ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-background">
            {formEmbedLoading || !formEmbedUrl ? (
              <div className="flex h-[min(75vh,720px)] items-center justify-center text-sm text-muted-foreground">
                Loading form preview…
              </div>
            ) : (
              <iframe
                title={`${item.label} preview`}
                src={formEmbedUrl}
                className="h-[min(75vh,720px)] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        ) : null}

        {showDocumentPreview && documentPreview.status === 'loading' ? (
          <div className="flex h-[min(75vh,720px)] items-center justify-center rounded-md border border-border bg-background text-sm text-muted-foreground">
            Loading document…
          </div>
        ) : null}

        {showDocumentPreview && documentPreview.status === 'ready' ? (
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-background">
            <iframe
              title={`${item.label} preview`}
              src={documentPreview.blobUrl}
              className="h-[min(75vh,720px)] w-full border-0"
            />
          </div>
        ) : null}

        {excerptFallback ? (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed text-foreground">
            {excerptFallback}
          </div>
        ) : null}

        {!showFormIframe && !showDocumentPreview && previewExcerpt ? (
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed text-foreground">
            {previewExcerpt}
          </div>
        ) : null}

        {!showFormIframe && !showDocumentPreview && !previewExcerpt ? (
          <p className="text-sm text-muted-foreground">No preview is available for this material.</p>
        ) : null}

        {openFormUrl || openInDriveUrl || needsAuth ? (
          <DialogFooter className="flex-wrap gap-2 sm:justify-end">
            {needsAuth ? (
              <Button asChild>
                <a href={loginHref}>Sign in to preview</a>
              </Button>
            ) : null}
            {openInDriveUrl ? (
              <Button asChild variant={needsAuth ? 'outline' : 'default'}>
                <a href={openInDriveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  Open in Drive
                </a>
              </Button>
            ) : null}
            {openFormUrl ? (
              <Button asChild>
                <a href={openFormUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  {teacherReadyDiffers ? 'Open File upload Form' : 'Open Google Form'}
                </a>
              </Button>
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
