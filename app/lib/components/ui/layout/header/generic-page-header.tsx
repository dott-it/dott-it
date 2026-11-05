import { ReactNode } from 'react'
import { Typography } from '@/app/lib/components/ui/typography'
import { PageNavigation } from '@/app/lib/components/ui/layout'

interface BreadcrumbItem {
  label: string
  href?: string
  isLast?: boolean
}

interface PageHeaderProps {
  title?: string
  subtitle?: string | ReactNode
  breadcrumbItems: BreadcrumbItem[]
  actions?: ReactNode
  showBackButton?: boolean
  onBack?: () => void
  backButtonText?: string
}

export function GenericPageHeader({
  title,
  subtitle,
  breadcrumbItems,
  actions,
  showBackButton = false,
  onBack,
  backButtonText = 'Back',
}: PageHeaderProps) {
  return (
    <div className="space-y-2">
      {/* Header Content */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          {/* Page Navigation */}
          <PageNavigation
            breadcrumbItems={breadcrumbItems}
            showBackButton={showBackButton}
            onBack={onBack}
            backButtonText={backButtonText}
          />
          {title ? (
            <Typography variant="h1" className="text-xl lg:text-3xl">
              {title}
            </Typography>
          ) : null}
          {subtitle &&
            (typeof subtitle === 'string' ? (
              <Typography variant="body1" color="muted" className="text-sm lg:text-base">
                {subtitle}
              </Typography>
            ) : (
              <div className="text-sm text-muted-foreground lg:text-base">{subtitle}</div>
            ))}
        </div>
        {actions && <div className="w-full self-center lg:w-auto">{actions}</div>}
      </div>
    </div>
  )
}
