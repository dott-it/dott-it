/**
 * Shown on curriculum / library preview Forms.
 * Those Forms stay paste-a-link for file answers; teacher Drive export gets native File upload.
 */
export const CURRICULUM_FORM_EXAMPLE_NOTICE =
  'Library example form — for preview only. Drawing and file prompts here ask students to paste a link. When you export this assessment to your Google Drive, Dott.it creates native File upload questions.'

/** Drop the library-preview notice from a teacher-ready Form description. */
export function descriptionWithoutCurriculumNotice(description = ''): string {
  if (!description.includes(CURRICULUM_FORM_EXAMPLE_NOTICE)) {
    return description.trim()
  }
  return description
    .replaceAll(CURRICULUM_FORM_EXAMPLE_NOTICE, '')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim()
}

/** Default Workspace account used to convert File upload items in the Forms editor UI. */
export const FORMS_WORKSPACE_USER =
  process.env.GOOGLE_FORMS_IMPERSONATE_USER?.trim() || 'forms@demo.dott.it'
