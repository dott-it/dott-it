'use client'

import { useRouter } from 'next/navigation'
import { GenericPageHeader } from '@/app/lib/components/ui/layout'

interface BreadcrumbItem {
  label: string
  href?: string
  isLast?: boolean
}

interface BackofficePageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbItems?: BreadcrumbItem[]
  showBackButton?: boolean
  backButtonText?: string
  onBack?: () => void
}

export function BackofficePageHeader({
  title,
  subtitle,
  breadcrumbItems = [],
  showBackButton = true,
  backButtonText = 'Back to Backoffice',
  onBack,
}: BackofficePageHeaderProps) {
  const router = useRouter()

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Workspace', href: '/workspace' },
    { label: 'Backoffice', href: '/backoffice' },
    ...breadcrumbItems,
  ]

  const handleBack = onBack || (showBackButton ? () => router.push('/backoffice') : undefined)

  return (
    <GenericPageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbItems={defaultBreadcrumbs}
      showBackButton={showBackButton}
      onBack={handleBack}
      backButtonText={backButtonText}
    />
  )
}



