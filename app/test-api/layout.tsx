import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'API test',
}

export default function TestApiSegmentLayout({ children }: { children: ReactNode }) {
  return children
}
