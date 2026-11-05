import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function LoginSegmentLayout({ children }: { children: ReactNode }) {
  return children
}
