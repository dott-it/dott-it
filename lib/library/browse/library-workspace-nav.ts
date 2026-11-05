/** Cross-links between the public OpenSciEd library and the teacher Workspace. */

export const LIBRARY_OPENSCI_ED_HREF = '/library/openscied'

export function workspaceEntryHref(authenticated: boolean): string {
  return authenticated ? '/workspace' : '/login?callbackUrl=%2Fworkspace'
}
