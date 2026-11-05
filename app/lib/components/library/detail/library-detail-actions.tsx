'use client'

import { Download, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AddToWorkspaceDialog } from '@/app/lib/components/library/detail/add-to-workspace-dialog'
import { ExportMaterialsDialog } from '@/app/lib/components/library/detail/export-materials-dialog'
import { Button } from '@/components/ui/button'
import type { MaterialAssessmentContext } from '@/lib/library/materials'
import {
  hasPublishedFormWithoutWorkspaceFormId,
  isBulkExportReady,
  isWorkspaceEligible,
} from '@/lib/library/materials'

interface LibraryDetailActionsProps {
  assessmentTitle: string
  unitCode: string
  lessonNumber?: number
  assessmentId?: string
  materialContext: MaterialAssessmentContext | null
  loginHref?: string
  externalLink?: string
  showWorkspaceAction?: boolean
}

export function LibraryDetailActions({
  assessmentTitle,
  unitCode,
  lessonNumber,
  assessmentId,
  materialContext,
  loginHref = '/login',
  externalLink,
  showWorkspaceAction = true,
}: LibraryDetailActionsProps) {
  const [exportOpen, setExportOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const canExport = materialContext ? isBulkExportReady(materialContext) : false
  const canAddToWorkspace =
    showWorkspaceAction && materialContext ? isWorkspaceEligible(materialContext) : false
  const showWorkspaceButton = showWorkspaceAction

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search)
    if (params.get('googleExport') === 'ready') {
      setExportOpen(true)
    }
    if (params.get('addToWorkspace') === 'ready') {
      setWorkspaceOpen(true)
    }
  }, [])

  const showExportInsteadHint =
    !canAddToWorkspace && showWorkspaceAction && Boolean(materialContext) && canExport
  const publishedFormNeedsFormId =
    Boolean(materialContext) && hasPublishedFormWithoutWorkspaceFormId(materialContext!)

  return (
    <>
      <footer className="flex flex-col gap-3 border-t border-border pt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canExport && materialContext ? (
            <Button type="button" className="gap-2" onClick={() => setExportOpen(true)}>
              <Download className="size-4" aria-hidden />
              Download / export materials
            </Button>
          ) : null}
          {showWorkspaceButton ? (
            <Button
              type="button"
              variant={canExport ? 'outline' : 'default'}
              className="gap-2"
              disabled={!canAddToWorkspace}
              onClick={() => setWorkspaceOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              Add to Dott.it workspace
            </Button>
          ) : null}
          {externalLink ? (
            <Button asChild variant="outline">
              <a href={externalLink} target="_blank" rel="noopener noreferrer">
                View on OpenSciEd
              </a>
            </Button>
          ) : null}
        </div>
        {showExportInsteadHint ? (
          <p className="text-sm text-muted-foreground">
            {publishedFormNeedsFormId ? (
              <>
                Preview and export work with this Form, but Add to Dott.it workspace needs a Forms API
                formId URL (not a published /d/e/ link). Use{' '}
              </>
            ) : (
              <>This assessment is not yet digitized for Workspace. Use </>
            )}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-2"
              onClick={() => setExportOpen(true)}
            >
              Download / export materials
            </button>{' '}
            to copy available files to your Drive.
          </p>
        ) : null}
      </footer>

      {canExport && materialContext ? (
        <ExportMaterialsDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          context={materialContext}
          assessmentTitle={assessmentTitle}
          unitCode={unitCode}
          lessonNumber={lessonNumber}
        />
      ) : null}

      {canAddToWorkspace && assessmentId ? (
        <AddToWorkspaceDialog
          open={workspaceOpen}
          onOpenChange={setWorkspaceOpen}
          assessmentTitle={assessmentTitle}
          unitCode={unitCode}
          assessmentId={assessmentId}
          loginHref={loginHref}
        />
      ) : null}
    </>
  )
}
