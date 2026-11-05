import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { BackofficeGuard } from '@/components/backoffice/common/backoffice-guard'

export const metadata: Metadata = {
  title: 'Backoffice',
}

export default function BackofficeLayout({ children }: { children: ReactNode }) {
  return <BackofficeGuard>{children}</BackofficeGuard>
}
