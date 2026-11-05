import { Button } from '@/app/lib/components/ui/buttons/button-compounds'
import { Breadcrumbs } from '@/app/lib/components/ui/layout'
import { ArrowLeft } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
  isLast?: boolean
}

interface PageNavigationProps {
  breadcrumbItems: BreadcrumbItem[]
  showBackButton?: boolean
  onBack?: () => void
  backButtonText?: string
  className?: string
}

export function PageNavigation({
  breadcrumbItems,
  showBackButton = false,
  onBack,
  backButtonText = 'Back',
  className = '',
}: PageNavigationProps) {
  return (
    <div className={`flex items-center gap-3 ${className} mb-2`}>
      {showBackButton && onBack && (
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 size-4" />
          {backButtonText}
        </Button>
      )}
      <Breadcrumbs items={breadcrumbItems} />
    </div>
  )
}
