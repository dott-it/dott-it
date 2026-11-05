import { FORMS_WORKSPACE_USER } from '@/lib/library/digitize/curriculum-example-notice'
import { googleApiJson } from '@/lib/library/export/google-api-fetch'

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const FORMS_API_BASE = 'https://forms.googleapis.com/v1'

type FormItemSnapshot = {
  itemId?: string
  title?: string
  questionItem?: {
    question?: {
      fileUploadQuestion?: { folderId?: string }
    }
  }
}

type FormSnapshot = {
  items?: FormItemSnapshot[]
}

export interface FileUploadFolderReattachPlan {
  itemId: string
  index: number
  title: string
  folderName: string
}

/**
 * Plan one Drive subfolder per File upload question (naming helper / tests).
 * Google Forms only binds folders via the UI “Restore” action — not Drive API creates.
 */
export function planFileUploadFolderReattachments(
  items: FormItemSnapshot[],
): FileUploadFolderReattachPlan[] {
  const plans: FileUploadFolderReattachPlan[] = []
  for (const [index, item] of items.entries()) {
    if (!item.itemId || !item.questionItem?.question?.fileUploadQuestion) {
      continue
    }
    const title = item.title?.trim() || `Question ${index + 1}`
    plans.push({
      itemId: item.itemId,
      index,
      title,
      folderName: sanitizeDriveFolderName(title),
    })
  }
  return plans
}

export function sanitizeDriveFolderName(name: string): string {
  return name
    .replaceAll(/[\\/]/g, '-')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'File upload'
}

export function formHasFileUploadQuestions(items: FormItemSnapshot[]): boolean {
  return (items ?? []).some((item) => item.questionItem?.question?.fileUploadQuestion)
}

/**
 * After a Form with File upload questions is copied/transferred to a teacher,
 * Google still points at the previous owner's folders (“Missing File Upload folders”).
 *
 * Creating Drive folders and writing `folderId` via the Forms API does NOT work —
 * Forms ignores those folders and still prompts Restore (leaving duplicate trees).
 * Instead: briefly share the Form with forms@ and click Restore in the Forms UI.
 */
export async function reattachFileUploadFolders(args: {
  accessToken: string
  formId: string
  /** Kept for call-site compatibility; Restore places folders next to the Form. */
  parentFolderId?: string
  formTitle?: string
  headed?: boolean
}): Promise<{ restored: boolean; updated: number }> {
  const form = await googleApiJson<FormSnapshot>(
    args.accessToken,
    `${FORMS_API_BASE}/forms/${args.formId}`,
  )
  if (!formHasFileUploadQuestions(form.items ?? [])) {
    return { restored: false, updated: 0 }
  }

  const permissionId = await ensureFormsWorkspaceWriter(args.accessToken, args.formId)
  try {
    const { restoreFileUploadFoldersViaPlaywrightProcess } = await import(
      './restore-file-upload-folders-playwright-process'
    )
    console.warn(
      `Restoring File upload folders on Form ${args.formId} via Forms UI (forms@ writer)…`,
    )
    const result = await restoreFileUploadFoldersViaPlaywrightProcess({
      formId: args.formId,
      headed: args.headed,
    })
    if (result.restored) {
      console.warn(`Restored File upload folders for Form ${args.formId}`)
    } else {
      console.warn(
        `No Missing File Upload folders banner on Form ${args.formId} (folders may already be bound)`,
      )
    }
    return {
      restored: result.restored,
      updated: result.restored ? planFileUploadFolderReattachments(form.items ?? []).length : 0,
    }
  } finally {
    if (permissionId) {
      await removeDrivePermission(args.accessToken, args.formId, permissionId).catch((error) => {
        console.warn(
          `Could not remove temporary ${FORMS_WORKSPACE_USER} writer on ${args.formId}: ${(error as Error).message}`,
        )
      })
    }
  }
}

async function ensureFormsWorkspaceWriter(
  accessToken: string,
  formId: string,
): Promise<string | null> {
  const existing = await findUserPermissionId(accessToken, formId, FORMS_WORKSPACE_USER)
  if (existing) {
    return null
  }

  const created = await googleApiJson<{ id?: string }>(
    accessToken,
    `${DRIVE_API_BASE}/files/${formId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'user',
        role: 'writer',
        emailAddress: FORMS_WORKSPACE_USER,
      }),
    },
  )
  if (!created.id) {
    throw new Error(`Failed to share Form ${formId} with ${FORMS_WORKSPACE_USER} for folder Restore`)
  }
  return created.id
}

async function findUserPermissionId(
  accessToken: string,
  formId: string,
  email: string,
): Promise<string | null> {
  const listed = await googleApiJson<{
    permissions?: Array<{ id?: string; emailAddress?: string; role?: string }>
  }>(
    accessToken,
    `${DRIVE_API_BASE}/files/${formId}/permissions?supportsAllDrives=true&fields=permissions(id,emailAddress,role)`,
  )
  const match = (listed.permissions ?? []).find(
    (row) => row.emailAddress?.toLowerCase() === email.toLowerCase(),
  )
  return match?.id ?? null
}

async function removeDrivePermission(
  accessToken: string,
  formId: string,
  permissionId: string,
): Promise<void> {
  await googleApiJson(
    accessToken,
    `${DRIVE_API_BASE}/files/${formId}/permissions/${permissionId}?supportsAllDrives=true`,
    { method: 'DELETE' },
  )
}
