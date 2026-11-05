'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { getFriendlyFormUrl } from '@/lib/utills/form-utils'
import { useQRCode } from 'next-qrcode'

interface AssessmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  slug: string
}

export function AssessmentFormModal({ open, onOpenChange, title, slug }: AssessmentFormModalProps) {
  const origin = globalThis.window?.location.origin ?? "";

  const friendlyUrl = getFriendlyFormUrl(slug, origin)
  const { Image: QRCodeImage } = useQRCode()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Scan the QR code or enter the URL to open the form.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <span className="sr-only">
            QR code linking to the assessment form. Full URL: {friendlyUrl}
          </span>
          <div aria-hidden="true">
            <QRCodeImage
              text={friendlyUrl}
              options={{
                type: 'image/png',
                quality: 0.3,
                margin: 2,
                width: 400,
              }}
            />
          </div>
        </div>
        <p className="mb-4">
          <a
            href={friendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-blue-600 underline"
          >
            {friendlyUrl}
          </a>
        </p>
        <DialogFooter className="justify-center">
          <DialogClose asChild>
            <Button>
              <Check className="mr-2 size-4" />
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
