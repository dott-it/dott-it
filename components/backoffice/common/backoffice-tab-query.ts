export const BACKOFFICE_TAB_VALUES = [
  'assessments',
  'templates',
  'tenants',
  'users',
] as const

export type BackofficeTab = (typeof BACKOFFICE_TAB_VALUES)[number]

export function backofficeTabFromQuery(value: string | null): BackofficeTab {
  if (value && (BACKOFFICE_TAB_VALUES as readonly string[]).includes(value)) {
    return value as BackofficeTab
  }
  return 'assessments'
}

/** Path that keeps the active tab in the query string so refresh matches the UI. */
export function backofficeTabHref(tab: BackofficeTab, search = ''): string {
  const params = new URLSearchParams(search)
  params.set('tab', tab)
  return `/backoffice?${params.toString()}`
}
