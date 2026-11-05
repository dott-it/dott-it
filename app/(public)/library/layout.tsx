import type { ReactNode } from 'react'
import { LibraryPublicHeader } from '@/app/lib/components/library/browse'

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LibraryPublicHeader />
      <main id="main-content" className="container mx-auto px-4 py-6">
        {children}
      </main>
    </>
  )
}
