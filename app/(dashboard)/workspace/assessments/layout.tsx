import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Assessments',
}

export default function AssessmentsSegmentLayout({ children }: { children: ReactNode }) {
  return children
}
