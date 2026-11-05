import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Create user',
}

export default function CreateUserSegmentLayout({ children }: { children: ReactNode }) {
  return children
}
