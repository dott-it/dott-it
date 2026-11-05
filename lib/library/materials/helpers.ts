import type { LibraryOutputKind } from '@/lib/library/ingest/types'
import type { MaterialAssessmentContext, PackageItem, PackageItemKind } from './types'

export type PackageItemAvailability = 'available' | 'planned' | 'not-applicable' | 'missing'

/** Handout exists so export can create a Form, but there is no live curriculum Form URL yet. */
export function isGoogleFormExportOnly(item: PackageItem): boolean {
  return item.kind === 'google-form' && item.available && !item.url?.startsWith('http')
}

export function hasLiveGoogleFormUrl(item: PackageItem): boolean {
  return item.kind === 'google-form' && Boolean(item.url?.startsWith('http'))
}

/**
 * Quick look should only open a Form when a live URL exists.
 * Export-only Forms must not look previewable.
 */
export function packageItemAllowsQuickLook(
  item: PackageItem,
  previewExcerpt?: string,
): boolean {
  if (item.kind === 'google-form') {
    return hasLiveGoogleFormUrl(item)
  }
  return item.available || Boolean(previewExcerpt)
}

export function packageItemAvailability(item: PackageItem): PackageItemAvailability {
  // Still exportable (available=true), but present as not-yet-digitized in Materials UI.
  if (isGoogleFormExportOnly(item)) {
    return 'planned'
  }
  if (item.available) {
    return 'available'
  }
  const reason = item.unavailableReason ?? ''
  if (/not applicable|not part of this assessment/i.test(reason)) {
    return 'not-applicable'
  }
  if (/planned|digitized/i.test(reason)) {
    return 'planned'
  }
  return 'missing'
}

export function packageItemStatusLabel(item: PackageItem): string {
  if (isGoogleFormExportOnly(item)) {
    return 'Not digitized yet — teacher-ready Form required for Drive export'
  }
  if (hasLiveGoogleFormUrl(item)) {
    return 'Digitized — add an editable copy to your Google Forms'
  }
  if (item.available && item.fileName) {
    return item.fileName
  }
  return packageItemUnavailableLabel(item)
}

export function packageItemUnavailableLabel(item: PackageItem): string {
  switch (packageItemAvailability(item)) {
    case 'not-applicable': {
      return 'Not applicable for this assessment'
    }
    case 'planned': {
      return 'Not yet digitized'
    }
    case 'missing': {
      return item.unavailableReason ?? 'Not generated for this assessment'
    }
    default: {
      return item.fileName ?? item.label
    }
  }
}

export function packageItemRowClass(item: PackageItem): string {
  if (isGoogleFormExportOnly(item)) {
    return 'border-dashed border-amber-500/35 bg-amber-500/5'
  }
  if (item.available) {
    return 'border-border bg-card'
  }
  switch (packageItemAvailability(item)) {
    case 'not-applicable': {
      return 'border-border/50 bg-muted/20 opacity-70'
    }
    case 'planned': {
      return 'border-dashed border-amber-500/35 bg-amber-500/5'
    }
    default: {
      return 'border-dashed border-border/70 bg-muted/30 opacity-80'
    }
  }
}

function isFormalAssessment(context: MaterialAssessmentContext): boolean {
  return context.source === 'formal-assessment'
}

function isTeOpportunity(context: MaterialAssessmentContext): boolean {
  return context.source === 'te-opportunity'
}

export function getPackageItem(
  context: MaterialAssessmentContext,
  kind: PackageItemKind,
): PackageItem | undefined {
  return context.package.find((item) => item.kind === kind)
}

export function packageItemKindApplies(
  context: MaterialAssessmentContext,
  kind: PackageItemKind,
): boolean {
  const item = getPackageItem(context, kind)
  const output: LibraryOutputKind | undefined = context.libraryOutput

  if (kind === 'guidance-sheet') {
    return Boolean(item?.available)
  }

  if (isFormalAssessment(context)) {
    if (kind === 'rubric') {
      return Boolean(context.isSummative || item?.available)
    }
    return true
  }

  if (!isTeOpportunity(context)) {
    return true
  }

  if (kind === 'teacher-guide') {
    return true
  }

  if (kind === 'student-handout') {
    return Boolean(item?.available)
  }

  if (kind === 'google-form') {
    return output === 'handout-form-planned'
  }

  if (kind === 'answer-key') {
    return Boolean(item?.available)
  }

  if (kind === 'rubric') {
    return false
  }

  return false
}

export function getDisplayPackageItems(context: MaterialAssessmentContext): PackageItem[] {
  return context.package.filter((item) => packageItemKindApplies(context, item.kind))
}

export function getAvailablePackageItems(context: MaterialAssessmentContext): PackageItem[] {
  return getDisplayPackageItems(context).filter((item) => item.available)
}

/** Downloadable / Drive-copyable files shown in the bulk export chooser (Forms excluded). */
export function getBulkExportPackageItems(context: MaterialAssessmentContext): PackageItem[] {
  return getDisplayPackageItems(context).filter(
    (item) => item.kind !== 'google-form' && item.available,
  )
}

export function isExportReady(context: MaterialAssessmentContext): boolean {
  return getAvailablePackageItems(context).length > 0
}

export function isBulkExportReady(context: MaterialAssessmentContext): boolean {
  return getBulkExportPackageItems(context).length > 0
}

export function shouldShowOpportunityMaterials(context: MaterialAssessmentContext): boolean {
  return Boolean(getPackageItem(context, 'student-handout')?.available)
}
