// Card Components
export * from './card'

// Dialog Components
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog/dialog'
// export type { DialogProps } from './dialog/dialog'

// Loading Components
export * from './loading'

// Header Components
export { SimplePageHeader } from './header/simple-page-header'
export { AppHeader } from './header/app-header'
export { GenericPageHeader } from './header/generic-page-header'
export { PageHeaderDemo } from './header/page-header-demo'

// Remove old export
// export * from './page-header'  // Now moved to header/generic-page-header

// Demo Components - Direct exports to avoid barrel files
export { DashboardDemo } from './demo/dashboard-demo'

// Divider Component
export * from './divider'

// Breadcrumbs Component
export * from './breadcrumbs'

// Navigation Component
export { PageNavigation } from './navigation/page-navigation'

// DataTable Component
export * from './data-table'
