import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; studentEntryId: string }>
}): Promise<Metadata> {
  const { studentEntryId } = await params
  return {
    title: `Student submission ${studentEntryId}`,
  }
}

export default function StudentSubmissionSegmentLayout({ children }: { children: ReactNode }) {
  return children
}
