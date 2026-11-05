import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Create tenant',
}

export default function CreateTenantSegmentLayout({ children }: { children: ReactNode }) {
  return children
}
