import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../layout/dialog/dialog'
import { Button } from '../buttons/button'
import { Input } from '../forms/input'
import { Label } from '../forms/label'
import { Typography } from '../typography'
import { QrCode, Copy, ExternalLink, Check } from 'lucide-react'
import { ActiveAssessment } from '@/types'
import { useQRCode } from 'next-qrcode'
import { createEvent } from '../../../services/events/events.service'
import { generateFormUrl, generateAssessmentSlug } from '../../../utils/assessment-slug'

interface LiveCollectionModalProps {
  assessment: ActiveAssessment
  open: boolean
  onOpenChange: (open: boolean) => void
  location?: 'workspace' | 'class' // To determine which tracking event to send
}

export function LiveCollectionModal({
  assessment,
  open,
  onOpenChange,
  location = 'workspace',
}: LiveCollectionModalProps) {
  const [copied, setCopied] = useState(false)
  const { Image: QRCodeImage } = useQRCode()

  // Generate friendly URL using utility function
  const formUrl = generateFormUrl(assessment.id)
  const slug = generateAssessmentSlug(assessment.id)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(formUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Failed to copy URL
    }
  }

  const handleOpenForm = () => {
    window.open(formUrl, '_blank')
  }

  const handleClose = async () => {
    // Track the exit event based on location
    const eventName =
      location === 'workspace'
        ? 'workspace_assessmentcollection_exited'
        : 'classassessment_assessmentcollection_exited'

    try {
      await createEvent({
        name: eventName,
        payload: {
          assessmentId: assessment.id,
          assessmentTitle: assessment.title,
          slug: slug,
          formUrl: formUrl,
          timestamp: new Date().toISOString(),
        },
      })
    } catch {
      // Failed to track event
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col p-0">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <DialogHeader className="pb-0">
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5" />
              Assessment Handout
            </DialogTitle>
            <DialogDescription>
              Share this QR code or URL with your students to access the assessment form.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {/* Assessment Info */}
          <div className="rounded-lg bg-muted/50 p-3">
            <Typography variant="body2" fontWeight="medium">
              {assessment.title}
            </Typography>
            <Typography variant="caption" color="muted">
              {assessment.unitName} • Grade {assessment.grade}
            </Typography>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="text-center">
              <Typography variant="body2" fontWeight="medium" className="mb-2 text-gray-700">
                Scan QR Code
              </Typography>
              <Typography variant="caption" className="text-gray-500">
                Students can scan this code to access the form
              </Typography>
            </div>
            <div className="flex size-52 flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-6 shadow-lg">
              <span className="sr-only">
                QR code linking to the assessment form. Full URL: {formUrl}
              </span>
              <div aria-hidden="true">
                <QRCodeImage
                  text={formUrl}
                  options={{
                    type: 'image/png',
                    quality: 0.3,
                    margin: 2,
                    width: 200,
                    color: {
                      dark: '#000000',
                      light: '#FFFFFF',
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* URL Section */}
          <div className="space-y-3">
            <div className="text-center">
              <Typography variant="body2" fontWeight="medium" className="mb-1 text-gray-700">
                Or Share URL
              </Typography>
              <Typography id="form-url-hint" variant="caption" className="text-gray-500">
                Copy and share this link with your students
              </Typography>
            </div>
            <div className="flex gap-2">
              <Label htmlFor="form-url" className="sr-only">
                Assessment form URL
              </Label>
              <Input
                id="form-url"
                value={formUrl}
                readOnly
                className="border-gray-200 bg-gray-50 font-mono text-xs"
                aria-describedby="form-url-hint"
              />
              <Button
                size="sm"
                variant={copied ? 'default' : 'outline'}
                onClick={handleCopyUrl}
                className={`shrink-0 transition-colors ${
                  copied ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
              >
                {copied ? (
                  <>
                    <Check className="mr-1 size-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 size-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 border-t bg-background px-6 py-4">
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleOpenForm}>
              <ExternalLink className="mr-2 size-4" />
              Open Form
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
